#!/usr/bin/env bash
set -euo pipefail

# ── helpers ───────────────────────────────────────────────────────────────────

# Fetch all remote tags and return the highest semver tag (default: v0.0.0)
get_current_version() {
  git fetch --prune origin 'refs/tags/*:refs/tags/*' '+refs/heads/*:refs/remotes/origin/*'
  local latest
  latest=$(git tag --sort=-version:refname | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+$' | head -1 || true)
  echo "${latest:-v0.0.0}"
}

# Parse a semver string into globals $major $minor $patch (strips leading 'v')
parse_version() {
  local ver="${1#v}"
  IFS='.' read -r major minor patch <<< "$ver"
  major=${major:-0}
  minor=${minor:-0}
  patch=${patch:-0}
}

# Increment the appropriate component; reset lower ones to 0
bump_version() {
  case "$1" in
    major) (( major++ )); minor=0; patch=0 ;;
    minor) (( minor++ )); patch=0 ;;
    patch) (( patch++ )) ;;
  esac
}

# Delete a tag locally and from remote if it exists (silent no-op otherwise)
delete_tag() {
  local tag="$1"
  if git rev-parse --verify "$tag" >/dev/null 2>&1; then
    git tag -d "$tag"
  fi
  if git ls-remote --tags origin | grep -q "refs/tags/${tag}$"; then
    git push --delete origin "$tag"
  fi
}

# Delete + recreate three tags: vX  vX.Y  vX.Y.Z
push_tags() {
  local full="v${major}.${minor}.${patch}"
  local float_minor="v${major}.${minor}"
  local float_major="v${major}"

  # Defensively delete before (re)creating — handles both moves and re-runs.
  # For patch:  v1 and v1.2 already exist and need to move forward.
  # For minor:  v1 needs to move; v1.3 / v1.3.0 are new.
  # For major:  v2 / v2.0 / v2.0.0 are all new (deletes are no-ops).
  delete_tag "$float_major"
  delete_tag "$float_minor"
  delete_tag "$full"

  git tag "$float_major"
  git tag "$float_minor"
  git tag "$full"
  git push origin --tags

  echo "✅ Tagged: $float_major  $float_minor  $full"
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "version=$full" >> "$GITHUB_OUTPUT"
  fi
}

# ── main ──────────────────────────────────────────────────────────────────────

if [[ $# -ne 1 || ! "$1" =~ ^(major|minor|patch)$ ]]; then
  echo "Usage: $0 {major|minor|patch}" >&2
  exit 1
fi

current=$(get_current_version)
echo "Current version: $current"

parse_version "$current"
bump_version "$1"

echo "New version:     v${major}.${minor}.${patch}"

push_tags "$1"
