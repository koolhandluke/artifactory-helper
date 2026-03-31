import * as core from '@actions/core';
import type { ExecOptions } from '@actions/exec';
import * as shared from '@artifactory-helper/shared';
import { describe, expect, it, vi } from 'vitest';
import { run } from './main.js';

vi.mock('@actions/core');
vi.mock('@artifactory-helper/shared');

describe('download-from-artifactory', () => {
  const setupEnv = () => {
    vi.stubEnv('GITHUB_REPOSITORY', 'webex-shared-actions/some-git-repo');
    vi.stubEnv('GITHUB_RUN_ID', '12233445566');
    vi.stubEnv(
      'ARTIFACTORY_BUILD_ARTIFACTS_PATH',
      'webex-actions-generic-local/build-artifacts',
    );
  };

  const mockRunCliAndGetOutput = (fail?: (args: string[]) => boolean) => {
    vi.mocked(shared.runCliAndGetOutput).mockImplementation(
      async (args: string[], _options?: ExecOptions) => {
        if (fail?.(args)) {
          return Promise.reject('Mock Failure in JFrog CLI');
        }
        return Promise.resolve(`Command Executed: ${args.join(' ')}`);
      },
    );
  };

  it('Single File', async () => {
    setupEnv();
    vi.mocked(core.getInput).mockImplementation((name) => {
      switch (name) {
        case 'flat':
          return 'true';
        case 'output-dir':
          return 'download-artifact-dir';
        case 'artifactory-path':
          return '';
        default:
          return '';
      }
    });
    vi.mocked(shared.getArtifactoryPath).mockReturnValue(
      'webex-actions-generic-local/build-artifacts/webex-shared-actions/some-git-repo/12233445566',
    );
    vi.mocked(shared.parseInputAsArray).mockReturnValue(['folder/file.txt']);
    vi.mocked(shared.isEmpty).mockReturnValue(false);
    vi.mocked(shared.getWorkingDirectory).mockReturnValue('/workspace');
    mockRunCliAndGetOutput();

    await run();

    const expectedArgs = [
      'rt',
      'dl',
      '--flat=true',
      'webex-actions-generic-local/build-artifacts/webex-shared-actions/some-git-repo/12233445566/folder/file.txt',
      'folder/file.txt',
    ];
    expect(shared.runCliAndGetOutput).toHaveBeenCalledWith(expectedArgs, {
      cwd: '/workspace',
    });
  });

  it('Multiple Files', async () => {
    setupEnv();
    vi.mocked(core.getInput).mockImplementation((name) => {
      switch (name) {
        case 'flat':
          return 'true';
        case 'output-dir':
          return 'download-artifact-dir';
        case 'artifactory-path':
          return '';
        default:
          return '';
      }
    });
    vi.mocked(shared.getArtifactoryPath).mockReturnValue(
      'webex-actions-generic-local/build-artifacts/webex-shared-actions/some-git-repo/12233445566',
    );
    vi.mocked(shared.parseInputAsArray).mockReturnValue([
      'folder/file.zip',
      'folder/file.tar.gz',
      'folder/file.rar',
      'folder/file.war',
    ]);
    vi.mocked(shared.isEmpty).mockReturnValue(false);
    vi.mocked(shared.getWorkingDirectory).mockReturnValue('/workspace');
    mockRunCliAndGetOutput();

    await run();

    expect(shared.runCliAndGetOutput).toHaveBeenCalledTimes(4);
    expect(vi.mocked(shared.runCliAndGetOutput).mock.calls[0][0]).toEqual([
      'rt',
      'dl',
      '--flat=true',
      'webex-actions-generic-local/build-artifacts/webex-shared-actions/some-git-repo/12233445566/folder/file.zip',
      'folder/file.zip',
    ]);
  });

  it('Custom Output Directory (no files specified)', async () => {
    setupEnv();
    vi.mocked(core.getInput).mockImplementation((name) => {
      switch (name) {
        case 'flat':
          return 'true';
        case 'output-dir':
          return 'some-output-dir';
        case 'artifactory-path':
          return '';
        default:
          return '';
      }
    });
    vi.mocked(shared.getArtifactoryPath).mockReturnValue(
      'webex-actions-generic-local/build-artifacts/webex-shared-actions/some-git-repo/12233445566',
    );
    vi.mocked(shared.parseInputAsArray).mockReturnValue([]);
    vi.mocked(shared.isEmpty).mockReturnValue(false);
    vi.mocked(shared.getWorkingDirectory).mockReturnValue('/workspace');
    mockRunCliAndGetOutput();

    await run();

    expect(shared.runCliAndGetOutput).toHaveBeenCalledWith(
      [
        'rt',
        'dl',
        '--flat=true',
        'webex-actions-generic-local/build-artifacts/webex-shared-actions/some-git-repo/12233445566/',
        'some-output-dir/',
      ],
      { cwd: '/workspace' },
    );
  });

  it('Empty Inputs (falls back to default output dir)', async () => {
    setupEnv();
    vi.mocked(core.getInput).mockImplementation((name) => {
      switch (name) {
        case 'flat':
          return 'true';
        case 'output-dir':
          return '';
        case 'artifactory-path':
          return '';
        default:
          return '';
      }
    });
    vi.mocked(shared.getArtifactoryPath).mockReturnValue(
      'webex-actions-generic-local/build-artifacts/webex-shared-actions/some-git-repo/12233445566',
    );
    vi.mocked(shared.parseInputAsArray).mockReturnValue([]);
    vi.mocked(shared.isEmpty).mockReturnValue(false);
    vi.mocked(shared.getWorkingDirectory).mockReturnValue('/workspace');
    mockRunCliAndGetOutput();

    await run();

    expect(shared.runCliAndGetOutput).toHaveBeenCalledWith(
      [
        'rt',
        'dl',
        '--flat=true',
        'webex-actions-generic-local/build-artifacts/webex-shared-actions/some-git-repo/12233445566/',
        './',
      ],
      { cwd: '/workspace' },
    );
  });

  it('JFrog CLI Error calls setFailed', async () => {
    setupEnv();
    vi.mocked(core.getInput).mockImplementation((name) => {
      switch (name) {
        case 'flat':
          return 'true';
        case 'output-dir':
          return '';
        case 'artifactory-path':
          return '';
        default:
          return '';
      }
    });
    vi.mocked(shared.getArtifactoryPath).mockReturnValue(
      'webex-actions-generic-local/build-artifacts/webex-shared-actions/some-git-repo/12233445566',
    );
    vi.mocked(shared.parseInputAsArray).mockReturnValue([
      'INVALID_ARTIFACTORY_PATH',
    ]);
    vi.mocked(shared.isEmpty).mockReturnValue(false);
    vi.mocked(shared.getWorkingDirectory).mockReturnValue('/workspace');
    mockRunCliAndGetOutput((args) =>
      args[3].includes('INVALID_ARTIFACTORY_PATH'),
    );

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Some downloads failed'),
    );
  });

  it('flat=false disables flat mode', async () => {
    setupEnv();
    vi.mocked(core.getInput).mockImplementation((name) => {
      switch (name) {
        case 'flat':
          return 'false';
        case 'output-dir':
          return 'out';
        case 'artifactory-path':
          return '';
        default:
          return '';
      }
    });
    vi.mocked(shared.getArtifactoryPath).mockReturnValue(
      'webex-actions-generic-local/build-artifacts/webex-shared-actions/some-git-repo/12233445566',
    );
    vi.mocked(shared.parseInputAsArray).mockReturnValue(['file.txt']);
    vi.mocked(shared.isEmpty).mockReturnValue(false);
    vi.mocked(shared.getWorkingDirectory).mockReturnValue('/workspace');
    mockRunCliAndGetOutput();

    await run();

    expect(vi.mocked(shared.runCliAndGetOutput).mock.calls[0][0][2]).toBe(
      '--flat=false',
    );
  });
});
