# Orbis Astro

**Orbis Astro — Astrology, dreams and Ask Maya by Orbis**

Orbis Astro is a mobile-first Bengali-English ORBIS product for dream analysis, astrology-oriented insights, structured reflection and conversational AI.

## Current phase

**Application foundation and interim product flows implemented; dashboard refinement and live integrations pending.**

Current source/development/migration evidence is recorded in
[`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) and
[`docs/ECOSYSTEM-CHECKPOINT.md`](docs/ECOSYSTEM-CHECKPOINT.md).

The React + TypeScript + Vite PWA foundation is implemented with the Maya V3 Astral initial shell.

The application foundation has verified unit testing, 100% production-code coverage, dead-code checking, zero-duplication checking, full Linux PWA generation and mobile Chromium E2E.

Feature implementation now proceeds incrementally from this certified baseline.

## Start here

Every AI agent, ChatGPT/Codex session and contributor must read these files before changing the project:

1. `AGENTS.md`
2. `docs/PRODUCT_SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DECISIONS.md`
5. `docs/QUALITY-GATES.md`
6. `docs/TERMUX-WORKFLOW.md`
7. `docs/PROJECT_STATUS.md`

The repository and verified reports are the implementation truth. Chat history is context, not proof that work is complete.

## Product scope

Initial Maya product areas:

- Home
- Dream Analysis
- Birth Chart / Astro
- Ask Maya
- Local History
- Voice Input
- Optional Voice Output
- Settings
- Theme Selection

## Core product principles

- Mobile-first and PWA-first.
- Android packaging follows after the PWA is stable.
- Bengali-first with natural English technical terms where useful.
- Simple interaction, premium presentation.
- Astronomy facts come from deterministic calculation, not AI guessing.
- AI may explain and interpret calculated facts.
- Dream/spiritual interpretation must not be presented as scientific certainty.
- Dream/chat/astro history is device-local by default.
- Raw voice audio is not retained as normal conversation history.
- Authentication reuses the approved ORBIS/Supabase identity path.
- Maya reuses ORBIS Foundation's AI platform instead of creating a second provider stack.
- ORBIS Admin remains the central owner/control plane.

## Git and release model

After this one-time owner-approved documentation bootstrap, repository source changes are made from the owner's Android Termux checkout.

Expected flow:

**Termux local work → targeted checks → local preview → final verification → owner approval → Termux commit/push → GitHub Actions + SonarQube Cloud → fix until green → separately authorized release/deployment**

Branch policy:

- `main` is the single active Git branch.
- Work is developed and verified locally before commit/push.
- After an owner-approved push to `main`, GitHub Actions and SonarQube Cloud certify the pushed commit.
- A failing `main` quality run blocks release/deployment until a new locally verified fix is pushed and all gates are green.

PR Preview and staging are not required by default.

## Quality baseline

Maya begins clean and must remain clean.

Required direction:

- SonarQube Cloud open issues: **0**
- lint warnings/errors: **0**
- TypeScript errors: **0**
- production-code coverage: **100%**
- dead/unused code: **0**
- runtime duplication target: **0.00%**
- high/critical dependency vulnerabilities: **0**
- build: PASS
- relevant mobile E2E: PASS
- no committed secrets

See `docs/QUALITY-GATES.md`.

## Theme

The currently approved default visual direction is **Maya V3 Astral**: a sharp cosmic/astral environment with premium crystal-gloss UI.

One or two additional user-selectable themes may be added later.

Watermarked or unlicensed reference artwork must never ship as a production asset.

## External systems

Connection responsibilities (implementation and live enablement are separate):

- GitHub: `orbisaideveloper/orbis-maya`
- ORBIS Foundation: shared AI gateway/provider routing
- ORBIS Admin: central product control/visibility
- Supabase/ORBIS identity: authentication/session
- SonarQube Cloud: dedicated Maya quality project

Maya already has a dedicated CI/Sonar configuration. Verify the current pushed
commit, Quality Gate and open issues before release; an old certificate does not
certify a new change. The manual Render Development static site is operational;
Public publication and live Maya AI/membership remain pending.

## Current product name and account candidate

Owner approved Orbis Astro on 2026-10-06; Ask Maya remains the AI companion.
Repository/project IDs and existing device data keys remain `orbis-maya`.
The original approved Orbis emblem remains unchanged. Welcome/account pages
share the three existing themes. Run `bash scripts/maya-local-dev.sh` for the
foreground local preview and `python scripts/maya-local-account.py --check` for
a redacted public Auth configuration report. Real login, canonical identity
binding, membership and AI entitlement are separate verification steps.
