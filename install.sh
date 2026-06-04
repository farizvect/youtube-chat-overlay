#!/usr/bin/env bash
set -euo pipefail

# ─── YouTube Chat Overlay — Installer / Updater ───
# Fresh install: curl -fsSL https://raw.githubusercontent.com/farizvect/youtube-chat-overlay/refs/heads/main/install.sh | bash
# Update:        run the same command again

REPO="https://github.com/farizvect/youtube-chat-overlay.git"
INSTALL_DIR="${1:-$HOME/youtube-chat-overlay}"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   YouTube Live Chat OBS Overlay              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Find/install Bun — check PATH first, then known locations
BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$HOME/.bun/bin:/usr/local/bin:$PATH"

if command -v bun &>/dev/null; then
    echo "✅ Bun found: $(bun --version)"
else
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$BUN_INSTALL/bin:$PATH"
    echo "✅ Bun installed: $(bun --version)"
fi

echo ""

# Clone or update repo
if [ -d "$INSTALL_DIR/.git" ]; then
    echo "📂 Found existing install: $INSTALL_DIR"
    echo "📥 Updating..."
    cd "$INSTALL_DIR"

    BEFORE=$(git rev-parse HEAD)
    git fetch origin main --quiet
    git reset --hard origin/main --quiet
    AFTER=$(git rev-parse HEAD)

    if [ "$BEFORE" = "$AFTER" ]; then
        echo "✅ Already up to date ($AFTER)"
    else
        CHANGES=$(git log --oneline "$BEFORE..$AFTER")
        echo "✅ Updated!"
        echo "$CHANGES"
    fi
elif [ -d "$INSTALL_DIR" ]; then
    echo "❌ Directory exists but is not a git repo: $INSTALL_DIR"
    echo "   Delete it first: rm -rf $INSTALL_DIR"
    exit 1
else
    echo "📥 Installing to: $INSTALL_DIR"
    if command -v git &>/dev/null; then
        git clone --depth 1 "$REPO" "$INSTALL_DIR"
    else
        echo "📥 Git not found — downloading via curl..."
        curl -fsSL "https://github.com/farizvect/youtube-chat-overlay/archive/refs/heads/main.tar.gz" | tar xz
        mv youtube-chat-overlay-main "$INSTALL_DIR"
    fi
    cd "$INSTALL_DIR"
fi

# Install/update dependencies
echo ""
echo "📦 Installing dependencies..."
bun install --ignore-scripts
echo "✅ Dependencies installed"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ Done!                                   ║"
echo "║                                              ║"
echo "║   To start:                                  ║"
echo "║     cd $INSTALL_DIR && bun start.js          ║"
echo "║                                              ║"
echo "║   To edit setup later:                       ║"
echo "║     cd $INSTALL_DIR && bun start.js --setup  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
