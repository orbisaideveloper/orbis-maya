# Maya SonarQube Cloud Runbook

## 1. Dedicated project

Maya must use its own SonarQube Cloud project.

Expected identity:

- organization: `orbis`
- project key: `orbisaideveloper_orbis-maya`
- project name: `orbis-maya`

These values are expectations, not yet proof of import. Verify them against the actual SonarQube Cloud project before enabling CI scans.

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

For the Android workflow, Sonar CLI should run in Ubuntu/proot rather than being relied on as a native Termux tool.

The 2026-09-30 audit showed:

- Ubuntu/proot present;
- Sonar CLI absent;
- Java absent.

Install/configure them only during the intentional Maya Sonar setup step.

## 6. Setup order

1. Establish docs/governance baseline.
2. Fresh-clone Maya into Termux.
3. Import/attach `orbisaideveloper/orbis-maya` in SonarQube Cloud.
4. Verify exact organization/project key.
5. Configure required secret(s).
6. Configure/verify Ubuntu Sonar tooling.
7. Add project-local Sonar configuration and CI workflow.
8. Validate workflow syntax.
9. Run baseline analysis.
10. Resolve all issues before application release-ready status.

## 7. CI policy

When CI is added it should fail closed when required Sonar configuration is absent.

Do not silently skip Sonar on a release path.

The eventual Maya quality workflow should take the strongest useful parts of ORBIS Admin's strict gate while preserving Maya's owner-controlled Termux release workflow.
