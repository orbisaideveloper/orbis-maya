# Maya Project Status

## Current phase

Phase 0 — documentation/governance bootstrap before application implementation.

## Repository

GitHub:
`orbisaideveloper/orbis-maya`

Expected local path after clone:
`~/orbis-maya`

## Current implementation status

No production application code is considered started.

The repository currently establishes product intent, architecture, working rules, quality targets, Sonar plan, security/privacy baseline and theme direction.

## Locked product/architecture decisions

- PWA first, Android later.
- ORBIS Foundation remains the shared AI platform.
- ORBIS/Supabase authentication.
- Local-first personal history.
- Voice: speech-to-text → text AI request → text response → optional TTS.
- Deterministic astronomy calculation.
- ORBIS Admin remains the central control plane.
- Maya V3 Astral is the default approved theme.
- Termux-controlled source workflow after bootstrap.
- `develop` current / `main` published once branch setup begins.
- Sonar zero-issue clean-code policy.
- No default PR Preview/staging requirement.

## 2026-09-30 Termux audit

Verified before setup:

- Android Termux is available and writable Downloads access works.
- Git, GitHub CLI, Node/npm, Python, jq and curl are available.
- GitHub account `orbisaideveloper` is authenticated.
- Ubuntu/proot is installed.
- Ubuntu Node is available.
- Codex is available in Ubuntu.
- Sonar CLI is not yet installed.
- Java is not yet installed in Ubuntu.
- `~/orbis-maya` was not present locally at the time of the audit.

## Bootstrap note

At the owner's explicit request, the initial documentation baseline is being established directly in GitHub before the first local clone.

This is a one-time bootstrap exception.

After the fresh local clone, future source changes entering Git history follow the Termux workflow in `docs/TERMUX-WORKFLOW.md`.

## Next exact actions

1. Verify this documentation bootstrap on GitHub.
2. Fresh-clone `orbis-maya` into Termux.
3. Verify local repo/remote/branch/HEAD are aligned with GitHub.
4. Create/confirm the `develop` working branch when approved.
5. Attach/import Maya in SonarQube Cloud.
6. Verify the dedicated Maya Sonar identity.
7. Configure project-local quality tooling/CI.
8. Run the first clean baseline quality check.
9. Only then begin application scaffold/code.

## Remote/production impact

Current bootstrap scope:
- documentation only;
- no application code;
- no deployment;
- no production service;
- no database change.
