#!/usr/bin/env bash
set -euo pipefail

# ─── YouTube Chat Overlay — One-Line Installer ───
# curl -fsSL https://raw.githubusercontent.com/farizvect/youtube-chat-overlay/refs/heads/main/install.sh | bash

REPO="https://github.com/farizvect/youtube-chat-overlay.git"
INSTALL_DIR="${1:-$HOME/youtube-chat-overlay}"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   YouTube Live Chat OBS Overlay Installer    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Install to: $INSTALL_DIR"
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

# Clone repo
if [ -d "$INSTALL_DIR" ]; then
    echo "📁 Directory already exists: $INSTALL_DIR"
    echo "   To reinstall, delete it first: rm -rf $INSTALL_DIR"
    exit 1
fi

echo ""
if command -v git &>/dev/null; then
    echo "📥 Cloning repo via git..."
    git clone --depth 1 "$REPO" "$INSTALL_DIR"
else
    echo "📥 Git not found — downloading via curl..."
    curl -fsSL "https://github.com/farizvect/youtube-chat-overlay/archive/refs/heads/main.tar.gz" | tar xz
    mv youtube-chat-overlay-main "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
bun install
echo "✅ Dependencies installed"

# Run welcome onboarding (then setup wizard)
echo ""
bun welcome.js

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ Installation complete!                  ║"
echo "║                                              ║"
echo "║   To start:                                  ║"
echo "║     cd $INSTALL_DIR && bash start.sh         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
