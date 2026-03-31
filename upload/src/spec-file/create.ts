interface Files {
  pattern: string;
  target: string;
  flat?: 'true' | 'false';
}

export interface FileSpec {
  files: Files[];
}

export function createSpecFile(
  artifactoryPath: string,
  files: string[],
): FileSpec {
  return {
    files: files.map((file) => ({
      pattern: file,
      target: `${artifactoryPath}/`,
      flat: 'false',
    })),
  };
}
