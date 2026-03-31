import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { describe, expect, it, vi } from 'vitest';
import {
  getWorkingDirectory,
  isEmpty,
  runCli,
  runCliAndGetOutput,
} from '../jfrog.js';

vi.mock('@actions/core');
vi.mock('@actions/exec');

describe('runCli', () => {
  it('resolves when exit code is success', async () => {
    vi.mocked(exec.exec).mockResolvedValue(core.ExitCode.Success);
    await expect(runCli(['rt', 'ping'])).resolves.toBeUndefined();
  });

  it('throws when exit code is non-zero', async () => {
    vi.mocked(exec.exec).mockResolvedValue(1);
    await expect(runCli(['rt', 'ping'])).rejects.toThrow(
      'JFrog CLI exited with exit code: 1',
    );
  });
});

describe('runCliAndGetOutput', () => {
  it('returns stdout on success', async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      exitCode: core.ExitCode.Success,
      stdout: 'output',
      stderr: '',
    });
    await expect(runCliAndGetOutput(['rt', 'dl', 'path'])).resolves.toBe(
      'output',
    );
  });

  it('throws on non-zero exit code', async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      exitCode: 1,
      stdout: '',
      stderr: 'error',
    });
    await expect(runCliAndGetOutput(['rt', 'dl', 'path'])).rejects.toThrow(
      'JFrog CLI exited with exit code 1',
    );
  });
});

describe('getWorkingDirectory', () => {
  it('returns GITHUB_WORKSPACE when set', () => {
    vi.stubEnv('GITHUB_WORKSPACE', '/home/runner/work');
    expect(getWorkingDirectory()).toBe('/home/runner/work');
  });

  it('throws when GITHUB_WORKSPACE is not set', () => {
    vi.stubEnv('GITHUB_WORKSPACE', '');
    expect(() => getWorkingDirectory()).toThrow(
      'GITHUB_WORKSPACE is not defined.',
    );
  });
});

describe('isEmpty', () => {
  it('returns true for empty string', () => {
    expect(isEmpty('')).toBe(true);
  });

  it('returns true for whitespace-only string', () => {
    expect(isEmpty('   ')).toBe(true);
  });

  it('returns false for non-empty string', () => {
    expect(isEmpty('value')).toBe(false);
  });

  it('returns true for array of empty strings', () => {
    expect(isEmpty(['', '   '])).toBe(true);
  });

  it('returns false for array with at least one non-empty string', () => {
    expect(isEmpty(['', 'value'])).toBe(false);
  });
});
