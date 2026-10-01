# Maya authentication — Step 2 local candidate

## Boundaries

Maya owns its account UI. It uses the approved shared ORBIS/Supabase Auth service;
there is no Foundation Accounting account, organization or workspace request.
The pinned Supabase SDK version is 2.112.0, matching the supplied Foundation lockfile.

Canonical ORBIS identity, Maya product membership and entitlement metadata belong
to ORBIS Admin through versioned, authenticated server contracts. This candidate
does not implement that registration API, provision an Admin schema or claim a
Supabase Auth UUID is a canonical ORBIS identity ID. Admin registration and the
Foundation Maya capability gateway remain separate required integration work.

No personal Dream/Chat/Astro history or raw audio is sent to an account API.
No database client query, provider secret or Admin service key is introduced.

## Client behavior

Public Home, Settings and Account routes remain usable without login. Dream,
Astro, Chat and History screens require a server-verified Supabase user. These
screens still contain honest feature placeholders; they grant no AI capability.
The server gateway must independently validate tokens, membership and capability.
User-editable display name metadata is never used for authorization.

The SDK persists and refreshes sessions under a Maya-specific storage key;
credentials are not retained by Maya. Browser session storage is subject to the
same-origin/XSS boundary; it is not hardware-backed secure storage. Restore and
auth changes are validated with getUser, not by trusting local session data.
A rejected token or unavailable verification service hides private screens.
Pending verification is invalidated after sign-out or last subscriber cleanup.
Requests have a ten-second UI deadline. A deadline does not cancel SDK network work.
Logout uses the local-device scope and leaves other ORBIS application sessions alone.

The SDK uses PKCE and processes approved email confirmation callback URLs.
Allowlist the actual Maya callback origin plus `/#/account` in shared Auth settings
before testing signup. Do not change the global Site URL to repoint other products.
Confirmation requirement follows the existing shared Auth configuration. The UI
shows a generic confirmation message and does not reveal whether an account exists.
Recovery/password reset and native secure storage are later hardening work.

## Public configuration

Only the approved shared Auth URL and publishable/legacy anon key belong in
untracked `.env.local`:

```
VITE_SUPABASE_URL=https://your-approved-auth-host
VITE_SUPABASE_ANON_KEY=your-public-key
```

The client rejects non-HTTPS origins, URL credentials/query/path fragments and
privileged or invalid key formats. Never put service-role, Admin or provider secrets
in VITE variables. With no valid configuration the account UI stays disabled.
The apply helper can reuse only these public values from the existing Foundation
local env files; it never copies a DATABASE_URL or a server service key.

## Languages

A typed translation catalog covers Bengali, English and Hindi; Bengali is the
default. Settings stores only the selected locale, with an in-memory fallback if
storage is blocked. Cross-tab language updates are observed. Additional languages
can be added by extending the Locale union and supplying the full typed catalog.
AI response language and voice recognition are not implemented by this UI change;
they must follow the user's input language when those flows are introduced.

## Verification

Security-focused unit tests cover invalid config, credential validation, timeout,
restoration, rejected identity, stale async responses, auth event cleanup, signup
confirmation, logout and all three language selections. Mobile auth E2E uses a
separate local Vite fixture with fake public config and mocked Auth endpoints.
It never authenticates a real user or calls Foundation Accounting. This verifies
client behavior, not live shared Auth configuration or Admin identity integration.
The ordinary production preview remains a separate mobile E2E project.
