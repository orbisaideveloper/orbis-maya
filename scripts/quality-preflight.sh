#!/usr/bin/env bash
set -euo pipefail

EXPECTED_SSH='git@github.com:orbisaideveloper/orbis-maya.git'
EXPECTED_HTTPS='https://github.com/orbisaideveloper/orbis-maya.git'
EXPECTED_HTTPS_ACTIONS='https://github.com/orbisaideveloper/orbis-maya'

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ -d .git ]] || fail 'run from the orbis-maya repository root'
origin="$(git config --get remote.origin.url || true)"
case "$origin" in
  "$EXPECTED_SSH"|"$EXPECTED_HTTPS"|"$EXPECTED_HTTPS_ACTIONS") ;;
  *) fail "unexpected origin: $origin" ;;
esac

branch="$(git branch --show-current)"
case "$branch" in develop|main) ;; *) fail "unexpected branch: $branch" ;; esac

git diff --check

required=(README.md AGENTS.md docs/ARCHITECTURE.md docs/DECISIONS.md docs/PRODUCT_SPEC.md docs/PROJECT_STATUS.md docs/QUALITY-GATES.md docs/SONAR-RUNBOOK.md docs/TERMUX-WORKFLOW.md sonar-project.properties scripts/quality-preflight.sh scripts/validate-workflows.mjs scripts/sonar-strict-gate.mjs .github/workflows/quality.yml)
for file in "${required[@]}"; do [[ -s "$file" ]] || fail "required file missing or empty: $file"; done

grep -Fxq 'sonar.projectKey=orbisaideveloper_orbis-maya' sonar-project.properties || fail 'Sonar project key mismatch'
grep -Fxq 'sonar.organization=orbis' sonar-project.properties || fail 'Sonar organization mismatch'
grep -Fxq 'sonar.projectName=orbis-maya' sonar-project.properties || fail 'Sonar project name mismatch'

tracked_sensitive="$(git ls-files | grep -E '(^|/)(\.env($|\.)|.*\.(pem|p12|pfx|key)$)' | grep -Ev '(^|/)\.env\.(example|sample|template)$' || true)"
[[ -z "$tracked_sensitive" ]] || { printf 'Tracked sensitive-looking files:\n%s\n' "$tracked_sensitive" >&2; fail 'tracked sensitive-file guard failed'; }

node scripts/validate-workflows.mjs

if [[ -f package.json ]]; then
  [[ -s package-lock.json ]] || fail 'package.json exists but package-lock.json is missing or empty'
  node <<'NODE'
const fs = require('fs')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const required = ['lint','typecheck','test:coverage','quality:knip','quality:jscpd','build','test:e2e']
const missing = required.filter((name) => !pkg.scripts?.[name])
if (missing.length) { console.error(`ERROR: missing required package scripts: ${missing.join(', ')}`); process.exit(1) }
console.log('Application quality contract: PASS')
NODE
else
  echo 'Application scaffold: NOT PRESENT (governance-only mode)'
fi

echo "Branch: $branch"
echo 'QUALITY PREFLIGHT: PASS'
