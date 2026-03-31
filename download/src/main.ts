import * as core from '@actions/core';
import {
  getArtifactoryPath,
  getWorkingDirectory,
  isEmpty,
  parseInputAsArray,
  runCliAndGetOutput,
} from '@artifactory-helper/shared';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const flatInput = core.getInput('flat');
  const flat = flatInput !== 'false';
  const errorMessages: string[] = [];

  try {
    core.startGroup('Downloading artifact from Artifactory');

    const downloadPath = core.getInput('output-dir') || '.';
    const artifactoryPath = getArtifactoryPath(
      core.getInput('artifactory-path') || undefined,
    );
    const artifactoryPaths = parseInputAsArray('files');

    core.debug(`Called action with value ${artifactoryPath}`);

    // Process folder
    if (!isEmpty(artifactoryPath)) {
      try {
        if (artifactoryPaths.length > 0) {
          for (const pathItem of artifactoryPaths) {
            await downloadFolder(
              `${artifactoryPath}/${pathItem}`,
              pathItem,
              flat,
            );
            core.info(
              `Artifactory Path ${artifactoryPath}/${pathItem} downloaded successfully.`,
            );
          }
        } else {
          await downloadFolder(
            resolveArtifactoryPath(artifactoryPath),
            resolveArtifactoryPath(downloadPath),
            flat,
          );
          core.info(
            `Artifactory Path ${artifactoryPath} downloaded successfully.`,
          );
        }
      } catch (error) {
        const errorMessage = `Download failed for ${artifactoryPath}: ${error instanceof Error ? error.message : String(error)}`;
        core.warning(errorMessage);
        errorMessages.push(errorMessage);
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  } finally {
    core.endGroup();
    if (errorMessages.length > 0) {
      core.setFailed(`Some downloads failed:\n${errorMessages.join('\n')}`);
    }
  }
}

async function downloadFolder(
  artifactoryPath: string,
  downloadPath: string,
  flat = true,
): Promise<void> {
  try {
    const jfArgs = [
      'rt',
      'dl',
      `--flat=${flat}`,
      artifactoryPath,
      downloadPath,
    ];
    await runCliAndGetOutput(jfArgs, { cwd: getWorkingDirectory() });
  } catch (error) {
    core.warning(
      `Failed to download artifact ${artifactoryPath}. Error: ${error}`,
    );
    throw error;
  }
}

function resolveArtifactoryPath(p: string): string {
  return p.endsWith('/') ? p : `${p}/`;
}
