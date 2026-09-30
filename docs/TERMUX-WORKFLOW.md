# Maya Termux Workflow

## 1. Primary rule

The owner's Android Termux checkout is the normal write source for Maya.

The initial docs-only GitHub bootstrap on 2026-09-30 is a one-time owner-approved exception before the first local clone.

After the first clone, source changes entering Git history originate from Termux.

## 2. Expected local path

`~/orbis-maya`

Expected remote:

`git@github.com:orbisaideveloper/orbis-maya.git`

Before mutating setup or Git operations, verify path and remote.

## 3. Shared environment

The phone already has shared ORBIS development tooling.

Do not reinstall/upgrade shared tools just because Maya is new.

Inspect first.

Use:

- native Termux where compatible;
- Ubuntu/proot for Linux/glibc-dependent tools.

Do not change another ORBIS repository while working on Maya.

## 4. Normal development cycle

1. confirm repository/path/branch;
2. inspect current status;
3. make one coherent change;
4. run targeted checks;
5. preview locally when relevant;
6. update durable documentation if architecture changed;
7. update `docs/PROJECT_STATUS.md`;
8. when the owner declares work ready, run final certification;
9. obtain explicit approval;
10. commit/push from Termux;
11. inspect GitHub Actions/Sonar;
12. fix any failure through Termux and repeat.

## 5. Reports

Evidence-producing commands should write timestamped reports to:

`$HOME/storage/downloads/`

Reports should include, where useful:

- time;
- repo path;
- branch;
- HEAD;
- purpose;
- checks/stages;
- PASS/FAIL;
- exit code;
- report path.

Never print tokens/secrets into reports.

## 6. Long-running commands

Keep the interactive Termux shell usable.

Prefer report-oriented execution that preserves results on failure.

Do not close the user's shell with a misplaced top-level `exit`.

## 7. Git safety

- no force push by default;
- no history rewrite by default;
- no silent reset/discard of local work;
- no push without owner approval;
- no deployment merely because CI is green.

## 8. Branch model

Maya uses one active Git branch:

- `main`: canonical working, CI-quality and release branch.

Normal work is performed in the local working tree first.

Before pushing `main`:

1. run the local server/manual application check when an application scaffold exists;
2. run the applicable automated local checks and E2E;
3. run final local certification;
4. obtain explicit owner approval.

After the push, GitHub Actions and SonarQube Cloud must pass before release/deployment eligibility.

A failing `main` run is repaired through a new locally verified commit. Do not deploy a red `main`.

## 9. Current known environment notes

From the 2026-09-30 Termux audit:

- Git/GitHub CLI are available;
- GitHub authentication is active;
- Ubuntu/proot exists;
- Ubuntu Node is available;
- Codex is available in Ubuntu;
- local Sonar CLI is not yet installed;
- Java is not yet installed in Ubuntu.

Do not install Sonar/Java until the Maya Sonar setup step is intentionally started and the required versions are verified.
