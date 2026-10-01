# Dream result and Foundation client integration

This is the client product flow, not proof of a live provider deployment.
Production requests use the existing restricted Foundation Maya gateway only.

## Contract

`maya.v1`, capability `dream.analysis`: reviewed text <=8000 characters; title,
context and emotion optional <=500 each. Blank optional fields are omitted.
Response contains exactly symbols/themes/emotions/interpretation/reflectionQuestions.
Lists contain 1..12 meaningful strings <=500; reflection questions 1..5;
interpretation <=6000. The existing gateway parser validates and trims every field.
No chart positions, tools, privileged repository commands or raw audio are sent.

The same parser validates local `dream.v1` records on reopen. A record contains
version, response language, original four-field input and validated result.
Legacy text records remain readable. Unsupported/corrupt structured records fall
back to plain text rather than executable content. All model output is React text;
no HTML/Markdown execution. Shape validation is not historical/cultural verification.
Dream interpretation is reflective, not certainty, diagnosis or a prediction.
Curated cultural references and product review remain future content work.

## User flow

Write -> review -> choose response language -> explicitly start analysis.
The review explains that text is transmitted to Foundation and its AI provider.
Bengali script selects bn, Devanagari selects hi, Latin selects en, otherwise the
UI locale is used. This is a simple three-language suggestion, not a universal
language detector. Mixed input prioritizes Bengali, then Hindi; users may override
before submission. Result text carries its response language even after UI changes.

The form is disabled while processing; cancellation aborts the client request.
Late responses after cancellation/unmount cannot update the screen or save history.
The backend/provider may continue an already accepted request; cancellation does
not promise remote processing stopped. No automatic retry. Safe translated errors
cover auth, policy, rate limits, timeout, network, unavailable and invalid output.
Writing and the previous valid result survive failure/cancellation.

Save result is explicit, commits before announcing success, and is disabled after
success. A failed save retains the result for manual retry. Leaving before saving
loses an unsaved result; draft saving remains separate and explicit. History opens
all five result sections, original input, and existing confirmed delete/clear.
Account boundaries use the verified shared Auth user scope; changing account remounts
screens. Tokens are obtained per request, never stored in a result or URL.

## Storage bounds

The existing v1 history schema is unchanged. The content bound increases from
16000 to 40000 characters and serialized entry from 64 to 96 KiB to accommodate
full accepted Dream input+result without truncating result fields. All kinds retain
100 entries/kind and 30 days; total remains bounded. Quota/eviction errors are
visible; storage is origin-specific and not an encrypted vault. No server archive.

## Required live configuration

Maya public config:
- VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY: approved shared ORBIS Auth.
- VITE_MAYA_GATEWAY_URL: exact Foundation `/api/maya/request` URL. HTTPS required,
  except explicit loopback HTTP development. Restart Vite after changing config.

Foundation server config/integration:
- shared token verification through existing requireAuthenticatedUser;
- exact approved Maya browser origin in MAYA_ALLOWED_ORIGINS;
- real Admin-controlled identity/membership/capability authorization adapter;
- existing configured AIProviderManager/provider routing and server-held credentials.

The inspected Admin identity write Edge Function uses a server service key and
is an identity observation/write contract. It is not a public capability decision
API and must not be called from Maya or interpreted as an entitlement grant.
No Admin credentials, service keys or private provider endpoints enter Maya.
The current canonical Foundation mount has no capability adapter. Live AI remains
denied until a real contract is wired; do not introduce unconditional authorization.
The accompanying Termux preflight reports config presence without secret values.
Presence alone never proves working Google login, Admin policy or a provider response.

## Verification

New unit/integration cases cover request serialization, auth scope, language,
strict result/local validation, complete large-record persistence, safe rendering,
errors/retry/cancel/unmount and local save/reopen. Mobile E2E adds mocked gateway
failure/retry -> structured result -> device save -> reload/reopen -> delete.
These tests deliberately do not contact a real provider or certify live authorization.
Owner runs coverage and full Linux certification in Termux/proot; assistant only
runs lint/typecheck and reviews the guarded scripts. Live account/provider smoke,
GitHub Actions, Sonar and deployment remain separate pending checkpoints.
