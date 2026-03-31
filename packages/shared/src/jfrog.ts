import * as core from '@actions/core';
import {
  type ExecOptions,
  type ExecOutput,
  exec,
  getExecOutput,
} from '@actions/exec';

/**
 * Execute JFrog CLI command.
 * This GitHub Action downloads the requested 'jfrog' executable and stores it as 'jfrog' and 'jf'.
 * Therefore, the 'jf' executable is expected to be in the path also for older CLI versions.
 * @param args - CLI arguments
 * @param options - Execution options
 */
export async function runCli(
  args: string[],
  options?: ExecOptions,
): Promise<void> {
  const res: number = await exec('jf', args, {
    ...options,
    ignoreReturnCode: true,
  });
  if (res !== core.ExitCode.Success) {
    throw new Error(`JFrog CLI exited with exit code: ${res}`);
  }
}

/**
 * Execute JFrog CLI command and capture its output.
 * The command's output is captured and returned as a string.
 * The command is executed silently, meaning its output will not be printed to the console.
 * If the command fails (i.e., exits with a non-success code), an error is thrown.
 * @param args - CLI arguments
 * @param options
 * @returns The standard output of the CLI command as a string.
 * @throws An error if the JFrog CLI command exits with a non-success code.
 */
export async function runCliAndGetOutput(
  args: string[],
  options?: ExecOptions,
): Promise<string> {
  const output: ExecOutput = await getExecOutput('jf', args, {
    ...options,
    ignoreReturnCode: true,
  });
  if (output.exitCode !== core.ExitCode.Success) {
    if (options?.silent) {
      core.info(output.stdout);
      core.info(output.stderr);
    }
    throw new Error(`JFrog CLI exited with exit code ${output.exitCode}`);
  }
  return output.stdout;
}

/**
 * Get the working directory from GITHUB_WORKSPACE environment variable.
 * @returns The working directory.
 * @throws An error if GITHUB_WORKSPACE is not defined.
 */
export function getWorkingDirectory(): string {
  const workingDirectory: string | undefined = process.env.GITHUB_WORKSPACE;
  if (!workingDirectory) {
    throw new Error('GITHUB_WORKSPACE is not defined.');
  }
  return workingDirectory;
}

/**
 * Check if a string or an array of strings is empty.
 * @param value - The string or array of strings to check.
 * @returns True if the value is empty, otherwise false.
 */
export function isEmpty(value: string | string[]): boolean {
  if (Array.isArray(value)) {
    return value.every((item) => isEmpty(item));
  }
  return value.trim() === '';
}
