# ORBIS local development and Bengali curation

Owner workflow, 2026-10-08 (Asia/Kolkata).

Develop and preview from the owner's Termux checkout, using localhost. The owner
runs all application tests and shares reports; assistant prepares guarded patches
and reviews results. Keep existing servers alive. Check tracked PID, cwd and port
before any server restart; never kill by process-name wildcard. Do not reinstall
shared tooling by default. Do not silently use production credentials or bypass
identity/authorization to make a local chat work.

Run checks with visible foreground stage output. Store working output as
`.running`, publish a timestamped final `.txt` under `~/storage/downloads` after
all invoked work exits. Preserve real failure status; a command receipt or health
response does not prove application tests or AI generation succeeded. A separate
Termux session keeps existing dev servers running and available for phone preview.

Persistent report command (available in this repository):

```bash
bash scripts/orbis-local-report.sh diff git diff --check
bash scripts/orbis-local-report.sh lint npm run lint
```

Run targeted tests for each coherent change; use the repository's complete Linux
certification before push. Do not weaken coverage, lint, duplicate or security
gates. Existing Ubuntu/proot tooling is used for Linux-only checks. Remote
GitHub Actions/Sonar verifies the pushed main commit; deploy only after required
remote gates pass and deployment is authorized. No automatic commit/push/deploy
is part of start/test scripts.

## Foundation-wide Bengali examples

When working on any ORBIS project, select useful anonymized Bengali utterances,
context, intent, assistant-answer pairs and later corrections for the canonical
Foundation bank at `orbis-server/ai/bengali/examples.json`. Read Foundation's
`docs/AI_BENGALI_EXAMPLES.md`. Group equivalent variants; avoid duplicates and
private data. Approved intent guidance can be retrieved at runtime. Assistant
answers without review remain candidate, even when the owner does not object.
Do not automatically ingest all conversations or claim cross-chat memory or
weight training. Updates are delivered as Foundation source patches and tested
there; do not copy separate banks into each product.

This rule is intended across Maya, Foundation, Khata and Admin. Adding it to
other checkouts requires inspecting their current instructions and sources;
those checkouts have not been changed by this Maya/Foundation installer.

## Maya commands

Run in separate sessions:

```bash
cd ~/orbis-foundation
node orbis-server/maya-local.cjs
```

The gateway reads private `~/.config/orbis/maya-gateway.env`; never commit it.
If port 3001 already has the tracked gateway, reuse it instead of starting twice.

```bash
cd ~/orbis-maya
npm run dev -- --host 127.0.0.1 --port 3000 --strictPort
```

Open `http://127.0.0.1:3000/`. Preserve the already-running Vite instance.
Checks in a third session:

```bash
cd ~/orbis-maya
bash scripts/orbis-local-report.sh typecheck npm run typecheck
bash scripts/orbis-local-report.sh focused node node_modules/vitest/vitest.mjs run tests/chat-runtime.test.tsx tests/chat-attachments.test.tsx --maxWorkers=1
bash scripts/orbis-local-report.sh core-build npm run build
bash scripts/orbis-local-report.sh linux-cert bash "$HOME/.local/bin/maya-linux-cert"
```

Full certification can emit its own subordinate reports; the wrapper preserves
one combined streaming report. Phone viewport/keyboard preview remains required.
