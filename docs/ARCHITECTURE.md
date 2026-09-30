# Maya Architecture

## 1. System boundary

Maya is the customer-facing product layer.

It must remain separate from shared AI infrastructure and ORBIS administration.

## 2. Logical request flow

Maya PWA / Android

→ authenticated request

→ ORBIS Foundation public Maya gateway

→ authentication/authorization validation

→ product/origin/rate-limit/request validation

→ existing Foundation AI orchestration/provider routing

→ approved AI provider

→ structured response back to Maya

No browser-to-provider secret path is allowed.

## 3. Repository responsibilities

### orbis-maya

Owns:

- customer UI;
- PWA;
- later Android packaging/native integration;
- product flows;
- local history;
- voice UI/integration;
- theme and settings;
- structured display of dream/astro/chat results.

### orbis-foundation

Owns:

- public Maya AI gateway;
- user-token verification;
- capability validation;
- provider/model routing;
- fallback behavior;
- provider secrets;
- shared AI safety/rate controls.

The existing Foundation AI stack should be reused.

### orbis-admin

Owns:

- central owner/control-plane visibility;
- project registration;
- release/current version visibility;
- service health;
- deployment/quality observability;
- approved operational controls.

It does not receive a copy of personal Maya chat history by default.

## 4. Authentication

Preferred path:

Maya → Supabase Auth / ORBIS identity → persistent session/JWT → Foundation user-auth verification.

Authentication and authorization remain separate.

## 5. Local data

A central Maya server conversation-history database is not part of the initial architecture.

PWA:
- bounded IndexedDB/local device storage.

Android:
- app-local SQLite;
- native filesystem only when justified.

## 6. Voice architecture

microphone → speech recognition → transcript text → AI request → text response → optional TTS.

Raw audio is not a permanent conversation record by default.

## 7. Astrology architecture

birth data → deterministic ephemeris/calculation engine → structured astronomical facts → Maya interpretation/explanation.

AI does not replace calculation.

## 8. Release architecture

Development begins locally in Termux.

Maya uses a single active Git branch:

- `main` = canonical source, CI-quality source and release source.

Changes are implemented and verified in the local working tree first.
After owner approval, the verified commit is pushed directly to `main`.

GitHub Actions and SonarQube Cloud certify the pushed `main` commit.
A failing quality/Sonar result makes that commit ineligible for release or deployment until a new verified fix is pushed and all required gates pass.

Production deployment must follow an explicitly approved green release state.

PR Preview and staging are optional, not baseline requirements.

## 9. Cross-product contracts

All ORBIS cross-product connections must be explicit and versionable.

Do not create hidden shared-database joins between independently deployed products.

## 10. Architecture changes

Any durable architecture change must update `docs/DECISIONS.md` and, where relevant, this document in the same verified change.
