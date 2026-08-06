# Cursor Gate — 15-Gate Review System

A modular Python script that runs 15 quality gates on code before it ships in Cursor or VS Code.

## Quick Start

### Option A: VS Code / Cursor Extension (recommended)

```bash
# Install the packaged extension
cursor --install-extension releases/cursor-gate-1.0.0.vsix
# or: code --install-extension releases/cursor-gate-1.0.0.vsix
```

Then run **Cursor Gate: Review Current File** from the command palette (`Cmd+Shift+P`).

### Option B: Local Python CLI

```bash
pip install -r requirements.txt
cp cursor_gate.py ~/.cursor/cursor_gate.py
python3 ~/.cursor/cursor_gate.py --file ./app.py --iterations 3
```

### Option C: Docker (no local Python deps)

```bash
docker build -t cursor-gate:latest .
./scripts/cursor-gate-docker.sh --file samples/hello.py --iterations 1

# Or via docker compose
docker compose run --rm cursor-gate --file /workspace/samples/hello.py
```

## Usage

```bash
# Review a file
python3 ~/.cursor/cursor_gate.py --file ./app.py --iterations 3 --region us-west-2

# Pipe code from stdin
echo "print('hello')" | python3 ~/.cursor/cursor_gate.py --stdin

# Write JSON output to a file
python3 ~/.cursor/cursor_gate.py --file ./app.py --output /tmp/review.json
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

## Project Layout

```
cursor_gate.py          # Main CLI script
Dockerfile              # Container image (bandit, radon, litellm pre-installed)
docker-compose.yml      # One-command Docker runs
scripts/
  cursor-gate-docker.sh # Docker wrapper script
extension/              # VS Code / Cursor extension source
releases/
  cursor-gate-1.0.0.vsix  # Pre-built extension package
```

## Cursor / VS Code Integration

### Extension settings

| Setting | Default | Description |
|---------|---------|-------------|
| `cursorGate.runOnSave` | `false` | Auto-review on save |
| `cursorGate.useDocker` | `false` | Run via Docker |
| `cursorGate.iterations` | `3` | Max fix iterations |

See [extension/README.md](extension/README.md) for full settings.

### `.cursorrules` (project-level)

Included in this repo — instructs Cursor to run gates before finalizing code.

## Configuration

Copy `.env.example` to `~/.cursor/.env` or project `.env`:

```bash
# GATE_LLM_MODEL=gpt-4o-mini
# OPENAI_API_KEY=sk-...
```

## Logs & Cache

- Audit logs: `~/.cursor/gate-logs/` (daily JSONL + per-run JSON)
- Result cache: `~/.cursor/gate-cache/` (1-hour TTL)
- Docker volumes: `cursor-gate-logs`, `cursor-gate-cache`

## Rebuild Extension

```bash
cd extension && npm install && npm run package
cp cursor-gate-1.0.0.vsix ../releases/
```
