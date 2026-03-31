import { describe, expect, it, vi } from 'vitest';
import { getArtifactoryPath } from '../path.js';

describe('getArtifactoryPath', () => {
  it('uses GITHUB_RUN_ID when no override', () => {
    vi.stubEnv('GITHUB_REPOSITORY', 'owner/repo');
    vi.stubEnv('GITHUB_RUN_ID', '99999');
    vi.stubEnv('ARTIFACTORY_BUILD_ARTIFACTS_PATH', '');
    expect(getArtifactoryPath()).toBe(
      'webex-actions-generic/build-artifacts/owner/repo/99999',
    );
  });

  it('uses override when provided', () => {
    vi.stubEnv('GITHUB_REPOSITORY', 'owner/repo');
    vi.stubEnv('GITHUB_RUN_ID', '99999');
    vi.stubEnv('ARTIFACTORY_BUILD_ARTIFACTS_PATH', '');
    expect(getArtifactoryPath('my-folder')).toBe(
      'webex-actions-generic/build-artifacts/owner/repo/my-folder',
    );
  });

  it('uses custom ARTIFACTORY_BUILD_ARTIFACTS_PATH', () => {
    vi.stubEnv('GITHUB_REPOSITORY', 'org/project');
    vi.stubEnv('GITHUB_RUN_ID', '12345');
    vi.stubEnv('ARTIFACTORY_BUILD_ARTIFACTS_PATH', 'my-repo/artifacts');
    expect(getArtifactoryPath()).toBe('my-repo/artifacts/org/project/12345');
  });
});
