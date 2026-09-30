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
- strict post-scan checks for Quality Gate, unresolved issues, coverage/duplication and reviewed hotspots when those metrics exist.

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

## Next exact actions

1. Finish and review the local main-only migration.
2. Do not push until the migration diff and local verification are reviewed.
3. After owner approval, commit/push the verified main-only foundation to `main`.
4. Verify the first `main` GitHub Actions/Sonar baseline.
5. Repair locally and repeat if any gate is red.
6. After remote `main` is green, remove the obsolete secondary branch locally and remotely.
7. Only then begin the application scaffold.

## Remote/production impact

At the time of this status update:

- remote `main` has not yet received the local main-only migration;
- production deployment: none;
- database: unchanged.
