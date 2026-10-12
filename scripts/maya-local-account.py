#!/usr/bin/env python3
"""Inspect/import public Auth config without sourcing private shell files."""
from pathlib import Path
import argparse
import base64
import json
import os
import shlex
import subprocess
import urllib.request
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
KEYS = ('VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY')
ENV_LOCAL = '.env.local'

def parse_public_literal(value):
    try:
        tokens = shlex.split(value, comments=True)
    except ValueError:
        raise SystemExit('STOP: invalid public Auth configuration line')
    if len(tokens) != 1 or '$' in tokens[0] or '`' in tokens[0]:
        raise SystemExit('STOP: Auth value needs a literal public value')
    return tokens[0]


def public_values(path):
    values = {}
    if not path.is_file():
        return values
    for line in path.read_text().splitlines():
        content = line.lstrip()
        parts = content.split(maxsplit=1)
        if parts and parts[0] == 'export':
            content = parts[1] if len(parts) == 2 else ''
        name, separator, value = content.partition('=')
        name = name.strip()
        if not separator or name not in KEYS:
            continue
        values[name] = parse_public_literal(value)
    return values

def complete(values):
    return all(values.get(key) for key in KEYS)

def validate(values):
    if not complete(values):
        return False
    endpoint = urlparse(values[KEYS[0]])
    if endpoint.scheme != 'https' or not endpoint.hostname or endpoint.username or endpoint.password or endpoint.path not in ('', '/') or endpoint.query or endpoint.fragment:
        raise SystemExit('STOP: invalid Auth URL')
    key = values[KEYS[1]]
    if key.startswith('sb_publishable_'):
        return True
    try:
        payload = key.split('.')[1]
        role = json.loads(base64.urlsafe_b64decode(payload + '=' * (-len(payload) % 4)))['role']
    except (ValueError, IndexError, KeyError, TypeError):
        raise SystemExit('STOP: invalid public Auth key')
    if role != 'anon':
        raise SystemExit('STOP: privileged key rejected')
    return True

def sources():
    own = {}
    for name in ('.env', ENV_LOCAL, '.env.development', '.env.development.local'):
        own.update(public_values(ROOT/name))
    for key in KEYS:
        if os.environ.get(key):
            own[key] = os.environ[key]
    foundation = {}
    for path in (Path.home()/'orbis-foundation/.env', Path.home()/'orbis-foundation/.env.local', Path.home()/'.config/orbis/local-auth.env'):
        foundation.update(public_values(path))
    return own, foundation

def configure(own, foundation):
    if complete(own):
        validate(own)
        print('Existing Maya public Auth config preserved.')
        return
    if not validate(foundation):
        raise SystemExit('STOP: no complete existing public Auth config; no values copied')
    if any(own.get(key) and own[key] != foundation[key] for key in KEYS):
        raise SystemExit('STOP: different existing Auth config; no values overwritten')
    target = ROOT/ENV_LOCAL
    tracked = subprocess.check_output(['git','ls-files','--',ENV_LOCAL], cwd=ROOT, text=True).strip()
    ignored = subprocess.run(['git','check-ignore','-q',ENV_LOCAL], cwd=ROOT).returncode == 0
    if tracked or not ignored:
        raise SystemExit('STOP: .env.local must be untracked and Git-ignored')
    existing = target.read_text() if target.exists() else ''
    addition = '\n# Shared Orbis public Auth only; no server credentials.\n' + ''.join(f'{key}={json.dumps(foundation[key])}\n' for key in KEYS)
    temp = target.with_name('.env.local.astro-tmp')
    try:
        descriptor = os.open(temp, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        with os.fdopen(descriptor, 'w') as stream:
            stream.write(existing + addition)
        temp.replace(target)
        target.chmod(0o600)
    finally:
        temp.unlink(missing_ok=True)
    print('Public Auth values imported; .env.local permission 600.')

def check(own, foundation):
    available = validate(own)
    print('Maya public Auth:', 'CONFIGURED' if available else 'MISSING')
    print('Foundation public Auth:', 'PRESENT' if validate(foundation) else 'MISSING')
    if available:
        host = urlparse(own[KEYS[0]]).hostname
        print('Auth host:', host)
        if complete(foundation):
            print('Maya/Foundation public Auth match:', 'YES' if all(own[key] == foundation[key] for key in KEYS) else 'NO — REVIEW BEFORE SIGNUP')
        print('Dedicated Admin Auth host:', 'YES — inspected with zero users' if host == 'aqcwhqdzniruvoqwfsij.supabase.co' else 'NO')
        request = urllib.request.Request(own[KEYS[0]].rstrip('/')+'/auth/v1/settings', headers={'apikey':own[KEYS[1]]})
        try:
            with urllib.request.urlopen(request, timeout=12) as response:
                data = json.loads(response.read(65536))
            print('Auth settings endpoint: REACHABLE')
            print('Email login provider:', 'ENABLED' if data.get('external', {}).get('email') else 'DISABLED/UNKNOWN')
            print('Signup disabled:', str(data.get('disable_signup', 'UNKNOWN')))
            print('Email confirmation auto-confirm:', str(data.get('mailer_autoconfirm', 'UNKNOWN')))
        except (ValueError, OSError):
            print('Auth settings endpoint: UNVERIFIED — check connectivity/configuration')
    print('Canonical ORBIS ID: NOT VERIFIED by this configuration check')
    print('Maya membership / owner rights / AI access: NOT VERIFIED')
    print('No credentials, tokens, birth data or canonical IDs printed. No provider/database writes.')

parser = argparse.ArgumentParser()
parser.add_argument('--configure', action='store_true')
parser.add_argument('--launch', action='store_true')
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
own, foundation = sources()
if args.configure:
    configure(own, foundation)
    own, foundation = sources()
if args.launch:
    if not validate(own):
        raise SystemExit('STOP: public Auth missing; run --check first')
    env = os.environ.copy()
    env.update(own)
    os.chdir(ROOT)
    print('Orbis Astro: http://localhost:3000/ (Ctrl+C stops server)', flush=True)
    os.execvpe('npm', ['npm','run','dev','--','--host','0.0.0.0','--port','3000','--strictPort'], env)
else:
    check(own, foundation)
