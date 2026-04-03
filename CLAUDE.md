# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm ci

# Run all checks (lint + test + build)
npm run all

# Lint (Biome)
npm run lint
npm run lint:fix   # auto-fix

# Test (Vitest with coverage)
npm run test

# Run a single test file
npx vitest run packages/shared/src/__tests__/parse.test.ts

# Build all packages (shared first, then actions)
npm run build
```

> **Note:** `dist/` files are not committed to `main`. They are built and committed automatically by the `release.yml` workflow when a GitHub Release is published.

## Architecture

This is an **npm workspaces monorepo** with three packages:

- **`packages/shared`** — Shared TypeScript library used by both actions. Contains:
  - `jfrog.ts` — Wrappers around `jf` CLI (`runCli`, `runCliAndGetOutput`, `getWorkingDirectory`, `isEmpty`)
  - `parse.ts` — `parseInputAsArray`: reads a GitHub Actions input and normalizes it to a string array (handles semicolon/comma/space/JSON-array delimiters)
  - `path.ts` — `getArtifactoryPath`: constructs the Artifactory storage path (`{JF_ARTIFACTS_REPO}/{org}/{repo}/runs/{run_id}`) from env vars (`GITHUB_REPOSITORY`, `GITHUB_RUN_ID`, `JF_ARTIFACTS_REPO`)
  - Built with `tsc` to `dist/`; consumed via workspace alias `@artifactory-helper/shared`

- **`upload/`** — GitHub Action that uploads artifacts to Artifactory via `jfrog rt upload --spec`. Inputs: `folder`, `files`.

- **`download/`** — GitHub Action that downloads artifacts from Artifactory via `jf rt dl`. Inputs: `files`, `output-dir`, `flat`.

Both actions use `rollup` to bundle everything (including shared) into a single `dist/index.js` for Node 20 GitHub Actions runtime.

## Key Design Decisions

- **Vitest aliases**: In test mode, `@artifactory-helper/shared` resolves directly to `packages/shared/src/index.ts` (not the built dist) via `vitest.config.ts` aliases in each action package.
- **Biome** is used for linting and formatting (not ESLint/Prettier). Config in `biome.json` — single quotes, space indent.
- **TypeScript strict mode** with `NodeNext` module resolution throughout.
- The default Artifactory repo is `build-artifacts`, overridable via `JF_ARTIFACTS_REPO` env var.

## Release Flow

1. Create a GitHub Release with a semver tag (e.g. `v1.2.3`)
2. `release.yml` builds dist files, commits them to the tag, and updates the floating major tag (e.g. `v1`)
