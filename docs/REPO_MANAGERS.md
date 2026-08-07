# Repo Manager Manifest

Supervisor spawns one Manager per repo until `status: production-ready`.

| Repo | Manager priority | Branch | Production-ready criteria | Status |
|------|-----------------|--------|-------------------------|--------|
| Schema | P0 | cursor/cursor-gate-15-review-50b9 | Merge PR #1, tag v1.0.0 | in_progress |
| frontier-syntax | P0 | cursor/gate-bootstrap-50b9 | Merge bootstrap PR, gate PASS | in_progress |
| frontier-agent-legal-record | P0 | cursor/gate-bootstrap-50b9 | Merge, verify audit chain | in_progress |
| apex-android | P0 | cursor/gate-bootstrap-50b9 | Merge PR, build passes | in_progress |
| project-nexus | P1 | cursor/gate-bootstrap-50b9 | Scaffold + README + CI green | in_progress |
| nuDAWn | P1 | cursor/gate-bootstrap-50b9 | Merge PR #4 | in_progress |
| prjctnxs | P1 | cursor/gate-bootstrap-50b9 | Merge PR #8, fix submodule | in_progress |
| mia.loa | P1 | cursor/gate-bootstrap-50b9 | Merge bootstrap | in_progress |
| etrnL | P1 | cursor/gate-bootstrap-50b9 | Merge, tests pass | in_progress |
| echoscribe | P2 | cursor/gate-bootstrap-50b9 | Merge bootstrap | in_progress |
| crxcibl3 | P2 | cursor/gate-bootstrap-50b9 | Merge bootstrap | in_progress |
| GMFKNEEGA | P2 | cursor/gate-bootstrap-50b9 | Merge scaffold | in_progress |
| bookish-bassoon | P2 | cursor/gate-bootstrap-50b9 | Merge bootstrap | in_progress |
| gutterumble | P2 | cursor/gate-bootstrap-50b9 | Merge bootstrap | in_progress |
| repurpose-engine | P2 | cursor/gate-bootstrap-50b9 | Merge bootstrap | in_progress |
| statecheck | P2 | cursor/gate-bootstrap-50b9 | Merge bootstrap | in_progress |
| slackhelper | P3 | cursor/gate-bootstrap-50b9 | Merge bootstrap | in_progress |
| apktool-diagnostics | P2 | cursor/gate-bootstrap-50b9 | Merge bootstrap | in_progress |
| crxcibl3sounds | P2 | cursor/gate-bootstrap-50b9 | Merge bootstrap | in_progress |
| android-reverse-engineering-skill | P2 | cursor/gate-bootstrap-50b9 | Merge bootstrap | in_progress |
| verbose-train | P3 | cursor/gate-bootstrap-50b9 | Merge scaffold | in_progress |

## Skipped (forks — no manager)

Vanadium, jadx, quick-xml, mcp-for-beginners, masked-irl, Voice-Of-the-Star

## Manager spawn command (Supervisor)

```bash
# Per repo — Supervisor delegates to Task subagent with this prompt template:
# "You are Repo Manager for <REPO>. Clone, audit, delegate workers, merge PR, gate all files, report PRODUCTION_READY or BLOCKED."
```
