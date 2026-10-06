# Maya Project Status

Evidence checkpoint: 2026-10-06, Asia/Kolkata. This is a documentation update,
not a new application release or certification.

## Source and implemented scope

- Repository: `orbisaideveloper/orbis-maya`; Termux: `~/orbis-maya`.
- Reviewed main baseline: `25b14e1509c4fd43011a667d02e3ed5dfc06255e`.
- Single active main workflow; local verification and owner approval precede push.
- Existing source includes navigation, the interim Astral dashboard, shared
  Supabase password-auth UI, Bengali/English/Hindi catalogs, bounded per-user
  IndexedDB history/drafts, Foundation client and structured Dream results.
- Mocked AI/Auth E2E evidence certifies client behavior, not a live integration.

## Development and Public

Render static site `orbis-maya-development`, service `srv-davrsgbncjis73fhhr70`,
was observed LIVE on the reviewed Maya baseline in the 2026-10-05 platform audit.
URL: https://orbis-maya-development.onrender.com.
Build: `npm ci --ignore-scripts && npm run build:pwa`; publish directory: `dist`.
Auto deploy is off. This is a development PWA, not an approved public release.

Admin's Maya workspace includes Development/Public navigation and a full-screen
product link. The Public target remains disabled. A tab switch is not release
isolation: a future Public release needs a separate service/origin, a pinned
approved artifact, release records and verified rollback. Development errors or
deployments must not change the last published Public artifact.

## Foundation and Admin checkpoint

- Foundation source/runtime checkpoint: `a35dc66527c7295ce6b33be9528385d73c264e38`.
  Restricted Maya gateway code is committed and was observed deployed. Live Maya
  AI remains blocked by missing real Admin capability authorization; origins,
  user entitlement and provider behavior still require end-to-end verification.
- Admin main: `571906e08d989e92e3fa80ed43b61b1de3d9ac87` (PR #16 merged).
  Staging runtime was observed at the approved candidate
  `9d60d152fab06371bc7fcc30907c2920048824c8`.
- Admin central identity persistence and the `orbis-identity-write` API exist.
  Central identity linkage is distinct from Maya membership and owner privileges.
- Admin `database/control/maya-controls.sql` remains pending application at this
  checkpoint. Owner login/bindings/audit/deploy enablement is not certified live.
- Foundation's two accounting constraint migrations were applied and validated
  on 2026-10-06. They are Foundation migrations, not Maya/Admin identity migrations.

See `docs/ECOSYSTEM-CHECKPOINT.md` for migration method and configuration ownership.

## Verification limits and remaining work

Historical local tests and coverage remain recorded in owner reports. This
documentation update does not certify a fresh Maya CI/Sonar result. Recheck the
exact pushed commit's gates before any release; never infer zero issues from an
old test report. Foundation CI scan success is not separate Quality Gate proof.
Admin main CI and its strict Sonar checks were verified successful after PR #16.

No live Maya membership/AI, deterministic Astro calculation, public publication
or Android packaging is certified complete. Personal history remains device-local;
no raw audio or server conversation archive is introduced.

## Exact next action

Apply and review this documentation-only patch through Termux. Deliver Admin
documentation through its branch/PR/staging policy; obtain owner approval before
commit/push. Then develop the Maya dashboard UI in the owner's design chat using
the selected references, followed by existing account/identity integration and
Foundation AI wiring. Use real empty/loading/error states, not fabricated results.
Admin control schema and live enablement remain explicit follow-up checkpoints.
