# Foundation Maya client transport

Status: typed transport foundation only, not an enabled Dream/Chat UI flow.
No live endpoint, automatic request, provider credentials or personal history
storage is introduced. Existing Astral layout and authentication screens remain.

`src/ai/gateway.ts` exports a dependency-injected client factory. Configure it with
the exact approved Foundation URL ending in `/api/maya/request` and a `getToken`
callback that obtains the current shared Auth session token at request time.
Never capture one token permanently when creating the client. A future UI adapter
will use the existing shared Supabase client; Foundation still verifies each user
token server-side and independently checks Admin-controlled capability permission.

Only HTTPS endpoints are accepted except explicit localhost/loopback HTTP for
Termux development. Credentials, query strings, fragments and other API paths
are rejected. The transport never calls `/api/chat` or a private AI provider.
Requests omit cookies, prohibit redirects, disable caching and carry the bearer
token only in the Authorization header. No token, input or result is logged.

Dream/Chat use the `maya.v1` backend contract. Typed overloads return the correct
capability-specific result. Successful replies are checked for exact version,
capability, response language and result fields. Invalid JSON, extra fields,
oversized data and cross-capability responses are rejected. This validates shape,
not historical interpretation accuracy or scientific claims.

Default deadline: 65 seconds, including token retrieval, fetch and reading the
response body. It is slightly longer than Foundation's 60-second provider HTTP
deadline. A supplied AbortSignal supports cancellation when a screen closes,
the active account changes, or the user cancels. Caller lifecycle wiring remains
part of the product flow. Response acceptance is capped at 64 KiB after reading;
this is not a streaming download limit. Foundation bounds generated results.

Safe error codes cover missing configuration, authentication, authorization,
rate limiting, unavailable backend, invalid response, timeout, cancellation,
network failure and invalid input. Existing shared Auth 401/503 responses and
gateway-specific failures are normalized by status without displaying server
error text. There is no automatic retry; explicit UI retry avoids unintended
duplicate AI requests.

Admin authorization/origin configuration is still pending in Foundation. Its
current canonical mount fails closed until the real policy adapter is supplied.
Do not claim live integration from fake transport tests. No new Maya database,
history repository, Google OAuth setup or Astro calculation engine is included.

Validation: preparation lint/typecheck only; owner runs targeted tests in Termux
without coverage. Owner's later coverage/Linux certification must cover these
new production files without exclusions. One completed report contains all checks.
