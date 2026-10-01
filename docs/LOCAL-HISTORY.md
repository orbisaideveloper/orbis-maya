# Device-local history — schema v1

`createLocalHistory(verifiedUserId, options)` creates Dream/Astro/Chat repositories.
Pass the current server-verified shared Auth user ID, never email or a user-entered
scope. Recreate the repository when the active account changes; clear displayed
records and cancel old UI work on logout/account change before mounting new data.
UI/session integration is a subsequent change; this module does not authenticate.

Each user has a separate `orbis-maya-history-<userId>` IndexedDB database, version 1,
with entries keyed by `[kind, id]` and an index on `[kind, createdAt]`.
Isolation prevents accidental account mixing through the application API; it is
not encryption or a boundary against scripts running on the same web origin.
There is no HTTP, cloud backup, Admin archive, or server conversation database.

Repositories expose save/get/list/remove/clear; the root exposes unified list/clear.
Only title and canonical text content are accepted, with generated IDs/timestamps.
Structured results must be validated by their feature contract before serialization.
Raw audio/Blob attachments and additional draft fields are rejected.
Maximum title: 200 characters; content: 16,000 characters; serialized entry: 64 KiB.

Initial defaults: 100 entries per kind and 30 days; configurable bounds are 1–200
entries per kind and 1–365 days. These are initial implementation defaults, not a
new permanent retention policy. Reads and saves atomically remove expired/excess
entries. Expiry is cleaned when the app accesses storage, not while the app is
closed. The exact age boundary is retained. Newest timestamps sort first, with ID
as a tie-breaker. Saves resolve only after commit; failures roll back the transaction.
Connections close after operations. Blocked/unavailable/storage errors are typed
and contain no raw browser error or personal content.

Browser storage can be cleared or evicted; private browsing/device policy may
prevent persistence. IndexedDB belongs to the browser origin: preview ports 5173
and 5174 have separate data. This is local persistence, not a backup guarantee.
The Android app-private SQLite adapter remains future work.

Tests use the pinned development-only `fake-indexeddb` package; production uses
native IndexedDB and has no new runtime dependency. Tests cover persistence,
user/kind separation, retention, concurrent writes, deletion, invalid input,
blocked/unavailable storage and rollback. Real-browser persistence integration
and History UI tests must be added when the storage is wired into feature screens.
