# Maya Quality Gates

Maya starts as a clean repository. Quality is enforced continuously, not repaired only at the end.

## 1. Development checkpoint

For each coherent change, run the checks relevant to that change.

As applicable:

- changed-area tests;
- lint;
- TypeScript check;
- focused security/behavior verification;
- local preview.

Do not run unrelated expensive full-suite checks after every tiny edit.

Do not continue expanding scope while a meaningful new failure remains unexplained.

## 2. Release certification

Before an owner-approved release transition, every applicable gate must pass.

### Source quality

- lint errors: 0
- lint warnings: 0
- TypeScript errors: 0
- unused/dead code: 0
- runtime duplication target: 0.00%
- whitespace/diff validation: PASS

### Test coverage

Target for production code:

- lines: 100%
- statements: 100%
- functions: 100%
- branches: 100%

Any future exclusion must be narrow, explicit, justified and owner-reviewed.

### Security/dependencies

- committed secrets: 0
- sensitive-file guard: PASS
- high/critical dependency vulnerabilities: 0
- authentication/authorization changes require security-focused tests
- public AI gateway changes require validation, authorization and rate-limit review

### Build/runtime

As implemented, require:

- production build: PASS
- PWA smoke: PASS
- mobile viewport E2E: PASS
- critical authentication flow: PASS
- critical Dream flow: PASS
- critical Astro flow: PASS
- critical Ask Maya flow: PASS

### SonarQube Cloud

Execution policy:

- SonarQube Cloud runs on pushed `main` commits.
- A pushed `main` commit is not release/deployment eligible until the GitHub Actions quality workflow, Sonar Quality Gate and strict Sonar verification pass.
- If the gate is red, repair locally, rerun local verification, push a new fix commit to `main`, and repeat.
- Never deploy or release a red `main`.

Required release state:

- dedicated Maya project only
- Quality Gate: PASS
- open issues: 0
- unresolved security/reliability/maintainability issues: 0
- Security Hotspots: reviewed/resolved
- production coverage meets project target
- runtime duplication: 0.00%

Do not hide real production problems through broad exclusions.

## 3. Workflow safety

When GitHub Actions are added, workflow files must be syntax/structure validated before push.

An invalid workflow definition is itself a failed quality gate.

## 4. Environment split

### Native Termux

Primary for:

- Git/source workflow;
- compatible local checks;
- local development/preview where supported.

### Ubuntu/proot

Use for:

- standard-Linux/glibc-dependent tooling;
- Sonar CLI;
- tooling that is unreliable in Android userspace.

### GitHub Actions

Use as clean Linux CI evidence for:

- full quality gate;
- SonarQube Cloud scan;
- release verification.

## 5. Reports

Long or decision-relevant Termux checks must preserve timestamped reports under:

`~/storage/downloads/`

Reports should preserve failure output and useful exit status without printing secrets.

## 6. Push/release authority

Passing checks does not itself authorize:

- commit/push;
- merge;
- release;
- deployment.

The owner explicitly authorizes release transitions.
