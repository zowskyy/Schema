# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-06

Initial release of the Cursor Gate 15-gate review system.

### Added

#### 15-gate review system

- **`cursor_gate.py`** — Full 15-gate reviewer with subprocess checks (bandit, radon), optional LLM validation via litellm, audit logging, result caching, and configurable thresholds for carbon, cost, and complexity.
- **`cursor_gate_fastest.py`** — Fail-fast optimized reviewer using stdlib and pre-compiled regex patterns (~0.3–0.8s per run). Recommended for interactive use and CI smoke tests.
- Fifteen gates covering security (G1), production readiness (G2), implementation completeness (G3), performance (G4), frontier validation (G5), economic viability (G6), organizational (G7), legal & regulatory (G8), developer experience (G9), data strategy (G10), ethics & fairness (G11), ecosystem (G12), human factors (G13), sustainability (G14), and resilience (G15).
- **`scripts/gate-file.sh`** — Runs both reviewers on a single file; exits non-zero if either returns `FAIL`.
- **`scripts/gate-all-changed.sh`** — Gates all changed `.py`/`.ts`/`.js` files from `git diff HEAD`, or explicit paths.
- Sample fixtures: `samples/hello_passing.py` (reference passing file) and `samples/hello.py` (intentional failures).

#### VS Code / Cursor extension

- **`extension/`** — VS Code and Cursor extension (`cursor-gate` v1.0.0) with commands:
  - **Cursor Gate: Review Current File**
  - **Cursor Gate: Review Workspace**
  - **Cursor Gate: Review with Docker**
- Settings: `cursorGate.useFastest` (default `true`), `cursorGate.runOnSave`, `cursorGate.useDocker`, `cursorGate.iterations`.
- Pre-built package: `releases/cursor-gate-1.0.0.vsix`.

#### Docker support

- **`Dockerfile`** — Python 3.12 image with bandit, radon, and litellm pre-installed; persistent volumes for logs and cache.
- **`docker-compose.yml`** — One-command container runs with workspace mount.
- **`scripts/cursor-gate-docker.sh`** — Wrapper script for local Docker-based gating without installing Python deps.

#### Quarterback / worker delegation policy

- **`AGENTS.md`** — Agent instructions: ship finished work only; loop write → gate → fix until both reviewers PASS.
- **`.cursor/rules/quarterback-worker.mdc`** — Always-on rule defining quarterback (main agent) vs. worker (Task subagent) roles, delegation heuristics, and mandatory re-gating before user delivery.
- **`.cursor/rules/ship-finished-work.mdc`** — Always-on completion policy rule.
- Workers implement and gate their own changes but never message the user; the quarterback merges output and re-runs both gate scripts on every changed file before delivery.

#### CI gate-check workflow

- **`.github/workflows/gate-check.yml`** — Runs on every pull request:
  1. Checkout
  2. Set up Python 3.12
  3. Install dependencies from `requirements.txt`
  4. Bootstrap agent environment via `scripts/install-agent-environment.sh`
  5. Gate `samples/hello_passing.py` via `scripts/gate-file.sh`

#### Agent environment bootstrap

- **`scripts/install-agent-environment.sh`** — Installs gate scripts to `~/.cursor/`, copies `.cursor/rules/*.mdc` and `.cursorrules`, runs a smoke test on `samples/hello_passing.py`, and stamps `~/.cursor/.agent-policy-installed`.
- **`.cursor/environment.json`** — Cloud agent environment config that invokes the bootstrap script on VM startup.
- **`docs/USER_RULES_PASTE.md`** — Global user rules template for Cursor → Customize → Rules → User Rules.

### Configuration

- Environment variables via `~/.cursor/.env` or project `.env` (see `.env.example`).
- Audit logs: `~/.cursor/gate-logs/` (daily JSONL + per-run JSON).
- Result cache: `~/.cursor/gate-cache/` (TTL varies by reviewer).

[1.0.0]: https://github.com/zowskyy/Schema/releases/tag/v1.0.0
