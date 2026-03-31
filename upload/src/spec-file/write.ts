import fs from 'node:fs/promises';
import path from 'node:path';
import * as core from '@actions/core';
import type { FileSpec } from './create.js';

function createTempPath(): string {
  const tempDir = process.env.RUNNER_TEMP;
  if (!tempDir) {
    core.setFailed('RUNNER_TEMP is not defined');
    throw new Error('RUNNER_TEMP is not defined');
  }
  const random = Math.floor(Math.random() * 1_000_000_000_000);
  return path.join(tempDir, `${random}.filespec.json`);
}

export async function writeFileSpec(fileSpec: FileSpec): Promise<string> {
  const specFilePath = createTempPath();
  const json = JSON.stringify(fileSpec, null, 2);
  await fs.writeFile(specFilePath, json);
  core.setOutput('filespec', specFilePath);
  return specFilePath;
}
