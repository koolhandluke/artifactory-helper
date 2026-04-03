import { stat } from 'node:fs/promises';
import * as core from '@actions/core';
import { exec } from '@actions/exec';
import * as shared from '@artifactory-helper/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from './main.js';
import { createSpecFile, writeFileSpec } from './spec-file/index.js';

vi.mock('@actions/core');
vi.mock('@actions/exec');
vi.mock('@artifactory-helper/shared');
vi.mock('./spec-file/index.js');
vi.mock('node:fs/promises', () => ({
  stat: vi.fn().mockResolvedValue({ size: 1024 }),
}));

describe('run', () => {
  describe('folder mode', () => {
    it('uploads folder/* directly when folder input is set', async () => {
      vi.mocked(core.getInput).mockImplementation((name) =>
        name === 'folder' ? 'my-build-output' : '',
      );
      vi.mocked(shared.getArtifactoryPath).mockReturnValue(
        'build-artifacts/owner/repo/runs/123',
      );

      await run();

      expect(exec).toHaveBeenCalledWith('jfrog', [
        'rt',
        'upload',
        'my-build-output/*',
        'build-artifacts/owner/repo/runs/123/',
      ]);
      expect(createSpecFile).not.toHaveBeenCalled();
    });

    it('folder mode skips spec file even if files is also set', async () => {
      vi.mocked(core.getInput).mockImplementation((name) => {
        if (name === 'folder') return 'dist';
        if (name === 'files') return 'some-file.txt';
        return '';
      });
      vi.mocked(shared.getArtifactoryPath).mockReturnValue('path/to/target');
      vi.mocked(shared.parseInputAsArray).mockReturnValue(['some-file.txt']);

      await run();

      expect(exec).toHaveBeenCalledWith('jfrog', [
        'rt',
        'upload',
        'dist/*',
        'path/to/target/',
      ]);
      expect(createSpecFile).not.toHaveBeenCalled();
    });
  });

  describe('files mode', () => {
    let summaryMock: {
      addRaw: ReturnType<typeof vi.fn>;
      write: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      summaryMock = {
        addRaw: vi.fn().mockReturnThis(),
        write: vi.fn().mockResolvedValue(undefined),
      };
      Object.defineProperty(core, 'summary', {
        value: summaryMock,
        writable: true,
        configurable: true,
      });
    });

    it('should setFailed when getArtifactoryPath throws', async () => {
      vi.mocked(core.getInput).mockReturnValue('');
      vi.mocked(shared.parseInputAsArray).mockReturnValue(['file1.txt']);
      vi.mocked(shared.getArtifactoryPath).mockImplementation(() => {
        throw new Error('GITHUB_REPOSITORY not set');
      });

      await run();

      expect(vi.mocked(core.setFailed)).toHaveBeenCalledWith(
        'GITHUB_REPOSITORY not set',
      );
    });

    it('should warn when no files are provided', async () => {
      vi.mocked(core.getInput).mockReturnValue('');
      vi.mocked(shared.getArtifactoryPath).mockReturnValue('destination');
      vi.mocked(shared.parseInputAsArray).mockReturnValue([]);

      await run();

      expect(core.warning).toHaveBeenCalledWith(
        'No valid files provided. Skipping spec file creation.',
      );
    });

    it('should setFailed when writing the spec file fails', async () => {
      vi.mocked(core.getInput).mockReturnValue('');
      vi.mocked(shared.getArtifactoryPath).mockReturnValue('destination');
      vi.mocked(shared.parseInputAsArray).mockReturnValue([
        'file1.txt',
        'file2.txt',
      ]);
      vi.mocked(writeFileSpec).mockRejectedValue(
        new Error('Failed to write spec file'),
      );

      await run();

      expect(createSpecFile).toHaveBeenCalledWith('destination', [
        'file1.txt',
        'file2.txt',
      ]);
      expect(core.info).toHaveBeenCalledWith(
        'Files parsed: file1.txt,file2.txt',
      );
      expect(core.setFailed).toHaveBeenCalledWith('Failed to write spec file');
    });

    it('should upload via spec file on happy path', async () => {
      vi.mocked(core.getInput).mockReturnValue('');
      vi.mocked(shared.getArtifactoryPath).mockReturnValue('destination');
      vi.mocked(shared.parseInputAsArray).mockReturnValue([
        'file1.txt',
        'file2.txt',
      ]);
      vi.mocked(createSpecFile).mockReturnValue({ files: [] });
      vi.mocked(writeFileSpec).mockResolvedValue('/path/to/spec-file.json');

      await run();

      expect(exec).toHaveBeenCalledWith('jfrog', [
        'rt',
        'upload',
        '--spec',
        '/path/to/spec-file.json',
      ]);
      expect(summaryMock.write).toHaveBeenCalled();
    });

    it('writes upload summary with total count and size', async () => {
      vi.mocked(core.getInput).mockReturnValue('');
      vi.mocked(shared.getArtifactoryPath).mockReturnValue(
        'my-repo/owner/repo/42',
      );
      vi.mocked(shared.parseInputAsArray).mockReturnValue([
        'dist/app.tar.gz',
        'dist/app.war',
      ]);
      vi.mocked(stat).mockResolvedValueOnce({ size: 2048 } as Awaited<
        ReturnType<typeof stat>
      >);
      vi.mocked(stat).mockResolvedValueOnce({ size: 512 } as Awaited<
        ReturnType<typeof stat>
      >);
      vi.mocked(createSpecFile).mockReturnValue({ files: [] });
      vi.mocked(writeFileSpec).mockResolvedValue('/path/to/spec.json');

      await run();

      expect(summaryMock.addRaw).toHaveBeenCalledWith(
        'Uploaded 2 files (2.5 KB) to `my-repo/owner/repo/42`',
      );
    });

    it('uses 0 size for files that cannot be stat-ed', async () => {
      vi.mocked(core.getInput).mockReturnValue('');
      vi.mocked(shared.getArtifactoryPath).mockReturnValue('destination');
      vi.mocked(shared.parseInputAsArray).mockReturnValue(['missing.txt']);
      vi.mocked(stat).mockRejectedValueOnce(new Error('ENOENT'));
      vi.mocked(createSpecFile).mockReturnValue({ files: [] });
      vi.mocked(writeFileSpec).mockResolvedValue('/path/to/spec.json');

      await run();

      expect(summaryMock.addRaw).toHaveBeenCalledWith(
        'Uploaded 1 file (0 B) to `destination`',
      );
    });

    describe('build info', () => {
      it('does not call build-add-git or build-publish when disabled', async () => {
        vi.mocked(core.getInput).mockImplementation((name) => {
          if (name === 'publish-build-info') return 'false';
          return '';
        });
        vi.mocked(shared.getArtifactoryPath).mockReturnValue('destination');
        vi.mocked(shared.parseInputAsArray).mockReturnValue(['file.txt']);
        vi.mocked(createSpecFile).mockReturnValue({ files: [] });
        vi.mocked(writeFileSpec).mockResolvedValue('/path/to/spec.json');

        await run();

        expect(exec).not.toHaveBeenCalledWith(
          'jfrog',
          expect.arrayContaining(['build-add-git']),
        );
        expect(exec).not.toHaveBeenCalledWith(
          'jfrog',
          expect.arrayContaining(['build-publish']),
        );
      });

      it('publishes build info when ARTIFACTORY_PUBLISH_BUILD_INFO env var is true', async () => {
        vi.mocked(core.getInput).mockReturnValue('');
        vi.stubEnv('ARTIFACTORY_PUBLISH_BUILD_INFO', 'true');
        vi.stubEnv('GITHUB_REPOSITORY', 'owner/repo');
        vi.stubEnv('GITHUB_RUN_NUMBER', '42');
        vi.mocked(shared.getArtifactoryPath).mockReturnValue('destination');
        vi.mocked(shared.parseInputAsArray).mockReturnValue(['file.txt']);
        vi.mocked(createSpecFile).mockReturnValue({ files: [] });
        vi.mocked(writeFileSpec).mockResolvedValue('/path/to/spec.json');

        await run();

        expect(exec).toHaveBeenCalledWith('jfrog', [
          'rt',
          'build-add-git',
          'owner/repo',
          '42',
        ]);
        expect(exec).toHaveBeenCalledWith('jfrog', [
          'rt',
          'build-publish',
          'owner/repo',
          '42',
        ]);
        expect(exec).toHaveBeenCalledWith('jfrog', [
          'rt',
          'upload',
          '--spec',
          '/path/to/spec.json',
          '--build-name',
          'owner/repo',
          '--build-number',
          '42',
        ]);
      });

      it('input false overrides ARTIFACTORY_PUBLISH_BUILD_INFO=true env var', async () => {
        vi.mocked(core.getInput).mockImplementation((name) => {
          if (name === 'publish-build-info') return 'false';
          return '';
        });
        vi.stubEnv('ARTIFACTORY_PUBLISH_BUILD_INFO', 'true');
        vi.mocked(shared.getArtifactoryPath).mockReturnValue('destination');
        vi.mocked(shared.parseInputAsArray).mockReturnValue(['file.txt']);
        vi.mocked(createSpecFile).mockReturnValue({ files: [] });
        vi.mocked(writeFileSpec).mockResolvedValue('/path/to/spec.json');

        await run();

        expect(exec).not.toHaveBeenCalledWith(
          'jfrog',
          expect.arrayContaining(['build-publish']),
        );
      });

      it('uses custom build-name and build-number inputs', async () => {
        vi.mocked(core.getInput).mockImplementation((name) => {
          if (name === 'publish-build-info') return 'true';
          if (name === 'build-name') return 'my-build';
          if (name === 'build-number') return '99';
          return '';
        });
        vi.mocked(shared.getArtifactoryPath).mockReturnValue('destination');
        vi.mocked(shared.parseInputAsArray).mockReturnValue(['file.txt']);
        vi.mocked(createSpecFile).mockReturnValue({ files: [] });
        vi.mocked(writeFileSpec).mockResolvedValue('/path/to/spec.json');

        await run();

        expect(exec).toHaveBeenCalledWith('jfrog', [
          'rt',
          'build-add-git',
          'my-build',
          '99',
        ]);
        expect(exec).toHaveBeenCalledWith('jfrog', [
          'rt',
          'build-publish',
          'my-build',
          '99',
        ]);
      });

      it('passes --build-name and --build-number to the upload spec command', async () => {
        vi.mocked(core.getInput).mockImplementation((name) => {
          if (name === 'publish-build-info') return 'true';
          if (name === 'build-name') return 'my-build';
          if (name === 'build-number') return '99';
          return '';
        });
        vi.mocked(shared.getArtifactoryPath).mockReturnValue('destination');
        vi.mocked(shared.parseInputAsArray).mockReturnValue(['file.txt']);
        vi.mocked(createSpecFile).mockReturnValue({ files: [] });
        vi.mocked(writeFileSpec).mockResolvedValue('/path/to/spec.json');

        await run();

        expect(exec).toHaveBeenCalledWith('jfrog', [
          'rt',
          'upload',
          '--spec',
          '/path/to/spec.json',
          '--build-name',
          'my-build',
          '--build-number',
          '99',
        ]);
      });

      it('appends build info line to job summary', async () => {
        vi.mocked(core.getInput).mockImplementation((name) => {
          if (name === 'publish-build-info') return 'true';
          if (name === 'build-name') return 'my-build';
          if (name === 'build-number') return '99';
          return '';
        });
        vi.mocked(shared.getArtifactoryPath).mockReturnValue('destination');
        vi.mocked(shared.parseInputAsArray).mockReturnValue(['file.txt']);
        vi.mocked(createSpecFile).mockReturnValue({ files: [] });
        vi.mocked(writeFileSpec).mockResolvedValue('/path/to/spec.json');

        await run();

        expect(summaryMock.addRaw).toHaveBeenCalledWith(
          '\nBuild info published: `my-build` #`99`',
        );
      });
    });
  });
});
