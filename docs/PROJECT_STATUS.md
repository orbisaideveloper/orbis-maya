# Maya Project Status

## Current phase

Phase 0 — main-only repository quality foundation before application implementation.

## Repository

GitHub: `orbisaideveloper/orbis-maya`

Local path: `~/orbis-maya`

Active branch: `main`

Branch policy: main-only.

## Current implementation status

No production application code is considered started.

The documentation/governance and repository quality foundation are established locally.

Maya uses the owner's local working tree for implementation and local verification, followed by an owner-approved direct push to `main`.

## Verified environment and external state

Verified through 2026-10-01:

- Android Termux is the canonical local Git/source environment.
- GitHub authentication for `orbisaideveloper` is active.
- Maya is imported into SonarQube Cloud under organization `orbis`.
- Sonar project key is `orbisaideveloper_orbis-maya`.
- Repository binding is `orbisaideveloper/orbis-maya`.
- Automatic Analysis is disabled for CI-based analysis.
- New Code Definition is `Previous version`.
- GitHub Actions secret `SONAR_TOKEN` is stored and verified.
- Authenticated Sonar API validation returned valid authentication.
- Maya project access and branch listing returned HTTP 200.
- `main` Quality Gate access returned HTTP 200.
- non-main Quality Gate access was rejected by the current Sonar plan.
- a prior non-main analysis task itself completed successfully, confirming the scanner/token/project identity path.
- the repository currently has a quality workflow and no deployment workflow.
- no application source has been introduced.

## Quality foundation scope

The quality foundation provides:

- dedicated `sonar-project.properties`;
- repository/main/Sonar isolation checks;
- tracked-sensitive-file guard;
- workflow structure validation;
- docs-safe quality preflight;
- GitHub Actions quality workflow on `main`;
- SonarQube Cloud `main` scan with Quality Gate wait;
- strict post-scan checks for unresolved issues, ratings and reviewed hotspots;
- fail-closed application coverage enforcement: lines/statements/functions/branches 100%;
- required application coverage artifacts: `coverage/coverage-summary.json` and `coverage/lcov.info`;
- fail-closed runtime duplication enforcement: 0.00%;
- missing application coverage or duplication metrics are failures once the application scaffold exists.

When application code appears, the workflow fails closed unless the required project scripts and lockfile are present.

## Main-only release flow

Local working tree
→ local server/manual check when applicable
→ automated local verification/E2E
→ final local certification
→ owner approval
→ commit/push `main`
→ GitHub Actions
→ SonarQube Cloud Quality Gate
→ strict Sonar verification
→ only green commits become release/deployment eligible.

A red `main` is repaired through a new locally verified commit. It is not deployed.

## Current quality blocker

The first `main` GitHub Actions/Sonar baseline ran against commit `5564d8235f90774b9a05081ed8ee64bc705c8736`.

Repository preflight and governance checks passed.

SonarQube Cloud completed the `main` analysis but the Quality Gate failed.

The analyzed source reported 9 unresolved issues in the repository quality tooling:

- 2 vulnerabilities;
- 7 code smells;
- affected files: `scripts/sonar-strict-gate.mjs` and `scripts/validate-workflows.mjs`.

No application source exists yet and no deployment occurred.

## Next exact actions

1. Repair the two Sonar-reported quality-tooling files locally.
2. Run local structural/preflight verification and review the exact diff.
3. After owner approval, commit/push the verified repair to `main`.
4. Verify GitHub Actions, Sonar Quality Gate and strict Sonar all pass.
5. If any real issue remains, repair locally and repeat without weakening the gate.
6. After remote `main` is green, remove the obsolete secondary branch locally and remotely.
7. Only then begin the application scaffold.

## Remote/production impact

At the time of this status update:

- remote `main` is `5564d8235f90774b9a05081ed8ee64bc705c8736`;
- its current GitHub Actions/Sonar result is red and therefore not release/deployment eligible;
- production deployment: none;
- database: unchanged.
