#!/usr/bin/env bash
# Bootstrap Cursor Gate into any repository (run from Schema or with SCHEMA_ROOT set).
set -euo pipefail

TARGET="${1:-.}"
SCHEMA_ROOT="${SCHEMA_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
TARGET="$(cd "$TARGET" && pwd)"

echo "Bootstrapping Cursor Gate into: $TARGET"

mkdir -p "$TARGET/.cursor/rules" "$TARGET/scripts" "$TARGET/samples" "$TARGET/docs" "$TARGET/.github/workflows"

# Core gate scripts
for f in cursor_gate.py cursor_gate_fastest.py requirements.txt; do
  cp -f "$SCHEMA_ROOT/$f" "$TARGET/$f"
done

# Shell tooling
for f in gate-file.sh gate-all-changed.sh install-agent-environment.sh; do
  cp -f "$SCHEMA_ROOT/scripts/$f" "$TARGET/scripts/$f"
  chmod +x "$TARGET/scripts/$f"
done

# Samples
cp -f "$SCHEMA_ROOT/samples/hello_passing.py" "$TARGET/samples/"
cp -f "$SCHEMA_ROOT/samples/hello.py" "$TARGET/samples/"

# Agent policy + docs
cp -f "$SCHEMA_ROOT/AGENTS.md" "$TARGET/AGENTS.md"
cp -f "$SCHEMA_ROOT/LICENSE" "$TARGET/LICENSE"
cp -f "$SCHEMA_ROOT/.env.example" "$TARGET/.env.example"
cp -f "$SCHEMA_ROOT/docs/USER_RULES_PASTE.md" "$TARGET/docs/"
cp -f "$SCHEMA_ROOT/.cursorrules" "$TARGET/.cursorrules"
cp -f "$SCHEMA_ROOT/.cursor/environment.json" "$TARGET/.cursor/environment.json"
cp -f "$SCHEMA_ROOT/.cursor/rules/"*.mdc "$TARGET/.cursor/rules/"

# CI (only if no existing gate workflow)
if [[ ! -f "$TARGET/.github/workflows/gate-check.yml" ]]; then
  cp -f "$SCHEMA_ROOT/.github/workflows/gate-check.yml" "$TARGET/.github/workflows/gate-check.yml"
fi

# .gitignore additions
GITIGNORE="$TARGET/.gitignore"
touch "$GITIGNORE"
for line in "__pycache__/" "*.pyc" ".env" ".cursor/gate-logs/" ".cursor/gate-cache/"; do
  grep -qxF "$line" "$GITIGNORE" 2>/dev/null || echo "$line" >> "$GITIGNORE"
done

echo "Bootstrap complete: $TARGET"
ls -la "$TARGET/.cursor/rules/" "$TARGET/scripts/"
