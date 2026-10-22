#!/bin/bash

# Cut a release of this frontend: tag production and publish the GitHub release
# with the notes already written in CHANGELOG.md.
#
# Usage: ./tag-version.sh <version> [--dry-run]
# Example: ./tag-version.sh 1.4.15
#
# This repo has no upstream, so it versions itself with plain SemVer
# (vMAJOR.MINOR.PATCH) -- see "Versioning & Releases" in CLAUDE.md. The content
# of a release reaches `main` through the normal promotion flow; this script
# only marks it and publishes the notes.

set -e

DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            VERSION="$1"
            shift
            ;;
    esac
done

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version> [--dry-run]"
    echo "Example: $0 1.4.15"
    exit 1
fi

if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN MODE]"
    echo ""
fi

# Resolve the real GitHub CLI. A pyenv shim named 'gh' can shadow it in PATH,
# so accept only a binary whose --version looks like "gh version X.Y.Z".
GH_BIN=""
for cand in "$(command -v gh 2>/dev/null)" /usr/bin/gh /usr/local/bin/gh /snap/bin/gh; do
    if [ -n "$cand" ] && [ -x "$cand" ] && "$cand" --version 2>/dev/null | head -1 | grep -qE '^gh version [0-9]'; then
        GH_BIN="$cand"
        break
    fi
done

if [ -z "$GH_BIN" ]; then
    echo "Error: GitHub CLI (gh) is not installed"
    echo "Please install it: https://cli.github.com/"
    exit 1
fi

if ! "$GH_BIN" auth status &> /dev/null; then
    echo "Error: GitHub CLI is not authenticated"
    echo "Please run: gh auth login"
    exit 1
fi

if ! git diff-index --quiet HEAD --; then
    echo "Error: Working copy is not clean. Please commit or stash your changes."
    git status --short
    exit 1
fi

git fetch origin main --quiet
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "Error: HEAD is not at origin/main — a release is always cut from production"
    echo "HEAD:        $(git rev-parse --short HEAD)"
    echo "origin/main: $(git rev-parse --short origin/main)"
    exit 1
fi

if git rev-parse "v$VERSION" >/dev/null 2>&1; then
    echo "Error: Tag v$VERSION already exists"
    exit 1
fi

# The version is declared in two places that must agree: the tag about to be
# created and `version` in package.json. It is not a cosmetic duplication --
# the footer shows the package.json value to every visitor, so a release tagged
# 1.4.15 against a package.json still saying 1.4.14 publishes the wrong number
# on the site.
check_declared_version() {
    local declared
    declared=$(node -p "require('./package.json').version" 2>/dev/null || true)

    if [ -z "$declared" ]; then
        echo "Error: could not read 'version' from package.json"
        exit 1
    fi

    if [ "$declared" != "$VERSION" ]; then
        echo "Error: package.json declares $declared, but you are tagging $VERSION"
        echo "Set \"version\": \"$VERSION\" in package.json, promote it to main, then tag."
        exit 1
    fi
}

check_declared_version

# The notes are the changelog section written by hand during the promotion flow.
RELEASE_NOTES=$(awk -v hdr="## $VERSION (" 'index($0, hdr) == 1 { found = 1; next } found && /^## / { exit } found { print }' CHANGELOG.md)

if [ -z "$(echo "$RELEASE_NOTES" | tr -d '[:space:]')" ]; then
    echo "Error: no '## $VERSION (<date>)' section found in CHANGELOG.md"
    echo "Turn the '## Unreleased' heading into '## $VERSION (<date>)' during the"
    echo "promotion flow, open a fresh empty '## Unreleased' above it, then re-run."
    exit 1
fi

if [ "$DRY_RUN" = true ]; then
    echo "Would tag $(git rev-parse --short HEAD) as v$VERSION with these notes:"
    echo ""
    echo "$RELEASE_NOTES"
    exit 0
fi

git tag -a "v$VERSION" -m "Version $VERSION"
git push origin "v$VERSION"

echo "✓ Pushed tag v$VERSION"

echo "$RELEASE_NOTES" | "$GH_BIN" release create "v$VERSION" \
    --title "v$VERSION" \
    --notes-file -

echo "✓ Created GitHub release v$VERSION"
