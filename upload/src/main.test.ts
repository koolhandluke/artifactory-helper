import * as core from '@actions/core';
import { exec } from '@actions/exec';
import * as shared from '@artifactory-helper/shared';
import { describe, expect, it, vi } from 'vitest';
import { run } from './main.js';
import { createSpecFile, writeFileSpec } from './spec-file/index.js';

vi.mock('@actions/core');
vi.mock('@actions/exec');
vi.mock('@artifactory-helper/shared');
vi.mock('./spec-file/index.js');

describe('run', () => {
  describe('folder mode', () => {
    it('uploads folder/* directly when folder input is set', async () => {
      vi.mocked(core.getInput).mockImplementation((name) =>
        name === 'folder' ? 'my-build-output' : '',
      );
      vi.mocked(shared.getArtifactoryPath).mockReturnValue(
        'webex-actions-generic/build-artifacts/owner/repo/123',
      );

      await run();

      expect(exec).toHaveBeenCalledWith('jfrog', [
        'rt',
        'upload',
        'my-build-output/*',
        'webex-actions-generic/build-artifacts/owner/repo/123/',
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
      expect(core.info).toHaveBeenCalledWith('Files parsed: file1.txt,file2.txt');
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
    });
  });
});
