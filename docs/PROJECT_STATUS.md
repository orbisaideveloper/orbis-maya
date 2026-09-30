# Maya Project Status

## Current phase

Phase 0 — repository quality foundation before application implementation.

## Repository

GitHub: `orbisaideveloper/orbis-maya`

Local path: `~/orbis-maya`

Working branch: `develop`

Published/release branch: `main`

## Current implementation status

No production application code is considered started.

The documentation/governance baseline is established. The next repository change establishes the quality foundation that must exist before the application scaffold is introduced.

## Verified environment and external state

Verified on 2026-09-30:

- Android Termux is the canonical local Git/source environment.
- `~/orbis-maya` exists locally and tracks `origin/develop`.
- GitHub authentication for `orbisaideveloper` is active.
- Maya is imported into SonarQube Cloud under organization `orbis`.
- Sonar project key is `orbisaideveloper_orbis-maya`.
- Repository binding is `orbisaideveloper/orbis-maya`.
- Automatic Analysis is disabled for CI-based analysis.
- New Code Definition is `Previous version`.
- GitHub Actions secret `SONAR_TOKEN` is stored and verified.
- No application source has been introduced.

## Quality foundation scope

The quality foundation adds:

- dedicated `sonar-project.properties`;
- repository/branch/Sonar isolation checks;
- tracked-sensitive-file guard;
- workflow structure validation;
- docs-safe quality preflight;
- GitHub Actions quality workflow for `develop` and `main`;
- SonarQube Cloud scan with Quality Gate wait;
- strict post-scan checks for Quality Gate, unresolved issues, coverage/duplication and reviewed hotspots when those metrics exist.

The workflow supports the current documentation-only repository. When application code appears, it fails closed unless the required project scripts and lockfile are present.

## Next exact actions

1. Apply the reviewed quality-foundation bundle locally on `develop`.
2. Run local preflight and workflow validation.
3. Review the complete local diff; do not commit or push yet.
4. After owner approval, commit/push the quality foundation from Termux.
5. Verify the first GitHub Actions/Sonar baseline and repair until green.
6. Only after the quality baseline is green, choose and create the application scaffold.

## Remote/production impact

Until the owner approves and performs the Termux commit/push:

- GitHub `develop`: unchanged;
- GitHub `main`: unchanged;
- production: unchanged;
- deployment: none;
- database: unchanged.
