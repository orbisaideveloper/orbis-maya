# Maya Project Status

## Source and authority

Repository orbisaideveloper/orbis-maya; canonical source ~/orbis-maya in Termux.
Main-only, expected HEAD 9983ac68af761234530fce3a86019229fb1ce7b6; feature changes
remain local/uncommitted. No commit/push/deploy authorized or performed.
Admin is independently under development; no Admin source/database writes here.

## Verified baseline — 2026-10-01

Dream input native/Linux report ORBIS-MAYA-DREAM-INPUT-FULL-20261001-212821.txt:
168/168 tests, 100% statements/branches/functions/lines, lint/typecheck/KNIP,
0.00% JSCPD, audit zero vulnerabilities and full PWA build PASS. Its Dream mobile
reload assertion FAILED; the overall report was FAIL, not a completed certification.

Root cause evidence ORBIS-MAYA-DREAM-ERROR-CONTEXT.txt showed the restored draft
and title on screen despite getByLabel failing to find the textarea. The locator
was changed to textbox role + accessible name. Owner report
ORBIS-MAYA-DREAM-LOCATOR-RECHECK-20261001-220128.txt: all 8/8 Pixel-7 E2E PASS,
exit 0, finished 22:02:20 IST. Coverage/build were not repeated because that fix
changed only E2E source. Earlier session/timeout speculation did not fix the issue.

Implemented baseline: accepted Astral Home and compact three-dot navigation;
shared Auth client/login/password signup/session verification/logout/protected
routes; three-language UI; authenticated Foundation transport; versioned scoped
IndexedDB repositories; History open/delete/clear; Dream review and local drafts.
Foundation local gateway/contract target tests previously PASS, but its full
quality/release state and live provider use are not certified here.

## Current candidate — Dream result product flow

Reviewed input -> authenticated Foundation request -> strict five-field result ->
explicit local save -> structured History reopen/delete. Safe errors, manual retry,
client cancellation, late-response suppression and response language override.
No new dependency. Same local schema with increased bounded content capacity.
See docs/DREAM-RESULT.md for exact contract, retention and configuration.

Preparation lint/typecheck and apply-script static review/syntax PASS.
New unit tests/coverage/mobile E2E NOT run in assistant environment at owner request.
The guarded Termux apply command collects a read-only connection preflight and runs
native coverage then full persistent Linux certification into one live completed
report. A failure blocks expansion. Previous baseline does not certify new code.

## Live blockers and boundaries

Shared Google login and real customer identity/membership configuration remain
unverified. Foundation mount still lacks a real Admin capability adapter; exact
Maya origins and provider configuration require runtime verification. Admin's
service-key identity write endpoint is not public capability authorization.
No authorization bypass or Foundation Accounting APIs are introduced.
Public Home remains available; private features require server-verified identity.
Personal history stays in IndexedDB; no raw audio or server conversation archive.

## Exact next action

Owner applies candidate, sends the ONE finished report, previews Dream/History.
Repair any failure before expanding. Inspect preflight and current Admin contract
before wiring actual capability authorization. Then configure shared identity,
approved origins and existing Foundation provider; verify a real Dream response.
Remote GitHub Actions/Sonar require a separately approved Termux commit/push.
Production deployment and Android packaging remain separately deferred.
