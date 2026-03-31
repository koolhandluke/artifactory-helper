import * as core from '@actions/core';
import { exec } from '@actions/exec';
import {
  getArtifactoryPath,
  parseInputAsArray,
} from '@artifactory-helper/shared';
import { createSpecFile, writeFileSpec } from './spec-file/index.js';

export async function run(): Promise<void> {
  try {
    const artifactoryPath = getArtifactoryPath(
      core.getInput('artifactory-path') || undefined,
    );

    const folder = core.getInput('folder');

    if (folder) {
      core.info(`Uploading folder: ${folder}/* → ${artifactoryPath}/`);
      await exec('jfrog', ['rt', 'upload', `${folder}/*`, `${artifactoryPath}/`]);
      return;
    }

    const filesArray = parseInputAsArray('files');

    if (filesArray.length === 0) {
      core.warning('No valid files provided. Skipping spec file creation.');
      return;
    }

    core.info(`Files parsed: ${filesArray}`);
    const fileSpec = createSpecFile(artifactoryPath, filesArray);
    const fileSpecPath = await writeFileSpec(fileSpec);

    core.info(`Filespec created at: ${fileSpecPath}`);

    await exec('jfrog', ['rt', 'upload', '--spec', fileSpecPath]);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`${error.message}`);
    }
    core.setFailed(`${error}`);
  }
}
