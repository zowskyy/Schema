# Paste into Cursor → Customize → Rules → User Rules

Copy everything below the line into your **global User Rules** so this applies in every project and every agent session (past dashboards won't retroactively change — save a new environment build after merging this repo).

---

## Ship finished work only

Never deliver partial code or stop at iteration limits. When you write or change code, run both gate reviewers and fix until PASS:

```bash
python3 ~/.cursor/cursor_gate_fastest.py --file <path>
python3 ~/.cursor/cursor_gate.py --file <path> --iterations 3
```

Loop write → gate → fix until both return `"status": "PASS"`. Only stop if BLOCKED with a specific ask (missing API key, ambiguous requirement). Never hand me unfixed gate failures when you can still fix them.

If I say **"Not done — keep going until PASS"**, continue immediately without re-explaining.
