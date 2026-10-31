#!/usr/bin/env bash
# Merges a pull request only when it is safe. This repository does not use GitHub branch protection (the same rule as in
# egg-backend), so this script is the gate: the PR is open, not a draft, targets main, all checks have succeeded and the branch
# contains the current main. Merge method: rebase, so the commits of the branch stay separate.
#
# Usage: scripts/merge-pr.sh <pr-number> [--dry-run]
# Environment: GH (path of the gh command, default gh).
set -euo pipefail

gh_cmd="${GH:-gh}"
pr="${1:?usage: scripts/merge-pr.sh <pr-number> [--dry-run]}"
dry_run=false
if [ "${2:-}" = "--dry-run" ]; then
  dry_run=true
fi

fail() {
  echo "merge-pr: $*" >&2
  exit 1
}

field() { "$gh_cmd" pr view "$pr" --json "$1" --jq "$2"; }

state="$(field state .state)"
draft="$(field isDraft .isDraft)"
base="$(field baseRefName .baseRefName)"
head_ref="$(field headRefName .headRefName)"
head_sha="$(field headRefOid .headRefOid)"
[ "$state" = "OPEN" ] || fail "PR #$pr is $state"
[ "$draft" = "false" ] || fail "PR #$pr is a draft"
[ "$base" = "main" ] || fail "PR #$pr targets '$base', not main"

total="$(field statusCheckRollup '.statusCheckRollup | length')"
bad="$(field statusCheckRollup '[.statusCheckRollup[] | select(.conclusion != "SUCCESS" and .conclusion != "SKIPPED" and .conclusion != "NEUTRAL")] | length')"
[ "$total" -gt 0 ] || fail "PR #$pr has no checks yet"
[ "$bad" -eq 0 ] || fail "PR #$pr has $bad check(s) that are not successful yet:
$(field statusCheckRollup '.statusCheckRollup[] | select(.conclusion != "SUCCESS" and .conclusion != "SKIPPED" and .conclusion != "NEUTRAL") | "  \(.name): \(.status) \(.conclusion)"')"
echo "merge-pr: $total checks, all successful"

git fetch --quiet origin main "+refs/pull/$pr/head:refs/remotes/origin/pr/$pr"
[ "$(git rev-parse "origin/pr/$pr")" = "$head_sha" ] || fail "the fetched head does not match the PR head $head_sha"
git merge-base --is-ancestor origin/main "origin/pr/$pr" || fail "the branch does not contain the current main; rebase it onto origin/main and wait for CI"
echo "merge-pr: the branch contains the current main"

if [ "$dry_run" = true ]; then
  echo "merge-pr: dry run, PR #$pr ($head_ref at $head_sha) would be merged now"
  exit 0
fi

"$gh_cmd" pr merge "$pr" --rebase --match-head-commit "$head_sha"
git push --quiet origin --delete "$head_ref" || echo "merge-pr: the branch $head_ref could not be deleted on origin" >&2
echo "merge-pr: PR #$pr merged"
