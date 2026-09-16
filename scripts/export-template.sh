#!/usr/bin/env bash
# Export apps/base-template to the standalone GitHub template repository.
#
#   First run (seed): git subtree split pushes the template history to the
#   remote so the template repo starts with provenance.
#   Every run (sync): a worktree over the remote main is overlaid with the
#   current apps/base-template, the standalone package.json and .gitignore are
#   applied, the lockfile is regenerated from the registry, and the result is
#   pushed (fast-forward).
#
# Usage: bash scripts/export-template.sh
#   TEMPLATE_REMOTE  remote name (default: template)
#   TEMPLATE_URL     remote URL    (default: https://github.com/marcosdima/base-expo.git)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_REMOTE="${TEMPLATE_REMOTE:-template}"
TEMPLATE_URL="${TEMPLATE_URL:-https://github.com/marcosdima/base-expo.git}"
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/base-template-export.XXXXXX")"
SEED_BRANCH="temp/template-seed"

cleanup() {
  git -C "$ROOT" worktree remove "$STAGE" --force >/dev/null 2>&1 || true
  git -C "$ROOT" branch -D "$SEED_BRANCH" >/dev/null 2>&1 || true
  rm -rf "$STAGE"
}
trap cleanup EXIT

echo "==> [1/7] working tree clean?"
if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
  echo "error: monorepo working tree has uncommitted changes; commit or stash first" >&2
  exit 1
fi

echo "==> [2/7] build alambre (dist must be current)"
(cd "$ROOT" && pnpm --filter alambre build)

echo "==> [3/7] remote '$TEMPLATE_REMOTE' -> $TEMPLATE_URL"
if ! git -C "$ROOT" remote get-url "$TEMPLATE_REMOTE" >/dev/null 2>&1; then
  git -C "$ROOT" remote add "$TEMPLATE_REMOTE" "$TEMPLATE_URL"
  echo "    remote added"
fi
git -C "$ROOT" fetch "$TEMPLATE_REMOTE" 2>/dev/null || true

if git -C "$ROOT" ls-remote --exit-code --refs "$TEMPLATE_REMOTE" refs/heads/main >/dev/null 2>&1; then
  echo "==> [4/7] remote 'main' exists — syncing (no seed)"
else
  echo "==> [4/7] remote empty — seeding with subtree split history"
  git -C "$ROOT" subtree split --prefix=apps/base-template --branch "$SEED_BRANCH"
  git -C "$ROOT" push "$TEMPLATE_REMOTE" "$SEED_BRANCH:main"
  git -C "$ROOT" branch -D "$SEED_BRANCH"
  git -C "$ROOT" fetch "$TEMPLATE_REMOTE"
fi

echo "==> [5/7] overlay apps/base-template onto $TEMPLATE_REMOTE/main"
git -C "$ROOT" worktree add --detach "$STAGE" "$TEMPLATE_REMOTE/main" >/dev/null
find "$STAGE" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$ROOT"/apps/base-template/. "$STAGE"/

node "$ROOT/scripts/template/standalone-package.mjs" "$ROOT" "$STAGE"
cp "$ROOT/scripts/template/.gitignore" "$STAGE/.gitignore"
cp "$ROOT/LICENSE" "$STAGE/LICENSE"

echo "==> [6/7] regenerate lockfile from the registry"
(cd "$STAGE" && pnpm install --lockfile-only)

echo "==> [7/7] commit and push"
VERSION="$(node -p "require('$ROOT/packages/alambre/package.json').version")"
git -C "$STAGE" add -A
if git -C "$STAGE" diff --cached --quiet; then
  echo "    no changes to export"
else
  git -C "$STAGE" commit -q -m "chore: sync template from alambre monorepo v$VERSION"
  git -C "$STAGE" push "$TEMPLATE_REMOTE" HEAD:main
  echo "    pushed v$VERSION to $TEMPLATE_REMOTE/main"
fi
