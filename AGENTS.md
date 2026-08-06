# Agent instructions — Schema / Cursor Gate

## AUTO-ENABLED — user never needs to remind you

This policy applies **automatically on every agent session** in this repo. The user does not need to say a command, keyword, or reminder. If they forget, you still follow this. No opt-in. No magic phrase.

## Completion policy

**Ship finished work only.** Do not stop at arbitrary iteration limits. Do not deliver half-filled answer sheets.

When you produce or modify code:

1. Run `python3 ~/.cursor/cursor_gate_fastest.py --file <path>`
2. Run `python3 ~/.cursor/cursor_gate.py --file <path> --iterations 3`
3. Fix all failures and re-run until **both** return `"status": "PASS"`
4. Only then send the code to the user

If truly blocked, say **BLOCKED** with one specific ask — not a list of unfixed gate failures.

## Environment

Gate scripts are installed to `~/.cursor/` on every environment bootstrap via `scripts/install-agent-environment.sh`.
