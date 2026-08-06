# Cursor Gate — 15-Gate Review System

A modular Python script that runs 15 quality gates on code before it ships in Cursor.

## Install

```bash
pip install -r requirements.txt
cp cursor_gate.py ~/.cursor/cursor_gate.py
chmod +x ~/.cursor/cursor_gate.py
```

Optional: copy `.env.example` to `~/.cursor/.env` and set API keys.

## Usage

```bash
# Review a file
python ~/.cursor/cursor_gate.py --file ./app.py --iterations 3 --region us-west-2

# Pipe code from stdin
echo "print('hello')" | python ~/.cursor/cursor_gate.py --stdin

# Write JSON output to a file
python ~/.cursor/cursor_gate.py --file ./app.py --output /tmp/review.json
```

## Gates

| Gate | Focus |
|------|-------|
| G1 | Security & compliance (bandit, secret scan) |
| G2 | Production readiness |
| G3 | Implementation completeness |
| G4 | Performance benchmarking (radon) |
| G5 | Frontier validation (LLM citations) |
| G6 | Economic viability |
| G7 | Organizational |
| G8 | Legal & regulatory |
| G9 | Developer experience |
| G10 | Data strategy |
| G11 | Ethics & fairness |
| G12 | Ecosystem |
| G13 | Human factors |
| G14 | Sustainability (carbon) |
| G15 | Resilience |

## Cursor Integration

Add `.cursorrules` to your project (included in this repo) or wire via a save-action extension:

```json
{
  "commands": [
    {
      "name": "15-Gate Review",
      "command": "python ~/.cursor/cursor_gate.py --file ${file}",
      "on": "save",
      "output": "panel"
    }
  ]
}
```

## Logs & Cache

- Audit logs: `~/.cursor/gate-logs/` (daily JSONL + per-run JSON)
- Result cache: `~/.cursor/gate-cache/` (1-hour TTL)
