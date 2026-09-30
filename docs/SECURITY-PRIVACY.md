# Maya Security and Privacy Baseline

## 1. Personal content

Dreams, questions and astrology inputs may be sensitive personal content.

Collect and retain only what the product actually needs.

## 2. Local-first history

By default, Maya personal history remains on the user's device.

Do not create server-side conversation persistence merely because a backend exists.

## 3. Voice

Raw voice audio is not normal history.

Speech should be converted to text for processing.

Do not retain audio without an explicit future product decision and clear user-facing reason.

## 4. Secrets

Never expose or commit:

- provider API tokens;
- Supabase service-role secrets;
- Sonar tokens;
- deployment secrets;
- private keys;
- other privileged credentials.

Client applications receive only values safe for clients.

## 5. Authentication and authorization

Reuse the approved ORBIS/Supabase identity flow.

Validate authenticated users server-side at privileged/public AI gateway boundaries.

Authentication alone does not grant every capability.

## 6. Public AI gateway

The Maya gateway should eventually enforce:

- authentication where required;
- request validation;
- capability validation;
- origin/product constraints where appropriate;
- rate limiting;
- bounded payload sizes;
- safe error behavior;
- secret redaction;
- auditable operational events without unnecessary transcript logging.

## 7. Logging

Avoid logging:

- passwords;
- access tokens;
- provider secrets;
- complete sensitive transcripts unless an explicit policy requires it.

Prefer identifiers, status and technical metadata necessary for diagnosis.

## 8. Fail closed

When identity, authorization, provider configuration or required security state cannot be established, prefer an explicit unavailable/error state over unsafe fallback.
