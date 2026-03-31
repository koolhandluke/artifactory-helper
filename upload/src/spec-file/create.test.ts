import { describe, expect, it } from 'vitest';
import { createSpecFile } from './create.js';

describe('createSpecFile', () => {
  const artifactoryPath =
    'webex-actions-generic/build-artifacts/org/repo/1.0.0';

  it('creates a FileSpec with correct targets', () => {
    const files = ['a.txt', 'b.js'];
    const spec = createSpecFile(artifactoryPath, files);
    expect(spec).toEqual({
      files: [
        { pattern: 'a.txt', target: `${artifactoryPath}/`, flat: 'false' },
        { pattern: 'b.js', target: `${artifactoryPath}/`, flat: 'false' },
      ],
    });
  });

  it('returns empty files array if input is empty', () => {
    expect(createSpecFile(artifactoryPath, [])).toEqual({ files: [] });
  });
});
