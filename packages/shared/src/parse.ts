import * as core from '@actions/core';

/**
 * Read a GitHub Actions input and split it into an array of non-empty strings.
 * Handles: semicolon, comma, space delimiters; JSON array brackets `[...]`;
 * strips surrounding double-quotes, leading `./` or `/`.
 * @param input - The name of the action input to read
 * @returns An array of cleaned, non-empty path strings
 */
export function parseInputAsArray(input: string): string[] {
  let inStr: string = (core.getInput(input) || '').trim();

  // Strip JSON array brackets if present
  if (inStr.length >= 2 && inStr.startsWith('[') && inStr.endsWith(']')) {
    inStr = inStr.slice(1, -1).trim();
  }

  return inStr
    .split(';')
    .flatMap((itemSemi: string) =>
      itemSemi
        .trim()
        .split(',')
        .flatMap((itemComma) => itemComma.trim().split(' ')),
    )
    .map((item) => item.trim())
    .filter((item) => !!item)
    .map(
      (item) =>
        (item.length >= 2 &&
          item.startsWith('"') &&
          item.endsWith('"') &&
          item.slice(1, -1)) ||
        item,
    )
    .map((item) => (item.startsWith('./') ? item.slice(2) : item))
    .map((item) => (item.startsWith('/') ? item.slice(1) : item))
    .filter((item) => !!item);
}
