#!/usr/bin/env bash
# Supervisor: spawn repo manager workflow (prints manager brief for Task delegation)
set -euo pipefail

REPO="${1:-}"
if [[ -z "$REPO" ]]; then
  echo "Usage: supervisor-spawn-manager.sh <repo-name>" >&2
  exit 1
fi

MANIFEST="/workspace/docs/REPO_MANAGERS.md"
echo "=== REPO MANAGER BRIEF: $REPO ==="
echo
echo "You are the Repo Manager for zowskyy/$REPO."
echo "Goal: PRODUCTION_READY — user sees nothing until done."
echo
echo "Steps:"
echo "1. Clone: gh repo clone zowskyy/$REPO /tmp/repos/$REPO"
echo "2. Checkout cursor/gate-bootstrap-50b9 (or main if merged)"
echo "3. Audit: open PRs, issues, ROADMAP, CI, failing gates"
echo "4. Delegate Workers for: merge conflicts, gap fixes, issue closeouts"
echo "5. Run: bash scripts/gate-file.sh on every shippable .py/.ts file"
echo "6. Merge PR to main (gh pr merge) if CI green and gates PASS"
echo "7. Report ONLY: PRODUCTION_READY with merge SHA + install command"
echo "   OR: BLOCKED with one specific ask"
echo
grep -A1 "| $REPO |" "$MANIFEST" 2>/dev/null || echo "(see $MANIFEST)"
