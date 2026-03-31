# artifactory-helper

A monorepo of GitHub Actions for uploading and downloading artifacts to/from JFrog Artifactory.

## Actions

| Action | Description |
|--------|-------------|
| [`upload/`](./upload/) | Upload artifacts to Artifactory |
| [`download/`](./download/) | Download artifacts from Artifactory |

### Artifact path format

Both actions share the same default Artifactory path convention:

```
<ARTIFACTORY_BUILD_ARTIFACTS_PATH>/<GITHUB_REPOSITORY>/<GITHUB_RUN_ID>/
```

Where `ARTIFACTORY_BUILD_ARTIFACTS_PATH` defaults to `webex-actions-generic/build-artifacts`.

Override `ARTIFACTORY_BUILD_ARTIFACTS_PATH` as an env var or use the `artifactory-path` input to replace the run-id segment with a fixed folder name.

---

## Upload to Artifactory

### Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `files` | Files to upload — space, comma, or semicolon separated. Supports JSON array format. | No | |
| `artifactory-path` | Override the run-id segment of the path with a fixed folder name. | No | |

### Examples

**Upload all files in a directory:**

```yaml
- uses: your-org/artifactory-helper/upload@v1
```

**Upload specific files:**

```yaml
- uses: your-org/artifactory-helper/upload@v1
  with:
    files: "server/build/libs/app.tar.gz, server/build/libs/app.war"
```

**Upload to a fixed path (e.g. for sharing between workflows):**

```yaml
- uses: your-org/artifactory-helper/upload@v1
  with:
    artifactory-path: my-stable-folder
```

---

## Download from Artifactory

### Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `files` | Artifact paths to download — space, comma, or semicolon separated. When set, `output-dir` is ignored and each file is placed at its artifact path. | No | |
| `artifactory-path` | Override the run-id segment of the source path with a fixed folder name. | No | |
| `output-dir` | Local directory to download into. Ignored when `files` is set. | No | `download-artifact-dir` |
| `flat` | Set to `false` to preserve folder structure. When `true`, all files go into `output-dir`. | No | `true` |

### Examples

**Download everything from a run:**

```yaml
- uses: your-org/artifactory-helper/download@v1
  with:
    output-dir: my-artifacts
```

**Download specific files:**

```yaml
- uses: your-org/artifactory-helper/download@v1
  with:
    files: "server/build/libs/app.tar.gz, server/build/libs/app.war"
```

**Download from a fixed path (matching a fixed upload path):**

```yaml
- uses: your-org/artifactory-helper/download@v1
  with:
    artifactory-path: my-stable-folder
    output-dir: my-artifacts
```

### Troubleshooting

If artifacts are not downloading, verify the path is correct using the JFrog CLI directly:

```bash
jf rt dl "webex-actions-generic/build-artifacts/<org>/<repo>/<run-id>/" --flat=true download-artifact-dir/
ls -ltr download-artifact-dir/
```

> The trailing slash `/` on the Artifactory path and output directory is required. Without it, JFrog CLI either downloads nothing or uses the first filename as the directory name.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, testing, and the release process.
