# Maya Project Status

## Current phase

Phase 1 — application foundation certified; feature implementation next.

## Repository

GitHub: `orbisaideveloper/orbis-maya`

Local path: `~/orbis-maya`

Active branch: `main`

Branch policy: main-only.

## Current implementation status

The application foundation is implemented.

Present:

- React;
- TypeScript;
- Vite;
- ESLint;
- Vitest + Testing Library;
- strict 100% production-code coverage contract;
- KNIP dead-code checking;
- JSCPD zero-duplication checking;
- `vite-plugin-pwa`;
- Playwright mobile E2E;
- Maya V3 Astral initial mobile-first shell;
- Linux/Ubuntu certification workflow.

Feature-level product functionality has not yet been implemented beyond the initial shell.

Authentication, local-history persistence, Dream AI integration, Ask Maya, voice flows and deterministic astrology remain implementation work.

## Verified environment and quality state

Verified on 2026-10-01:

- Android Termux is the canonical Git/source environment.
- Native Termux runs compatible development checks and the local Vite development server.
- Ubuntu/proot is the standard-Linux certification environment for tooling that is unreliable or unsupported in native Android userspace.
- Ubuntu certification environment: Ubuntu 26.04 LTS, aarch64, Node 24.
- Playwright Chromium is installed in the Ubuntu certification environment.
- the persistent Linux certification runner is available through `~/.local/bin/maya-linux-cert`;
- dedicated SonarQube Cloud project: `orbisaideveloper_orbis-maya`;
- Sonar organization: `orbis`;
- Automatic Analysis is disabled;
- GitHub Actions uses the dedicated Maya Sonar token;
- local application dependency audit: 0 vulnerabilities;
- ESLint: PASS with zero warnings/errors;
- TypeScript: PASS;
- unit tests: PASS;
- production-code coverage: 100% lines/statements/functions/branches;
- KNIP: PASS;
- JSCPD runtime duplication: 0.00%;
- repository/workflow preflight: PASS;
- full Linux PWA build: PASS;
- generated PWA manifest/service worker: PASS;
- Playwright Pixel-7 mobile E2E: PASS.

## Environment split

### Native Termux

Use for:

- Git/source ownership;
- normal code editing;
- local Vite development server;
- dependency audit where supported;
- ESLint;
- TypeScript;
- Vitest/coverage;
- core Vite build;
- reports and Git operations.

Do not run native Android Playwright browsers.

Do not use native Android KNIP as a required certification path because its current resolver dependency requires a standard native environment that is not reliable in Android userspace.

### Ubuntu/proot

Use for final Linux certification:

- fresh `npm ci`;
- dependency audit;
- ESLint;
- TypeScript;
- unit tests and 100% coverage;
- KNIP;
- JSCPD;
- repository/workflow validation;
- full PWA/Workbox build;
- Playwright Chromium;
- Pixel-7 mobile E2E.

### GitHub Actions / SonarQube Cloud

Every pushed `main` application commit must pass:

- GitHub Actions quality workflow;
- SonarQube Cloud scan;
- Sonar Quality Gate;
- strict Sonar verification.

Strict Sonar requires:

- unresolved issues: 0;
- production coverage: 100%;
- runtime duplication: 0.00%;
- reviewed Security Hotspots where present;
- security/reliability/maintainability ratings: A where present.

## Main-only release flow

Termux local implementation
→ targeted checks
→ local preview/manual check
→ Ubuntu/Linux final certification
→ owner approval
→ commit/push `main`
→ GitHub Actions
→ SonarQube Cloud Quality Gate
→ strict Sonar verification
→ only green commits become release/deployment eligible.

A red `main` is repaired through a new locally verified commit.

## Next implementation order

Begin feature coding from the certified application baseline.

First implementation step:

Application shell and real navigation for Home, Dream Analysis, Birth Chart / Astro, Ask Maya, Local History and Settings.

Then proceed through authentication, local data, Dream flow, Foundation Maya gateway, AI integration, Ask Maya, voice and deterministic astrology in the approved implementation order.

## Remote/production impact

Maya currently has no production deployment workflow.

No production deployment is performed as part of application-foundation certification.

No Maya server-side personal conversation-history database is introduced.

Database impact: none.
