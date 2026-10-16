# Login/profile repair checkpoint — 2026-10-16

Owner phone source: main 1468afcc82c0586b00f99c12d5b8c862530603c5 plus certified account changes.
PR #1 head 2f17d66ed8a6a233bd932b334a68ab073479083a had one OPEN Sonar S6582 at
src/auth/orbis-identity.ts:9. Main had zero issues. Replace the session condition
with equivalent optional chaining; do not waive the strict zero-issue rule.

Account screen now reads/edits the existing Admin common-profile API in Bengali,
English or Hindi. API/session validation, bounded requests, cancellation, account
switch isolation and server-issued canonical IDs are retained. Maya birth/family
profiles and histories remain device-local; they are not the common profile.
Local public Auth configuration is made explicit for the central authority without
removing previous device data/session keys. Do not auto-copy old account data.

Assistant static checks: affected TypeScript and ESLint passed. Owner application
tests, complete 100% coverage/PWA/mobile E2E, new exact CI/Sonar, deployment and
real account persistence are still pending. A source package is not certification.
The guarded Termux installer does not commit/push/merge/deploy or apply SQL.
Next: inspect its combined report and repair failures before final certification.
Two centrally stored Maya birth profiles still require a reviewed product-profile
contract/schema; this change does not claim that feature is complete.
