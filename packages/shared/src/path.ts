/**
 * Construct the Artifactory artifact path.
 * Uses GITHUB_REPOSITORY (owner/repo format) and GITHUB_RUN_ID env vars.
 * @param override - Optional override for the run-id segment (e.g. a fixed folder name)
 * @returns The full Artifactory path
 */
export function getArtifactoryPath(override?: string): string {
  const { GITHUB_REPOSITORY, GITHUB_RUN_ID, ARTIFACTORY_BUILD_ARTIFACTS_PATH } =
    process.env;
  const basePath =
    ARTIFACTORY_BUILD_ARTIFACTS_PATH || 'webex-actions-generic/build-artifacts';
  const suffix = override || GITHUB_RUN_ID;
  return `${basePath}/${GITHUB_REPOSITORY}/${suffix}`;
}
