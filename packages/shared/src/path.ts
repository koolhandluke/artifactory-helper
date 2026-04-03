/**
 * Construct the Artifactory artifact path.
 * Format: {JF_ARTIFACTS_REPO}/{org}/{repo}/runs/{run_id}
 * Uses GITHUB_REPOSITORY (owner/repo format), GITHUB_RUN_ID, and JF_ARTIFACTS_REPO env vars.
 * @returns The full Artifactory path
 */
export function getArtifactoryPath(): string {
  const { GITHUB_REPOSITORY, GITHUB_RUN_ID, JF_ARTIFACTS_REPO } = process.env;
  const repo = JF_ARTIFACTS_REPO || 'build-artifacts';
  return `${repo}/${GITHUB_REPOSITORY}/runs/${GITHUB_RUN_ID}`;
}
