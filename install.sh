#!/usr/bin/env bash
set -euo pipefail

# ─── YouTube Chat Overlay — Installer ───

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   YouTube Live Chat OBS Overlay Installer    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Check/install Bun
if command -v bun &>/dev/null; then
    echo "✅ Bun found: $(bun --version)"
else
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    echo "✅ Bun installed: $(bun --version)"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
bun install
echo "✅ Dependencies installed"
echo ""

# Run interactive config wizard
if [ ! -f "config.json" ]; then
    bun setup.js
else
    echo "📋 config.json already exists."
    echo "   Run: bun setup.js   to reconfigure."
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ Installation complete!                  ║"
echo "║                                              ║"
echo "║   To start:  bash start.sh                   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
