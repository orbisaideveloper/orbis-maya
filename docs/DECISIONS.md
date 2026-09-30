# Maya Durable Decisions

Only accepted durable decisions belong here.

## D-001 — PWA first, Android second
**Status: LOCKED**

Build Maya as a mobile-first PWA first. Add Android packaging/native integration after the PWA is stable.

## D-002 — Reuse ORBIS Foundation AI
**Status: LOCKED**

Maya does not create a second AI-provider platform.

AI requests route through an authenticated public Maya gateway in `orbis-foundation` and reuse existing provider/model routing.

## D-003 — No direct client provider secrets
**Status: LOCKED**

Hugging Face and other private provider credentials remain server-side.

## D-004 — Local-first personal history
**Status: LOCKED**

Dream/chat/astro history is device-local by default.

PWA target: IndexedDB/local device storage.

Android target: SQLite/app-local storage.

A central Maya server conversation-history database is not part of the initial design.

## D-005 — ORBIS/Supabase authentication
**Status: LOCKED**

Reuse the existing ORBIS/Supabase identity path.

Do not introduce Firebase solely for Maya authentication unless a later accepted decision changes this.

## D-006 — Voice flow
**Status: LOCKED**

Speech becomes text before AI processing.

Raw audio is not retained as ordinary Maya history.

AI output remains text with optional TTS.

## D-007 — Deterministic astronomy
**Status: LOCKED**

Birth-chart/astronomical facts come from deterministic calculation.

AI may explain/interpret but must not invent chart positions.

## D-008 — Interpretive content is not scientific certainty
**Status: LOCKED**

Dream, symbolic and spiritual interpretation must not be described as verified scientific fact.

## D-009 — Default theme
**Status: LOCKED**

Default approved visual direction is **Maya V3 Astral**.

Additional user-selectable themes may be added later.

Watermarked reference art is not a production asset.

## D-010 — One central ORBIS Admin
**Status: LOCKED**

Maya does not create a second independent admin dashboard.

ORBIS Admin remains the central owner/control plane.

## D-011 — Termux-controlled source workflow
**Status: LOCKED**

After the one-time initial docs bootstrap, source changes entering Maya Git history originate from the owner's Android Termux checkout.

## D-012 — Single-branch main workflow
**Status: LOCKED**

Maya uses `main` as its single active Git branch.

Implementation happens first in the owner's local working tree.

After local server/manual checks where applicable, automated local verification and explicit owner approval, the verified commit is pushed directly to `main`.

GitHub Actions and SonarQube Cloud certify the pushed `main` commit.

A red `main` commit is not release/deployment eligible. It must be repaired through a new locally verified commit and pass all required gates before release.

No separate integration branch is required.

## D-013 — No default PR Preview/staging requirement
**Status: LOCKED**

PR Preview and staging are not required by default.

They may be introduced only if the owner explicitly requests them.

## D-014 — Strict clean-code baseline
**Status: LOCKED**

Maya starts clean and stays clean.

Targets include:

- Sonar open issues: 0
- lint warnings/errors: 0
- type errors: 0
- production-code coverage: 100%
- dead code: 0
- runtime duplication: 0.00%

## D-015 — Dedicated Sonar project
**Status: LOCKED**

Maya requires an isolated SonarQube Cloud project.

Expected identity, to verify after import:

- project key: `orbisaideveloper_orbis-maya`
- organization: `orbis`
- project name: `orbis-maya`

## D-016 — Quality model
**Status: LOCKED**

Maya adopts the strict quality posture used by ORBIS Admin, combined with the simpler owner-controlled Termux workflow used successfully in other ORBIS work.

No production code begins before the quality foundation is defined and Sonar isolation is verified.
