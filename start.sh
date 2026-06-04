#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v bun &>/dev/null; then
    echo "❌ Bun not found. Run: bash install.sh"
    exit 1
fi

exec bun "$SCRIPT_DIR/start.js"
