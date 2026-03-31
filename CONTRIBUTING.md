# Contributing

## Prerequisites

- Node.js 20+

## Setup

```bash
npm ci
```

## Development commands

```bash
# Lint (Biome)
npm run lint
npm run lint:fix

# Test
npm run test

# Run a single test file
npx vitest run packages/shared/src/__tests__/parse.test.ts

# Build
npm run build

# Run everything (lint + test + build)
npm run all
```

## Project structure

```
packages/shared/   # Shared library — JFrog CLI wrappers, input parsing, path helpers
upload/            # Upload GitHub Action
download/          # Download GitHub Action
```

`packages/shared` is built with `tsc`. The `upload` and `download` actions are bundled with Rollup into a single `dist/index.js` each.

During tests, `@artifactory-helper/shared` resolves directly to `packages/shared/src/index.ts` via Vitest aliases (not the built dist).

## Release process

`dist/` files are **not committed to `main`**. On release:

1. Create a GitHub Release with a semver tag (e.g. `v1.2.3`)
2. The `release.yml` workflow builds the dist, commits it to the tag, and updates the floating major tag (e.g. `v1`)
