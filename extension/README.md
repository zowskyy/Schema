# Cursor Gate Extension

VS Code and Cursor compatible extension for the 15-gate review system.

## Install

### From VSIX (recommended)

```bash
# VS Code
code --install-extension ../releases/cursor-gate-1.0.0.vsix

# Cursor
cursor --install-extension ../releases/cursor-gate-1.0.0.vsix
```

Or: **Extensions → ⋯ → Install from VSIX** and select `cursor-gate-1.0.0.vsix`.

### From source

```bash
cd extension
npm install
npm run compile
# Press F5 in VS Code/Cursor to launch Extension Development Host
```

## Commands

| Command | Description |
|---------|-------------|
| **Cursor Gate: Review Current File** | Run all 15 gates on the active file |
| **Cursor Gate: Review Workspace** | Batch-review up to 20 source files |
| **Cursor Gate: Review with Docker** | Run via Docker (no local Python deps) |

Right-click any file in the explorer for quick access.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `cursorGate.pythonPath` | `python3` | Python executable |
| `cursorGate.scriptPath` | *(bundled)* | Override path to `cursor_gate.py` |
| `cursorGate.useDocker` | `false` | Use Docker for all reviews |
| `cursorGate.dockerImage` | `cursor-gate:latest` | Docker image name |
| `cursorGate.iterations` | `3` | Max remediation iterations |
| `cursorGate.region` | `us-east-1` | Carbon gate region |
| `cursorGate.runOnSave` | `false` | Auto-review on file save |
| `cursorGate.failOnGateFailure` | `false` | Show error on gate failure |

## Rebuild VSIX

```bash
cd extension
npm run package
cp cursor-gate-1.0.0.vsix ../releases/
```
