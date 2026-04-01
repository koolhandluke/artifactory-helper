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
    const artifactoryPath = getArtifactoryPath(
      core.getInput('artifactory-path') || undefined,
    );

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

    const fileSpec = createSpecFile(artifactoryPath, filesArray);
    const fileSpecPath = await writeFileSpec(fileSpec);

    core.info(`Filespec created at: ${fileSpecPath}`);

    await exec('jfrog', ['rt', 'upload', '--spec', fileSpecPath]);

    const totalBytes = fileSizes.reduce((sum, { size }) => sum + size, 0);
    await core.summary
      .addRaw(
        `Uploaded ${filesArray.length} file${filesArray.length === 1 ? '' : 's'} (${formatBytes(totalBytes)}) to \`${artifactoryPath}\``,
      )
      .write();
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`${error.message}`);
    }
    core.setFailed(`${error}`);
  }
}
