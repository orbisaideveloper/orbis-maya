# AGENTS.md — Mandatory ORBIS Maya Instructions

These rules apply to every AI agent, ChatGPT session, Codex session and contributor working in `orbisaideveloper/orbis-maya`.

## 1. Read before changing anything

Read, in order:

1. `AGENTS.md`
2. `docs/PRODUCT_SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DECISIONS.md`
5. `docs/QUALITY-GATES.md`
6. `docs/TERMUX-WORKFLOW.md`
7. `docs/PROJECT_STATUS.md`

Do not infer implementation status from filenames, plans or previous chats. Verify the current source and current reports.

## 2. Authority and truth

- The owner's current explicit instruction has highest authority.
- Current repository source plus verified reports are implementation truth.
- Locked entries in `docs/DECISIONS.md` define durable architecture.
- Planning documents describe intent, not completed functionality.
- Never claim a feature, test, integration, deployment or migration succeeded without current evidence.
- If a requested change materially affects architecture, privacy, security, cost or product boundaries, make that impact explicit before implementation.

## 3. Product boundary

Maya is one ORBIS product.

Repository ownership:

- `orbis-maya`: customer-facing PWA/Android application, Maya UX, product flows and device-local history.
- `orbis-foundation`: shared AI gateway, provider/model routing and common AI infrastructure.
- `orbis-admin`: central owner/control plane.
- approved ORBIS/Supabase identity services: authentication/session identity.

Do not create implicit cross-product database coupling.

Do not create a second Maya admin platform.

## 4. Permanent Termux workflow

The owner develops from Android Termux.

The initial docs-only GitHub bootstrap on 2026-09-30 is a one-time owner-approved exception used to establish the repository baseline before the first local clone.

After that bootstrap:

- repository source changes entering Git history originate from the owner's local Termux checkout;
- remote tools may inspect, audit and report;
- do not silently mutate Maya repository files through GitHub web/connector paths;
- do not push, merge, publish or deploy without explicit owner approval;
- never force-push or rewrite history without explicit authorization for the exact recovery action.

Expected path:

Termux local change → targeted checks → preview → final certification → owner approval → Termux commit/push → GitHub Actions/Sonar → repair until green → separately authorized release/deployment.

## 5. Branch model

Once local development begins:

- `develop` = current working/integration version.
- `main` = published/release source.

Do not introduce PR Preview or staging by default. Add either only when the owner explicitly requests it.

## 6. Mobile execution environment

Primary environment:

- Android Termux for Git/source workflow and compatible local development.
- Ubuntu `proot-distro` for standard-Linux/glibc-dependent tooling.
- evidence-producing or long commands write timestamped reports to `$HOME/storage/downloads/`.

Inspect shared tools before installing/upgrading anything. Do not break other ORBIS repositories by replacing working shared tooling.

## 7. Product scope

Initial product areas:

- Home
- Dream Analysis
- Birth Chart / Astro
- Ask Maya
- Local History
- Voice Input
- Optional Voice Output
- Settings
- Theme Selection

Maya is Bengali-first and mobile-first.

## 8. AI architecture

Never expose private AI-provider secrets in browser or Android client code.

Approved direction:

Maya client → authenticated ORBIS Foundation Maya gateway → existing AI service/provider manager/model router → approved provider.

Initial logical capabilities:

- `dream.analysis`
- `astro.interpretation`
- `general.chat`

Maya must reuse the existing Foundation AI platform rather than create a second provider-routing system.

## 9. Dream interpretation

Dream interpretation is reflective/interpretive content.

Do not present symbolic, spiritual or mystical interpretations as verified scientific facts.

Prefer structured results containing:

- symbols
- themes
- emotions
- interpretation
- reflection questions

## 10. Astrology

Astronomical/ephemeris facts must come from deterministic calculation or another approved factual astronomy source.

AI may explain those facts.

AI must not fabricate planetary positions, houses, aspects, coordinates or birth-chart calculations.

Clearly distinguish calculated facts from interpretation.

## 11. Local history and privacy

By default, dream/chat/astro history is device-local.

PWA target:
- bounded IndexedDB/local device storage.

Android target:
- native SQLite/app-local storage;
- native filesystem only when needed for approved local attachments.

Do not create a server-side Maya conversation-history database by default.

## 12. Voice

Voice input flow:

speech → speech-to-text → text request → Maya response text → optional TTS.

Do not retain raw audio as normal conversation history.

For the Android app, prefer appropriate native/on-device speech capabilities when available.

## 13. Authentication

Reuse the approved ORBIS/Supabase authentication and identity path.

Do not introduce Firebase solely for Maya unless a future accepted architecture decision explicitly changes this.

Sessions should remain persistent on the user's device where secure handling permits.

Authentication is not authorization.

## 14. Admin boundary

ORBIS Admin remains the central owner/control plane.

Admin may observe Maya product registration, release/current version, health, deployment and quality status through explicit contracts.

Maya user dream/chat history is not copied into Admin by default.

## 15. Theme

Approved default visual direction: **Maya V3 Astral**.

Characteristics:

- sharp cosmic/astral background;
- no unnecessary haze over the main visual;
- premium crystal/gloss UI;
- readable transparent surfaces;
- mystical without visual clutter.

One or two optional user-selectable themes may be added later.

Do not ship watermarked reference artwork.

## 16. Quality policy

The repository starts clean and stays clean.

Required direction:

- SonarQube Cloud open issues: 0
- Security Hotspots reviewed/resolved
- lint errors: 0
- lint warnings: 0
- TypeScript errors: 0
- production-code coverage: 100%
- dead/unused code: 0
- runtime duplication target: 0.00%
- high/critical dependency vulnerabilities: 0
- build: PASS
- relevant E2E: PASS
- no committed secrets

Do not accumulate quality debt with a plan to fix it only at the end.

## 17. Sonar isolation

Maya requires its own SonarQube Cloud project.

Expected identity, subject to verification after import:

- project key: `orbisaideveloper_orbis-maya`
- organization: `orbis`
- project name: `orbis-maya`

Never point Maya analysis at Foundation, Admin, Khata or another ORBIS project's Sonar identity.

Never commit or print `SONAR_TOKEN`.

## 18. Security

- Never commit secrets.
- Keep provider/service-role tokens server-side.
- Validate untrusted input.
- Enforce rate limiting and authorization at public AI gateways.
- Avoid unnecessary logging of sensitive transcripts or credentials.
- Use least-privilege integrations.
- Fail closed when identity/authorization cannot be established.

## 19. Testing discipline

During development, run checks relevant to the changed area and fix meaningful failures before expanding scope.

Before release, run the complete applicable quality gate defined in `docs/QUALITY-GATES.md`.

Green checks do not themselves authorize a push, release or deployment.

## 20. Documentation and handoff

Update durable documentation when architecture or accepted decisions change.

`docs/PROJECT_STATUS.md` must remain usable by a future AI session and state:

- current phase;
- branch/HEAD when known;
- completed scope;
- verification performed;
- blockers/unverified work;
- exact next action;
- remote/main/production impact.

A handoff is incomplete if another AI would need to reconstruct the project from chat history.
