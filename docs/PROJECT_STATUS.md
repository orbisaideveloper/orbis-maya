# Current verified PWA checkpoint — 2026-10-12

Owner approved Maya-only commit/push on 2026-10-12 while Foundation/Admin checks
run separately. Reviewed base main: 0ec866132343b56e9b5d525810d61e230e004f32.
The new commit hash and remote verification are recorded in the Termux push report;
this document cannot contain its own future commit hash.

Owner Ubuntu certification: ORBIS-MAYA-LINUX-CERT-20261012-064046-25612.txt,
06:40:50–06:58:43 IST. 81 files / 624 unit tests, 21 mobile Chromium E2E PASS;
lines/statements/functions/branches each100%; lint, types, KNIP, workflow/preflight,
0.00% duplication, audit0 and full PWA manifest/service-worker generation PASS.
Native/source repositories were not modified/bound into the certification workspace.

Current source change scope: preserve CSS winning values while removing redundant
declarations, Set-based equivalent protected-route membership, extracted literal
public-config parser, parallel static-cache/service-worker cleanup and this status.
The layout regression test was restored to canonical main and compared actual
semantic DOM; it is no longer a changed file. Application source was certified;
this final checkpoint text is a documentation-only addition after that run.

Remaining: exact new pushed commit's GitHub CI/Sonar including zero open issues;
real Auth/entitlement/gateway/vision checks; unfinished daily guidance/notifications,
calculation reference fixtures and other MVP work. Full PWA certification does not
certify every planned feature or live backend. Foundation/Admin check outcomes
are not established by this Maya commit.

Android starter is PAUSED: owner wants existing three-repo checkpoints cleaned,
then PWA product completion, then Android APK/AAB. No Android source/dependencies,
Foundation accounting or other product accounts are changed by this commit.

Non-fatal certification warnings: shared npm globalignorefile setting, transitive
glob deprecation and543.74kB main JS chunk; audit and all local gates still PASS.
No setting/quality threshold is changed to silence these warnings.

Next: verify this commit's remote CI/Sonar, repair actual issues if needed; finish
Foundation/Admin checks without interrupting them. Release/deploy remains separate
owner authorization. Older checkpoint entries below are historical; current facts
above supersede previous statements that this Linux PWA/E2E run was pending.

---

# Orbis Astro Project Status

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

## UI implementation candidate — owner 2026-10-06 approval

Prepared against owner source report at 18:35:50 IST, main 705b0030aeb6112c427a3cc3940aed0e1e2ee293, retaining awareness of existing App.tsx/App.css edits. Includes three themes, six Home routes, themed inner design screens, persistent navigation, approved-logo-derived asset and product design-preview workspace. Existing live Dream/auth/history implementation remains separate from explicitly labelled design-only previews.

Not certified: Termux typecheck/lint/tests/build, Linux certification, exact mobile fit, live owner authorization, true pinned Published service, Publish executor and rollback. Publish is disabled; no release is performed. No Admin or Foundation source changed. Next: apply guarded patch in Termux, run targeted checks, review local workspace and all three themes, fix report findings, then final certification before separately approved commit/push.


## Owner visual refinement checkpoint — 2026-10-06
Owner accepted theme-matched crystal surfaces, compact composer and compact Astro screenshots. Prepared next coherent UI patch: crystal inner header, remove redundant Settings access on Profile page, theme-matched Home avatar fallback, full-height distinct Dream/Chat design workspaces using shared voice composer, four birth fields and selectable North Indian-style 12-house empty chart. House numbers are houses, not calculated zodiac signs. No planets are populated without deterministic calculation.

Existing authenticated Dream service, consent/review, draft/history storage and login logic are retained. New full-screen Dream composer is design-preview presentation; production Dream integration with that composer remains next work. Send remains disabled in design views. Likes/dislikes in preview are transient UI state, not persisted provider feedback. No real AI answers, ephemeris calculation, geocoding or Published release is certified by this patch. Browser speech support requires device verification. No raw audio archive, new dependencies or Admin/Foundation changes.

