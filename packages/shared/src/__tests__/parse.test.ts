import * as core from '@actions/core';
import { describe, expect, it, vi } from 'vitest';
import { parseInputAsArray } from '../parse.js';

vi.mock('@actions/core');

describe('parseInputAsArray', () => {
  it('splits by semicolons, commas, and spaces', () => {
    vi.mocked(core.getInput).mockReturnValue(
      'folder/file.zip;folder/file.tar.gz, folder/file.rar   folder/file.war',
    );
    expect(parseInputAsArray('files')).toEqual([
      'folder/file.zip',
      'folder/file.tar.gz',
      'folder/file.rar',
      'folder/file.war',
    ]);
  });

  it('strips surrounding double quotes', () => {
    vi.mocked(core.getInput).mockReturnValue(
      '"folder/file.zip";"folder/file.tar.gz"',
    );
    expect(parseInputAsArray('files')).toEqual([
      'folder/file.zip',
      'folder/file.tar.gz',
    ]);
  });

  it('strips leading ./ and /', () => {
    vi.mocked(core.getInput).mockReturnValue(
      './folder/file.rar /folder/file.war',
    );
    expect(parseInputAsArray('files')).toEqual([
      'folder/file.rar',
      'folder/file.war',
    ]);
  });

  it('strips JSON array brackets', () => {
    vi.mocked(core.getInput).mockReturnValue(
      '["folder/a.zip","folder/b.tar.gz"]',
    );
    expect(parseInputAsArray('files')).toEqual([
      'folder/a.zip',
      'folder/b.tar.gz',
    ]);
  });

  it('returns empty array for empty input', () => {
    vi.mocked(core.getInput).mockReturnValue('');
    expect(parseInputAsArray('files')).toEqual([]);
  });
});
