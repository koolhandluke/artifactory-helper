# Artifactory Helper

GitHub Actions for uploading and downloading build artifacts to/from JFrog Artifactory — with predictable paths and zero per-workflow setup.

GitHub Actions' built-in artifact actions are ephemeral and tied to a single workflow run. When you need to share build outputs across workflows, repos, or retain them beyond 90 days, you need external storage.

artifactory-helper gives you a consistent, path-predictable way to upload and download artifacts from JFrog Artifactory. The artifact path is auto-derived from GITHUB_REPOSITORY and GITHUB_RUN_ID, so uploads and downloads just work across jobs without manual coordination.

---

## Quick start

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup JFrog CLI
        uses: jfrog/setup-jfrog-cli@v4
        env:
          JF_URL: ${{ vars.ARTIFACTORY_URL }}
          JF_ACCESS_TOKEN: ${{ secrets.ARTIFACTORY_TOKEN }}

      - name: Build
        run: ./gradlew build

      - name: Upload artifacts
        uses: koolhandluke/artifactory-helper/upload@v1
        with:
          folder: build/libs
```

---

## Configuration

### Credentials

Set up JFrog CLI before using either action:

```yaml
- uses: jfrog/setup-jfrog-cli@v4
  env:
    JF_URL: ${{ vars.ARTIFACTORY_URL }}
    JF_ACCESS_TOKEN: ${{ secrets.ARTIFACTORY_TOKEN }}
```

| Name | Description |
|------|-------------|
| `JF_URL` | JFrog instance URL (e.g. `https://your-org.jfrog.io`) |
| `JF_ACCESS_TOKEN` | Access token with read/write permissions |

---

### Artifact path

Default path:

```
<ARTIFACTORY_BUILD_ARTIFACTS_PATH>/<GITHUB_REPOSITORY>/<GITHUB_RUN_ID>/
```

| Name | Type | Default |
|------|------|--------|
| `ARTIFACTORY_BUILD_ARTIFACTS_PATH` | env var | `webex-actions-generic/build-artifacts` |

#### Overrides

- Set `ARTIFACTORY_BUILD_ARTIFACTS_PATH` → change base path
- Set `artifactory-path` input → replace `<run-id>` with a fixed value

Example:

```yaml
with:
  artifactory-path: my-stable-folder
```

---

## Upload

### Examples

**Upload a folder:**

```yaml
- uses: jfrog/setup-jfrog-cli@v4
  env:
    JF_URL: ${{ vars.ARTIFACTORY_URL }}
    JF_ACCESS_TOKEN: ${{ secrets.ARTIFACTORY_TOKEN }}

- uses: koolhandluke/artifactory-helper/upload@v1
  with:
    folder: build/libs
```

**Upload specific files:**

```yaml
- uses: koolhandluke/artifactory-helper/upload@v1
  with:
    files: "build/app.tar.gz, build/app.war"
```

**Upload to shared path:**

```yaml
- uses: koolhandluke/artifactory-helper/upload@v1
  with:
    artifactory-path: shared-build
```

### Parameters

| Name | Description | Required |
|------|-------------|----------|
| `folder` | Upload all files in folder (`folder/*`) | No |
| `files` | Files to upload (comma/space/semicolon separated) | No |
| `artifactory-path` | Override run-id segment | No |

### Input precedence

- If `folder` is set → `files` is ignored

---

## Download

### Examples

**Download all artifacts from a run:**

```yaml
- uses: jfrog/setup-jfrog-cli@v4
  env:
    JF_URL: ${{ vars.ARTIFACTORY_URL }}
    JF_ACCESS_TOKEN: ${{ secrets.ARTIFACTORY_TOKEN }}

- uses: koolhandluke/artifactory-helper/download@v1
  with:
    output-dir: artifacts
```

**Preserve folder structure:**

```yaml
- uses: koolhandluke/artifactory-helper/download@v1
  with:
    output-dir: artifacts
    flat: "false"
```

**Download specific files:**

```yaml
- uses: koolhandluke/artifactory-helper/download@v1
  with:
    files: "build/app.tar.gz, build/app.war"
```

**Download from shared path:**

```yaml
- uses: koolhandluke/artifactory-helper/download@v1
  with:
    artifactory-path: shared-build
    output-dir: artifacts
```

### Parameters

| Name | Description | Default |
|------|-------------|--------|
| `files` | Specific artifact paths to download | |
| `artifactory-path` | Override run-id segment | |
| `output-dir` | Target directory | `download-artifact-dir` |
| `flat` | Flatten directory structure | `true` |

### Input precedence

- If `files` is set → `output-dir` is ignored; each file is downloaded to its artifact sub-path

---

## Troubleshooting

### Common issues

**Auth errors**
- Verify `JF_URL` and `JF_ACCESS_TOKEN`
- Ensure `jfrog/setup-jfrog-cli` runs before these actions

**No files downloaded**
- Ensure path is correct
- Ensure trailing `/` is included

**Unexpected file layout**
- Check `flat` setting

---

### Debug with JFrog CLI

```bash
jf rt dl "webex-actions-generic/build-artifacts/<org>/<repo>/<run-id>/" --flat=true download-artifact-dir/
ls -ltr download-artifact-dir/
```

> The trailing `/` is required. Without it, downloads may fail or behave incorrectly.

---

## When to use this

Use this action when:
- you need artifacts across workflows
- you need retention beyond 90 days
- you want deterministic artifact paths
- you already use JFrog Artifactory

Not ideal when:
- artifacts are only needed within a single workflow

---

## Actions

| Action | Description |
|--------|-------------|
| [`upload/`](./upload/) | Upload artifacts |
| [`download/`](./download/) | Download artifacts |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