Original three-theme candidate targeted verification: owner reports 95 tests, lint/typecheck/core build PASS. Contrast command report at 19:05:21 confirms build PASS. Later refinements have screenshot acceptance, but automated check reports have not yet been reviewed. This next patch must pass targeted Termux tests/lint/typecheck/build and local preview before further work. Full Linux certification, 100% coverage and current CI/Sonar remain pending; no commit/push/deploy performed.


## Settings/Profile checkpoint — owner 2026-10-06
Bottom navigation is Settings; Profile is nested inside Settings alongside Theme, Language, Notifications, Privacy and Account. Header/Home have a notification link instead of a duplicate Settings shortcut. Selected Kundli house is highlighted by its exact polygon; expanded detail surface remains empty until deterministic calculation.

Added device-local profile (name/birth date/time/place), bounded/validated and keyed separately per authenticated user. Explicit local design preview has a separate labelled device draft; it is never automatically merged into an account. Home greeting reads the saved profile name, and Astro inputs initialize from saved birth data. No central identity, Supabase metadata, provider secret, login or server profile database changes. Birth-chart calculation and personalized insights remain unconnected; no fabricated data. Later real calculation must be invalidated/recomputed when birth data changes.

Header-fit owner report reviewed: 18 targeted tests, typecheck, lint and core build PASS at 19:58. Next patch verification pending. Next action: guarded Termux apply and targeted checks, local Settings/profile persistence/selection review, then existing authenticated Dream integration. No commit/push/deploy authorized or performed.

## 2026-10-06 — Orbis Astro account/design candidate

Owner approved Orbis Astro branding, unchanged Ask Maya companion, original
emblem and crystal welcome/login pages. Candidate adds pre-login welcome,
theme-matched login, password visibility, email recovery/reset and matching PWA
labels. Existing verified-session auth and per-user local history remain.
Termux application/checks and real login are pending this candidate report.

Read-only Admin inspection on 2026-10-06: project aqcwhqdzniruvoqwfsij healthy,
central identity schema present; auth.users count 0, no owner email identifier
match for orbisaideveloper@gmail.com, no orbis_control schema and only identity
write Edge Function. This does not prove Foundation login is absent: Foundation
uses a separate credential path and server API identity links. Do not point Maya
at the empty Admin Auth project automatically. Review the local public Auth
host and existing Foundation configuration first. Canonical identity binding,
Maya membership/owner authorization and live AI remain unverified/pending.
No database writes, signup, password changes, remote deployment or Git mutation
were performed by preparing this candidate.


# Orbis Astro local runtime checkpoint — 2026-10-06

Baseline main: 705b0030aeb6112c427a3cc3940aed0e1e2ee293. Prior owner reports:
111 account/UI regressions passed; latest entry patch 58 tests, typecheck,
zero-warning lint and core build passed. Shared Foundation/Maya Supabase Auth
configuration matches; endpoint reachable. Owner screenshot shows verified
signed-in state for the existing account. Canonical ID and Maya capability
membership are not established by this evidence.

Candidate: compact Settings account name/email/Sign out, separate Profile route,
bounded user-scoped local avatar, authenticated Dream composer with existing
review/consent/draft/history/service retained, indexed voice result reconciliation,
and Ask Maya client using the existing restricted Foundation gateway. Preview
routes remain presentation-only. Raw audio and server conversation persistence
are not introduced. Local photos are reencoded JPEG and stored separately per
user, never copied from a preview draft. Pending: candidate Termux checks/device
review, complete coverage/E2E/quality certification. No Git writes/deployments.

Foundation main docs were read during this checkpoint: live gateway remains
fail-closed until real Admin membership/capability authorization and exact origins
are connected. Client wiring is not live AI certification. Do not replace policy
with unconditional access. Astro interpretation remains reserved until the
calculation contract exists. Deterministic ephemeris engine, location selection,
historical timezone resolution and accuracy fixtures are not implemented by
this UI patch. Browser speech recognition may produce platform tones or stop
unexpectedly; continuous/restart behavior cannot promise native silence.

Next: apply candidate, run the supplied checks, inspect local runtime source and
available dependencies in Foundation/Admin, then implement verified identity
binding/policy and the deterministic calculation adapter. Personal chart facts
must not be supplied by an LLM. Do not mark these stages complete before real
owner-authorized requests and fixture validation succeed.


