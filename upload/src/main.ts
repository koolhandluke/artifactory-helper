import { stat } from 'node:fs/promises';
import * as core from '@actions/core';
import { exec } from '@actions/exec';
import {
  getArtifactoryPath,
  parseInputAsArray,
} from '@artifactory-helper/shared';
import { createSpecFile, writeFileSpec } from './spec-file/index.js';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function getFileSize(filePath: string): Promise<number> {
  try {
    const { size } = await stat(filePath);
    return size;
  } catch {
    return 0;
  }
}

export async function run(): Promise<void> {
  try {
    const artifactoryPath = getArtifactoryPath();

    const folder = core.getInput('folder');

    if (folder) {
      core.info(`Uploading folder: ${folder}/* → ${artifactoryPath}/`);
      await exec('jfrog', [
        'rt',
        'upload',
        `${folder}/*`,
        `${artifactoryPath}/`,
      ]);
      return;
    }

    const filesArray = parseInputAsArray('files');

    if (filesArray.length === 0) {
      core.warning('No valid files provided. Skipping spec file creation.');
      return;
    }

    core.info(`Files parsed: ${filesArray}`);

    const fileSizes = await Promise.all(
      filesArray.map(async (file) => ({
        file,
        size: await getFileSize(file),
      })),
    );

    // Resolve build info flag: input takes priority over env var
    const publishBuildInfoInput = core.getInput('publish-build-info');
    let publishBuildInfo =
      publishBuildInfoInput !== ''
        ? publishBuildInfoInput === 'true'
        : process.env.ARTIFACTORY_PUBLISH_BUILD_INFO === 'true';

    const buildName =
      core.getInput('build-name') || process.env.GITHUB_REPOSITORY || '';
    const buildNumber =
      core.getInput('build-number') || process.env.GITHUB_RUN_NUMBER || '';

    if (publishBuildInfo && (!buildName || !buildNumber)) {
      core.warning(
        'Skipping build info: build-name and build-number (or GITHUB_REPOSITORY and GITHUB_RUN_NUMBER) must be set.',
      );
      publishBuildInfo = false;
    }

    const fileSpec = createSpecFile(artifactoryPath, filesArray);
    const fileSpecPath = await writeFileSpec(fileSpec);

    core.info(`Filespec created at: ${fileSpecPath}`);

    const uploadArgs = ['rt', 'upload', '--spec', fileSpecPath];
    if (publishBuildInfo) {
      uploadArgs.push('--build-name', buildName, '--build-number', buildNumber);
    }

    await exec('jfrog', uploadArgs);

    if (publishBuildInfo) {
      try {
        await exec('jfrog', ['rt', 'build-add-git', buildName, buildNumber]);
      } catch (e) {
        core.warning(
          `build-add-git failed (no .git?): ${e instanceof Error ? e.message : e}`,
        );
      }
      await exec('jfrog', ['rt', 'build-publish', buildName, buildNumber]);
    }

    const totalBytes = fileSizes.reduce((sum, { size }) => sum + size, 0);
    const summaryBuilder = core.summary.addRaw(
      `Uploaded ${filesArray.length} file${filesArray.length === 1 ? '' : 's'} (${formatBytes(totalBytes)}) to \`${artifactoryPath}\``,
    );
    if (publishBuildInfo) {
      summaryBuilder.addRaw(
        `\nBuild info published: \`${buildName}\` #\`${buildNumber}\``,
      );
    }
    await summaryBuilder.write();
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`${error.message}`);
      return;
    }
    core.setFailed(`${error}`);
  }
}
