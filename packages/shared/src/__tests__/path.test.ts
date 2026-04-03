import { describe, expect, it, vi } from 'vitest';
import { getArtifactoryPath } from '../path.js';

describe('getArtifactoryPath', () => {
  it('returns {JF_ARTIFACTS_REPO}/{org}/{repo}/runs/{run_id}', () => {
    vi.stubEnv('GITHUB_REPOSITORY', 'owner/repo');
    vi.stubEnv('GITHUB_RUN_ID', '99999');
    vi.stubEnv('JF_ARTIFACTS_REPO', '');
    expect(getArtifactoryPath()).toBe('build-artifacts/owner/repo/runs/99999');
  });

  it('uses custom JF_ARTIFACTS_REPO when set', () => {
    vi.stubEnv('GITHUB_REPOSITORY', 'org/project');
    vi.stubEnv('GITHUB_RUN_ID', '12345');
    vi.stubEnv('JF_ARTIFACTS_REPO', 'my-repo');
    expect(getArtifactoryPath()).toBe('my-repo/org/project/runs/12345');
  });
});
