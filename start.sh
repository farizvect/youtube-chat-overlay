#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Find bun — try PATH, then known install locations
BUN=""
if command -v bun &>/dev/null; then
    BUN="bun"
elif [ -x "$HOME/.bun/bin/bun" ]; then
    BUN="$HOME/.bun/bin/bun"
elif [ -x "/usr/local/bin/bun" ]; then
    BUN="/usr/local/bin/bun"
fi

if [ -z "$BUN" ]; then
    echo "❌ bun not found. Install from https://bun.sh"
    exit 1
fi

exec "$BUN" start.js
