#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Git Bash on Windows may not have bun in PATH yet
if ! command -v bun &>/dev/null && [ -x "$HOME/.bun/bin/bun" ]; then
    export PATH="$HOME/.bun/bin:$PATH"
fi

if ! command -v bun &>/dev/null; then
    echo "❌ bun not found. Install: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

bun start.js
