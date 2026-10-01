# Dream input checkpoint

The verified-user `/dream` screen accepts canonical text, including an edited voice
transcript, and optional title/context/emotion. Maximum lengths match the Foundation
request contract: dream 8000 characters; each optional field 500. Review requires
non-whitespace dream text. Review displays the user's writing, never an invented AI
result. Interpretation is described as reflective, not certainty or prediction.

Draft persistence is explicit: Save draft retains all fields locally, including an
unfinished empty dream. Unsaved edits are not autosaved. Save completion is shown
only after commit. Discard uses a native confirmation and clears saved/current text
only after successful deletion. Failure retains current writing and permits retry.

Each verified user has a separate IndexedDB namespace
`orbis-maya-dream-draft-<userId>`, schema v1. There is one record with ID `current`;
atomic put replaces it without deleting the previous draft before commit. The
existing history repository's optional replace flag defaults to false, preserving
append/duplicate-ID rejection for ordinary history. Draft namespace uses the same
30-day retention boundary and bounded canonical text storage. Drafts do not appear
as completed analysis history; clear draft is separate from completed-history clear.
Draft JSON is structurally validated on read/save; malformed stored data fails safely.

Verified Auth user key replaces the screen on account changes. Leaving the route,
checking identity or logout unmounts it; late read/save completions cannot change
newly mounted UI. Saved drafts remain local after logout. No raw audio, browser
provider request, server history database, Admin account write, or live AI enabling.

The existing gateway already validates the five-field Dream result contract:
symbols, themes, emotions, interpretation, reflectionQuestions. This checkpoint
implements input/review/draft only. Structured result UI and real submit/cancel AI
requests are next work and require approved identity/authorization configuration.
Optional empty input fields will need omission when creating a gateway request.
The response language must follow user input, not merely the display locale.

Preparation lint/typecheck PASS. New draft/form tests and browser tests are not run
here at owner request; the apply script runs native coverage and full Linux gates
with live progress and one completed combined report. No commit/push is authorized
by checks alone. Phone preview requires configured shared Auth; E2E identity is an
isolated test mock, not proof of live account/Google/Admin integration.
