# Local History screen

The signed-in `/history` route now lists the current verified shared Auth user's
local Dream/Astro/Chat entries. Native disclosure controls open canonical saved
text; content is rendered as plain React text, never HTML. No fabricated example
records are added to production. Feature flows that save records remain later work.

The route mounts HistoryScreen with the verified Auth user ID as its React key.
Changing account replaces the entire component before any new records are shown.
Checking/signed-out/error identity phases mount AccountScreen instead. In-flight
reads and mutation completions cannot update an unmounted History screen. Logout
hides private records without clearing the user's saved IndexedDB history.

Delete and clear require a separate explicit confirmation. Cancel performs no
storage mutation. Clear affects only this verified user on this browser origin.
Buttons disable during mutations; no successful UI change precedes storage commit.
Failures use translated generic messages, with retry. Empty/loading/error states
and Bengali/English/Hindi labels use the existing typed locale catalog.

Storage retention and origin/eviction behavior remain as documented in
`docs/LOCAL-HISTORY.md`. Native SQLite, Google Auth configuration, Admin membership
integration, and real AI enabling are separate pending work. This change adds no
runtime dependency or backend/history database and keeps the accepted Astral shell.

Tests: screen loading/read failure/retry, disclosure, empty translations,
confirmation/cancel, deletion/clear, pending mutation, late success/failure after
unmount, account switch and logout. A mobile Chromium test uses actual IndexedDB
with isolated test-only seed records to check persistence across reload, deletion,
clear, preservation of another account's data and horizontal overflow.

Preparation lint/typecheck PASS; the owner must run the generated apply script for
native coverage and complete Linux certification. Do not report candidate tests
or browser behavior as PASS until the completed owner report verifies them.
