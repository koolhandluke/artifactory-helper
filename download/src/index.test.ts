import { describe, expect, it, vi } from 'vitest';
import { run } from './main.js';

vi.mock('./main.js');

describe('index', () => {
  it('calls run when imported', async () => {
    await import('./index.js');
    expect(vi.mocked(run)).toHaveBeenCalled();
  });
});
