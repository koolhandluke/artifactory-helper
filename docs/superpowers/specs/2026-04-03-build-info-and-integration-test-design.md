# Design: JFrog Build Info + Integration Test Published Version

**Date:** 2026-04-03

## Overview

Two features:

1. The upload action captures GitHub build info and publishes it to Artifactory (git metadata + GitHub env vars).
2. The integration test workflow uses the published `@v1` floating tag instead of building from source.

---

## Feature 1: JFrog Build Info in the Upload Action

### Triggering

Build info publishing is opt-in, controlled by two mechanisms (action input takes precedence):

| Mechanism | Value to enable |
|---|---|
| Env var (job-level global) | `ARTIFACTORY_PUBLISH_BUILD_INFO=true` |
| Action input (per-step override) | `publish-build-info: true` |

Resolution order: if the action input is explicitly set, use it; otherwise fall back to the env var.

### New Inputs (`upload/action.yml`)

| Input | Required | Default | Description |
|---|---|---|---|
| `publish-build-info` | No | `''` | Enable build info publishing. Overrides `ARTIFACTORY_PUBLISH_BUILD_INFO` env var. |
| `build-name` | No | `$GITHUB_REPOSITORY` | JFrog build name (e.g. `owner/repo`). |
| `build-number` | No | `$GITHUB_RUN_NUMBER` | JFrog build number (e.g. `42`). |

### Upload Action Logic (`upload/src/main.ts`)

When build info is enabled:

1. Resolve `buildName` from input or `GITHUB_REPOSITORY` env var.
2. Resolve `buildNumber` from input or `GITHUB_RUN_NUMBER` env var.
3. Pass `--build-name <name> --build-number <number>` to the existing `jf rt upload` command.
4. Run `jf rt build-add-git --build-name <name> --build-number <number>` to attach git metadata (commit SHA, branch, remote URL).
5. Run `jf rt build-publish --build-name <name> --build-number <number>` to push the build record to Artifactory.
6. Append to the job summary: `Build info published: \`<build-name>\` #\`<build-number>\``

### What Gets Captured in Artifactory

- Git commit SHA, branch name, remote URL (via `build-add-git`)
- All uploaded file paths associated with the build record (via `--build-name`/`--build-number` on upload)
- GitHub run number as the build number (human-readable, monotonically increasing)

### Multi-Upload Workflows

JFrog CLI accumulates build info across multiple `jf rt upload` calls that share the same build name and number. The last `jf rt build-publish` in the workflow wins. This works naturally if the upload action is called multiple times — each call adds its files to the same build record, and the final call publishes it.

### No Changes to `packages/shared`

All new logic stays in `upload/src/main.ts`. No shared library changes needed.

---

## Feature 2: Integration Test Uses Published `@v1`

### Current State

The integration test checks out the repo, installs Node.js and npm deps, builds both actions from source, then references them via local paths (`./upload`, `./download`).

### Target State

Remove all source-build steps. Reference the published floating tag directly.

### Steps Removed

- `actions/checkout@v4`
- `actions/setup-node@v4`
- `Install dependencies` (`npm ci`)
- `Build actions` (`npm run build`)

### Action Reference Changes

| Before | After |
|---|---|
| `uses: ./upload` | `uses: koolhandluke/artifactory-helper/upload@v1` |
| `uses: ./download` | `uses: koolhandluke/artifactory-helper/download@v1` |

### Build Info in the Integration Test

Add `ARTIFACTORY_PUBLISH_BUILD_INFO: true` to the job-level `env` block. This exercises the new build info feature end-to-end as part of every integration test run.

### Floating Tag Maintenance

The `@v1` floating tag is already updated automatically by `release.yml` on every GitHub Release. No additional maintenance needed per release.

---

## Out of Scope

- Download action: no build info changes (download doesn't produce artifacts).
- A dedicated `publish-build-info` standalone action step (may be revisited if multi-upload workflows need finer control).
- Build info for the `folder` upload path (same logic applies, low priority).
