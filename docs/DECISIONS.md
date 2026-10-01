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

## D-017 — Frontend foundation
**Status: LOCKED**

Maya PWA uses:

- React;
- TypeScript;
- Vite;
- ESLint as the primary application linter;
- `vite-plugin-pwa` for the PWA build foundation;
- Vitest + Testing Library for application/unit testing;
- Playwright for mobile E2E;
- KNIP for dead-code detection;
- JSCPD for runtime duplication enforcement.

This stack must continue to satisfy Maya's existing 100% production coverage and 0.00% runtime duplication quality contracts.

Native Android/Termux verification uses the core Vite production build because the verified `vite-plugin-pwa`/Workbox generation stage does not terminate cleanly in the current native Android environment.

The full PWA build remains mandatory through `npm run build:pwa` on the standard-Linux certification path and in GitHub Actions. PWA manifest, registration script and generated service worker artifacts must exist before a pushed application commit can obtain a green quality result.

## D-018 — Initial shell navigation
**Status: ACCEPTED — Coding Step 1**

The initial six-screen shell uses URL hash routes with native anchors and React's
`useSyncExternalStore`. This avoids a new dependency and static-host rewrite
requirements while preserving direct links, reload and browser Back/Forward.
Secondary screens are loaded through React lazy/Suspense. A route-keyed error
boundary contains render failures and allows recovery through Home.
This is navigation only; authentication and capability authorization are separate
later steps. Auth tokens and personal content must never be placed in route URLs.

## D-019 — Compact Astral dashboard
**Status: ACCEPTED — owner direction 2026-10-01**

Keep a light blue cosmic environment with original decorative SVG artwork,
crisp translucent glass cards and compact mobile Home. Two initial Home cards: Dream and Ask Maya.
All six routes are available in a native three-dot disclosure menu beside Astral.
There is no persistent bottom navigation. Artwork is decorative, not calculated chart data.
No new dependencies, external artwork requests or provider connections are introduced.

## D-020 — Maya account boundary
**Status: ACCEPTED — owner direction 2026-10-01**

Maya provides its own signup/login UI over the approved shared ORBIS/Supabase Auth.
It does not invoke Foundation Accounting account/organization/workspace APIs.
Canonical identity, Maya membership/access and account control records belong to
ORBIS Admin through explicit server contracts. Auth credentials/session authority
remain with shared Supabase Auth. No Maya server personal-history database.
An Auth user ID must not be mislabeled as the canonical ORBIS identity ID.
Admin project registration reuses the existing registry-driven project dashboard.

## D-021 — Three-language UI and response direction
**Status: ACCEPTED — owner direction 2026-10-01**

Provide complete Bengali, English and Hindi UI catalogs with Bengali as default,
a persistent Settings language selector and an extensible typed i18n boundary.
AI text replies must follow the user's input language independently of UI locale.
Voice language support follows device capability and offers transcript editing.
This authentication change implements UI language only; AI/voice remain later steps.
