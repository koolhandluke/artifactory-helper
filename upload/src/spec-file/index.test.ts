import { describe, expect, it } from 'vitest';

describe('spec-file index', () => {
  it('exports createSpecFile and writeFileSpec', async () => {
    const index = await import('./index.js');
    expect(index).toHaveProperty('createSpecFile');
    expect(index).toHaveProperty('writeFileSpec');
  });
});
