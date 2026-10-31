#!/bin/sh
# Runs a Python script with the repo's .venv when present, else python3.
here="$(cd "$(dirname "$0")/.." && pwd)"
if [ -x "$here/.venv/bin/python" ]; then exec "$here/.venv/bin/python" "$@"; fi
exec python3 "$@"
