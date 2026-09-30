# Maya Product Specification

## 1. Product purpose

Maya is an AI-assisted dream and astrology experience inside the ORBIS ecosystem.

The product should feel calm, premium, mystical and personal while remaining technically disciplined about what is factual, calculated or interpretive.

## 2. Target experience

- mobile-first;
- Bengali-first with clear English technical terms where appropriate;
- fast access after login;
- minimal friction;
- visually premium;
- useful with text or voice;
- private by default for personal history.

## 3. Initial areas

### Home

The entry surface for:

- Dream Analysis
- Birth Chart / Astro
- Ask Maya
- recent local insights/history
- theme/settings access

### Dream Analysis

Input:
- typed dream;
- speech-to-text transcript.

Structured output:
- symbols;
- themes;
- emotions;
- interpretation;
- reflection questions.

Interpretation is not scientific certainty.

### Birth Chart / Astro

Input may include:
- birth date;
- birth time;
- birth location.

Facts must come from deterministic astronomy/ephemeris calculation.

AI explains and interprets the calculated result.

### Ask Maya

Conversational follow-up for:

- dreams;
- symbols;
- astrology interpretation;
- reflective questions;
- related general conversation allowed by product policy.

### Local History

Stores relevant user history on device by default.

Initial PWA target:
- IndexedDB/local device storage;
- bounded retention.

Android target:
- SQLite/app-local storage.

### Voice Input

Audio is used for recognition and converted to text.

Raw audio is not retained as ordinary history.

### Voice Output

AI response remains text.

Optional platform/browser/native TTS may read the response.

### Settings

Expected settings include:

- language/display preferences;
- voice playback;
- theme;
- local-history controls;
- session/account controls.

## 4. Authentication experience

Reuse ORBIS/Supabase authentication.

Login should remain persistent on the device where secure session behavior permits.

Do not require unnecessary repeated login.

## 5. Theme

Default approved direction:
**Maya V3 Astral**.

The theme is part of product appeal, but visual effects must not reduce readability or performance.

Future:
- one or two optional user-selectable themes.

## 6. Privacy behavior

By default:

- do not store Maya conversation history in a Maya server database;
- do not copy dream/chat history to ORBIS Admin;
- do not retain raw voice audio as ordinary history;
- do not expose provider secrets to clients.

## 7. AI behavior

AI must distinguish:

- calculated/factual astronomy data;
- interpretive astrology content;
- dream symbolism/reflection.

The product must not fabricate calculated chart facts.

The product must not present mystical/spiritual interpretation as scientific fact.

## 8. PWA and Android sequence

1. Build and certify the mobile-first PWA.
2. Stabilize auth, local history, voice and core flows.
3. Add Android wrapper/native integrations.
4. Prefer native storage/voice where it materially improves the app.
5. Perform Android-specific testing before Play Store release.

## 9. Not locked yet

Do not invent decisions for items not yet approved.

Examples that remain to be selected during implementation planning:

- exact frontend framework/tooling;
- exact ephemeris library/service;
- exact Android wrapper details;
- exact local-history retention limits;
- subscription/payment model;
- analytics/telemetry policy.

Record accepted choices later in `docs/DECISIONS.md`.