## Ask Maya grounding and turn positioning — local patch 2026-10-07

Owner RESPONSE-FIX report: 9 files / 67 tests PASS; runtime diagnostics show
astro requests authorized, HF replies and gateway HTTP 200. This proves transport,
not explanation quality. Screenshots show requests for already-supplied birth data
and incorrect third-house topics.

This patch supplies conventional house topics, explicit chart-present response
instructions and user-only model history for natal discussions. UI retains all
conversation messages. New questions anchor at top; assistant completion does
not move the reading position. No new calculation, provider, storage or billing.

Assistant validation: payload integrity and syntax only. Native application tests
run on owner Termux through the installer; manual answer quality and mobile scroll
remain unverified until owner checks. Exact next action: run installer, refresh
existing localhost preview, ask house 3 and chart overview questions. Ensure actual
placements are explained without re-requesting DOB. Full Linux/E2E/Sonar gates
remain outstanding. No commit, push, remote deployment or public release.


## Compact chat controls candidate — 2026-10-07

Prepared from owner CHAT-SOURCE report at 21:31:56 IST. Groq provider and
qwen/qwen3.8-27b settings were confirmed in owner integration/start reports;
manual house-3/house-5 replies matched supplied chart facts and improved Bengali.
Those checks do not certify arbitrary generated interpretations.

Candidate replaces the chat header's notification action with one three-dot
disclosure. Provides local archive, download/share, new conversation with archive
before reset, confirmed current/all-chat deletion and access to Saved Insights.
Profiles, calculated charts and dreams are outside the clear-chat boundary.
Late aborted responses cannot restore a cleared conversation. Answers display
as safe React text paragraphs/bullets. No HTML parsing/new dependencies.
Foundation prompt adds ordered, detailed explanations and per-claim uncertainty;
this is not complete semantic validation or a new ephemeris calculation.

Termux targeted checks/device preview are pending this candidate. Complete Linux
coverage/E2E/Sonar certification remains outstanding. No commit/push/deploy.
Next: inspect the owner check report and preserve any failing output. Then wire
image/document inputs using the current Foundation request/authorization contract
and verified vision model support; raw attachments must not be stored in chat
localStorage or ordinary request logs. Calculation-reference review remains
separate outstanding work; this patch does not alter planet coordinates.


## Chat tools repair candidate — 2026-10-07

Owner chat-tools report: typecheck/lint/diff checks PASS; 17/19 targeted tests
PASS. Runtime configuration and chart discussion tests FAIL; Foundation checks,
build and gateway reload did not run. This is not provider failure evidence.
Repair evaluates gateway availability on render, publishes the question before
chart preparation, and prevents canceled preparation from restoring cleared chat.
Chart discussion test seeds a real calculated saved chart to verify the saved
profile path without including cold module loading in a one-second UI wait.
Added cancellation-during-calculation regression. Assistant syntax inspection
only; owner Termux tests and mobile checks remain pending. No commit/push/deploy.
Next: run repair installer, inspect FINAL_EXIT, then verify house 3/5 discussions
and menu behavior. Attachments and full release quality gates remain pending.


## Bengali examples and attachment candidate — 2026-10-07

Prior owner repair report: Maya 20 tests and Foundation 18 tests PASS, typecheck
and lint PASS, core build PASS, local gateway reloaded. Build bundle-size warning
remains. Full Linux coverage/E2E/Sonar certification has not run.
New candidate: Foundation reviewed Bengali intent examples (provider prompting,
not automatic weight updates), approved-only JSONL export, image/PDF/TXT chat
attachments and menu shadow cleanup. PDF uses lazy bundled PDF.js worker; owner
installer pins dependency and records lockfile change. Files are transient in the
active account's screen, transmitted to Foundation/provider only on Send, never
written to normal chat history or examples. Navigating away discards unsent
files; follow-ups may need reattachment. Up to 3 images or PDF pages, 8 MB per
source file; PDF documents exceeding 3 pages fail clearly without truncation.
Attachment discussions use general chat and do not replace the profile chart.
Manual PDF readability, provider vision and attachment mobile behavior unverified.
Owner tests are embedded in installer; no assistant application tests, paid model
download, commit, push or deployment. Next: run installer, inspect combined
report, then send a non-sensitive 1-page PDF/image and ask what it contains.

