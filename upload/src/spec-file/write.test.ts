import fs from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import type { FileSpec } from './create.js';
import { writeFileSpec } from './write.js';

vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn(),
  },
}));

describe('writeFileSpec', () => {
  const fileSpec: FileSpec = { files: [] };

  it('should reject if RUNNER_TEMP is not defined', async () => {
    vi.stubEnv('RUNNER_TEMP', '');
    await expect(writeFileSpec(fileSpec)).rejects.toThrow(
      'RUNNER_TEMP is not defined',
    );
  });

  it('should reject if file cannot be written', async () => {
    vi.stubEnv('RUNNER_TEMP', '/tmp');
    vi.mocked(fs.writeFile).mockRejectedValue(new Error('fail'));
    await expect(writeFileSpec(fileSpec)).rejects.toThrow('fail');
  });

  it('should write file and return path', async () => {
    vi.stubEnv('RUNNER_TEMP', '/tmp');
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    const result = await writeFileSpec(fileSpec);
    expect(fs.writeFile).toHaveBeenCalled();
    expect(result).toMatch(/\/tmp\/\d+\.filespec\.json$/);
  });
});
