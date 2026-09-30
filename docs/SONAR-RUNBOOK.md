# Maya SonarQube Cloud Runbook

## 1. Dedicated project

Maya must use its own SonarQube Cloud project.

Expected identity:

- organization: `orbis`
- project key: `orbisaideveloper_orbis-maya`
- project name: `orbis-maya`

These values were verified against the actual SonarQube Cloud project.

A 2026-10-01 authenticated diagnostic also confirmed that the current organization plan exposes Quality Gate data for `main` but rejects non-main branch Quality Gate access. Maya therefore uses main-only Sonar certification.

## 2. Isolation

Never reuse another ORBIS project's Sonar identity.

Do not point Maya analysis at:

- ORBIS Foundation;
- ORBIS Admin;
- ORBIS Khata;
- any unrelated project.

## 3. Quality target

Maya release-ready state requires:

- Quality Gate PASS;
- open issues 0;
- Security Hotspots reviewed/resolved;
- production-code coverage 100%;
- runtime duplication 0.00%.

## 4. Secrets

`SONAR_TOKEN` is secret.

It must never be committed or printed in reports.

Use an approved GitHub Actions secret or equivalent secret mechanism.

## 5. Local environment

The normal Maya Sonar gate runs in GitHub Actions on pushed `main` commits.

A local Sonar CLI is not required for the normal owner-controlled workflow.

Do not install Java/Sonar CLI in Termux or Ubuntu merely to duplicate the GitHub Actions gate unless a later verified need specifically requires it.

## 6. Execution order

1. Implement locally on `main`.
2. Run local server/manual checks when applicable.
3. Run the complete applicable local quality certification.
4. Obtain explicit owner approval.
5. Commit and push `main` from Termux.
6. GitHub Actions runs the repository quality gates.
7. SonarQube Cloud analyzes `main` and waits for the Quality Gate.
8. The strict Sonar verifier checks the required Maya quality targets.
9. If anything is red, repair locally and repeat with a new verified commit.
10. Only a green `main` is eligible for separately authorized release/deployment.

## 7. CI policy

The Maya quality workflow runs on `main`.

It must fail closed when required Sonar configuration is absent.

Do not silently skip Sonar on the `main` release path.

A red GitHub Actions or Sonar result blocks release/deployment eligibility but does not trigger history rewriting. Fixes originate locally in Termux as new verified commits.

The workflow takes the strongest useful parts of ORBIS Admin's strict gate while preserving Maya's owner-controlled Termux release workflow.