## Compact input follow-up — 2026-10-07
Previous Bengali/attachments run: Maya 23 tests, Foundation 61 tests, typecheck/lint/core build PASS; gateway READY. Owner rejected the separate attachment row. Follow-up moves a compact plus inside the input, opens formats/help only on tap and constrains mobile width; selected files are a compact overlay. Phone preview and real image/PDF provider reading remain pending. Excel parsing is not implemented. Full Linux/E2E/coverage/Sonar remains pending. No commit/push/deployment.

## Local workflow and chat viewport — 2026-10-08
Prior owner run: 84 targeted tests PASS; typecheck/lint/build/audit PASS; gateway READY. Current follow-up pins the chat to the visual viewport (including keyboard resize), constrains body/root scroll and leaves only the transcript scrollable. Native report wrapper and local commands documented in docs/LOCAL_DEVELOPMENT.md. New patch checks and phone preview pending. Full Linux certification and remote Sonar pending; commit/push preparation authorized, nothing pushed yet. Foundation complete local chat bootstrap and Khata/Admin workflow propagation remain pending source inspection.


## Sonar repair candidate — 2026-10-09 (Asia/Kolkata)

Canonical main baseline: `24ad9a28777d142c339eacd611be686e2e7c949f`.
The owner pushed this commit. Its Sonar scan uploaded successfully but the gate
failed: one S2245 vulnerability and 159 code smells. Existing pre-push reports
showed 620 tests, 100% production coverage, clean lint/types/KNIP, 0% runtime
duplication, PWA build and 10 app plus 10 layout E2E checks passing. These are
baseline results, not certification of this repair candidate.

The owner applied the secure UUID token fix locally and reported typecheck,
zero-warning lint and all 29 affected report-popup tests passing. It is not yet
confirmed resolved by a subsequent remote Sonar analysis.

This candidate addresses the other 159 findings: 53 duplicate CSS blocks,
contrast, nested conditionals/templates, function complexity, native status/
dialog/group semantics, stable repeated-content keys, serial attachment/PDF
processing, statement boundaries, optional chaining, Unicode-safe XML and
public-config parsing. The base theme rule stays before theme overrides.
Existing array-like speech results remain supported. Chat cancellation, browser
Back/focus handling, local data boundaries and ordered PDF processing remain
part of the existing regression suite. Quality thresholds and Sonar exclusions
are unchanged. Mobile layout and the new style comparison now run in the main
Playwright configuration used by CI.

Assistant verification: source review, Python/shell syntax and CSS selector
winning-declaration comparison. Application tests run only on the owner's
Termux/Ubuntu environment. This entry does not claim the candidate passed tests,
full coverage, mobile E2E or the remote zero-issue gate.

Next action: run ORBIS-MAYA-SONAR-ALL-FIX.sh in a separate Termux session.
It streams one combined report, performs native checks, synchronizes the current
source into the existing Linux certification checkout, and runs coverage once,
KNIP/duplication/audit/PWA and all configured mobile/browser checks. It does not
install shared tooling or restart the existing app/gateway. Review failures
before further work. After full local verification and owner approval, commit
and push one combined repair; require new CI/Sonar results with zero open issues
before any separately authorized release. No commit/push/deployment is performed
by applying or testing this candidate.


## 2026-10-11 guarded audit repair candidate

Reviewed owner snapshot: Maya main 0ec866132343b56e9b5d525810d61e230e004f32.
Owner combined targeted evidence: Maya 91, Foundation 88, Admin 4 tests PASS;
Maya production core build rerun PASS. These certify the preceding source,
not this repair. Current candidate restores comparison of prior retagged HTML
against actual current semantic HTML in the CSS layout regression test.
The test must run in the existing Ubuntu Chromium certification environment.
Do not retag both frames to obtain a false layout pass.

