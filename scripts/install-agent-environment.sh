#!/usr/bin/env bash
# Bootstrap cursor gate + completion policy on every cloud agent VM.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python3 -m pip install -q -r requirements.txt

mkdir -p ~/.cursor/gate-logs ~/.cursor/gate-cache ~/.cursor/rules

cp -f "$ROOT/cursor_gate.py" "$ROOT/cursor_gate_fastest.py" ~/.cursor/
chmod +x ~/.cursor/cursor_gate.py ~/.cursor/cursor_gate_fastest.py

if [ -d "$ROOT/.cursor/rules" ]; then
  cp -f "$ROOT/.cursor/rules/"*.mdc ~/.cursor/rules/ 2>/dev/null || true
fi

if [ -f "$ROOT/.cursorrules" ]; then
  cp -f "$ROOT/.cursorrules" ~/.cursor/.cursorrules.project
fi

date -u +%Y-%m-%dT%H:%M:%SZ > ~/.cursor/.agent-policy-installed
echo "Agent policy installed at ~/.cursor/ ($(cat ~/.cursor/.agent-policy-installed))"
