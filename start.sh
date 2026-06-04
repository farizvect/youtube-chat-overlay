#!/usr/bin/env bash
set -euo pipefail

# ─── YouTube Chat Overlay — Start Server ───

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     YouTube Live Chat Overlay — Start        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Check if installed
if ! command -v bun &>/dev/null; then
    echo "❌ Bun not found. Run: bash install.sh"
    exit 1
fi

if [ ! -f "config.json" ]; then
    echo "❌ config.json not found. Run: bash install.sh"
    exit 1
fi

echo "How do you want to connect to YouTube chat?"
echo "  1) YouTube Live Video ID (e.g. puhZur2y-g8)"
echo "  2) YouTube Channel Handle (e.g. @YourChannel)"
echo ""
read -p "Choice [1/2]: " CHOICE

if [ "$CHOICE" = "2" ]; then
    read -p "Enter channel handle (with @): " CHANNEL
    echo ""
    echo "🚀 Starting server with channel: $CHANNEL"
    echo "   OBS Browser Source URL: http://localhost:6969"
    echo ""
    exec bun server.js --channel="$CHANNEL"
else
    read -p "Enter live video ID: " LIVE_ID
    echo ""
    echo "🚀 Starting server with live ID: $LIVE_ID"
    echo "   OBS Browser Source URL: http://localhost:6969"
    echo ""
    exec bun server.js --live="$LIVE_ID"
fi