Read-only Admin inspection now confirms membership migrations dated Oct 7,
forced-RLS tables and ACTIVE maya-access v2; prior not-deployed statements are
historical. Live allow/deny/revocation and provider attachment reading still
need explicit runtime evidence. Foundation candidate separates rulership and
negated sign wording from natal-location contradictions; prose verification
remains partial and is not certification of houses/degrees/motion.

Next: run guarded repair through owner Termux, inspect timestamped report,
then existing Maya Ubuntu Linux certification and phone Astro/attachment review.
Preserve failures, fix actual semantic CSS differences rather than weakening tests.
No accounting changes, database writes, migration execution, provider configuration,
server restart, commit, push or deployment are included.


## 2026-10-15 — Canonical account ID display candidate

Read-only central Auth inspection confirmed one confirmed account and a successful
sign-in. The central customer binding count was zero: direct Maya Supabase signup
does not itself invoke the Admin customer bootstrap. This candidate reuses Maya's
existing device session and calls the approved Admin customer/session boundary
from the account page. The server verifies the live session and creates/reuses
its canonical UUIDv7/display ID. UI displays only the validated server-issued
ORB-U identifier; neither Auth IDs nor user metadata are relabeled as Orbis IDs.
Three-language loading/error/retry behavior, bounded request cancellation and
unmount/account separation are included. Credentials are not copied into URLs,
profile metadata, reports or an additional session store. Product permissions,
owner rights and personal device data are unchanged.

Owner Ubuntu report ORBIS-ACCOUNT-RESUME-20261015-005828 confirmed Maya
90 tests and Admin 25 tests, TypeScript and affected lint PASS. Final whitespace
check stopped on an extra document EOF blank line, corrected in the next
certification candidate. A mocked mobile account-ID/reload regression is included
in the browser suite; it never authenticates with live Admin. Full Linux
coverage, E2E, remote Sonar and real ID display remain pending. Admin has a related
isolated menu/email-default patch; Khata main contains the central auth client,
but its live build configuration and sign-in are unverified. Foundation still
uses its existing configurable Auth/account path; compatibility, existing user
mapping and product permissions must be checked before changing it. This is not
an all-products login certification. No commit, push, merge or deployment is
performed by this candidate. Next: review the combined owner test report, repair
failures, complete certification, obtain owner Git delivery approval and verify
the same ID on the released account screens.

## 2026-10-15 — Account route restoration repair candidate

Owner full-cert report ORBIS-ACCOUNT-CERT-20261015-153059 confirmed Maya
654 tests, all four production coverage metrics 100%, lint/types/workflow checks,
KNIP, zero duplication, zero audit vulnerabilities and PWA build PASS. Mobile
E2E passed 21/22; the new account-ID test exposed a real redirect: a signed-in
/account route was sent to Home. Admin full certification did not start.

Candidate limits the account-to-Home redirect to an interactive signed-out to
signed-in transition; restored sessions and deliberate account navigation remain
on /account. Existing welcome and logout navigation remain. Settings gains an
account link. Route regressions cover restoration, navigation and fresh login;
the mobile ID test also reopens the account through Settings. Backend identity,
profile persistence and product permissions are unchanged by this route repair.
Assistant affected lint/types passed; owner certification pending. No Git writes
or deployment. Central profile/Maya saved-profile integration and live acceptance
remain explicit unfinished work after this navigation checkpoint.

## 2026-10-16 — Account candidate locally certified; PR delivery prepared

Maya passed 657 unit tests and 22 browser tests. Admin passed 607 tests. Both
reported 100% in all four production coverage metrics, and the required local
quality/build checks passed. Source hashes were rechecked by the runtime-only
report ending 20261016-111519; Admin account HTML/client/config/registry smoke
passed. Live Admin health/config/account returned HTTP 200 with customer auth
available on the previous main revision. These local results do not certify
the final remote PR or a deployment. Owner approved gated main delivery and
CI candidate runtime verification instead of a permanent staging service.
Remote checks and exact main merge revisions must be confirmed from the
Downloads delivery report. Real-user Orbis ID/profile persistence, Maya two
central birth profiles and Khata/Foundation live login remain unfinished.
