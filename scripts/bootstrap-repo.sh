#!/usr/bin/env bash
# Bootstrap Cursor Gate + Architect Protocol into any repository.
set -euo pipefail

TARGET="${1:-.}"
SCHEMA_ROOT="${SCHEMA_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
TARGET="$(cd "$TARGET" && pwd)"

echo "Bootstrapping Architect Protocol + Cursor Gate into: $TARGET"

mkdir -p "$TARGET/.cursor/rules" "$TARGET/scripts" "$TARGET/samples" "$TARGET/docs" "$TARGET/.github/workflows"

for f in cursor_gate.py cursor_gate_fastest.py requirements.txt; do
  cp -f "$SCHEMA_ROOT/$f" "$TARGET/$f"
done

for f in gate-file.sh gate-all-changed.sh install-agent-environment.sh supervisor-spawn-manager.sh; do
  [[ -f "$SCHEMA_ROOT/scripts/$f" ]] && cp -f "$SCHEMA_ROOT/scripts/$f" "$TARGET/scripts/" && chmod +x "$TARGET/scripts/$f"
done

cp -f "$SCHEMA_ROOT/samples/hello_passing.py" "$TARGET/samples/"
cp -f "$SCHEMA_ROOT/samples/hello.py" "$TARGET/samples/"

cp -f "$SCHEMA_ROOT/AGENTS.md" "$TARGET/AGENTS.md"
cp -f "$SCHEMA_ROOT/.cursorrules" "$TARGET/.cursorrules"
cp -f "$SCHEMA_ROOT/.cursor/environment.json" "$TARGET/.cursor/environment.json"
cp -f "$SCHEMA_ROOT/.cursor/rules/"*.mdc "$TARGET/.cursor/rules/"

for f in ARCHITECT_PROTOCOL.md REPO_MANAGERS.md USER_RULES_PASTE.md MULTI_REPO_ROLLOUT.md; do
  [[ -f "$SCHEMA_ROOT/docs/$f" ]] && cp -f "$SCHEMA_ROOT/docs/$f" "$TARGET/docs/$f"
done

[[ -f "$SCHEMA_ROOT/LICENSE" ]] && [[ ! -f "$TARGET/LICENSE" ]] && cp -f "$SCHEMA_ROOT/LICENSE" "$TARGET/LICENSE"
[[ -f "$SCHEMA_ROOT/.env.example" ]] && [[ ! -f "$TARGET/.env.example" ]] && cp -f "$SCHEMA_ROOT/.env.example" "$TARGET/.env.example"

[[ ! -f "$TARGET/.github/workflows/gate-check.yml" ]] && \
  cp -f "$SCHEMA_ROOT/.github/workflows/gate-check.yml" "$TARGET/.github/workflows/gate-check.yml"

GITIGNORE="$TARGET/.gitignore"
touch "$GITIGNORE"
for line in "__pycache__/" "*.pyc" ".env" ".cursor/gate-logs/" ".cursor/gate-cache/"; do
  grep -qxF "$line" "$GITIGNORE" 2>/dev/null || echo "$line" >> "$GITIGNORE"
done

echo "Bootstrap complete (Architect Protocol + Cursor Gate): $TARGET"
