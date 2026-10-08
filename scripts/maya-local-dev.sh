#!/usr/bin/env bash
set -Eeuo pipefail
set +x
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec python "$ROOT/scripts/maya-local-account.py" --launch
