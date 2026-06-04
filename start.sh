#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

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

# Pick config
echo "Available configs:"
CONFIGS=($(ls "$SCRIPT_DIR/configs"/*.json 2>/dev/null | xargs -n1 basename | sed 's/\.json$//'))
if [ ${#CONFIGS[@]} -eq 0 ]; then
    echo "  (none — using template)"
    CONFIGS=("default")
    mkdir -p "$SCRIPT_DIR/configs"
    cp "$SCRIPT_DIR/config.template.json" "$SCRIPT_DIR/configs/default.json"
fi

ACTIVE=$(readlink "$SCRIPT_DIR/config.json" 2>/dev/null | sed 's|configs/||;s|\.json$||' || echo "")
for i in "${!CONFIGS[@]}"; do
    MARKER=""
    [ "${CONFIGS[$i]}" = "$ACTIVE" ] && MARKER=" ← active"
    echo "  $((i+1))) ${CONFIGS[$i]}$MARKER"
done
echo "  n) Create new config"
echo ""
read -p "Pick config [1-${#CONFIGS[@]}/n, default=1]: " CONFIG_CHOICE

if [ "$CONFIG_CHOICE" = "n" ]; then
    read -p "New config name: " NEW_NAME
    if [ -n "$NEW_NAME" ]; then
        cp "$SCRIPT_DIR/config.template.json" "$SCRIPT_DIR/configs/$NEW_NAME.json"
        echo "✅ Created config: $NEW_NAME"
        SELECTED="$NEW_NAME"
    else
        SELECTED="${CONFIGS[0]}"
    fi
else
    IDX=$((CONFIG_CHOICE - 1))
    if [ "$IDX" -ge 0 ] 2>/dev/null && [ "$IDX" -lt "${#CONFIGS[@]}" ]; then
        SELECTED="${CONFIGS[$IDX]}"
    else
        SELECTED="${CONFIGS[0]}"
    fi
fi

# Activate selected config
rm -f "$SCRIPT_DIR/config.json"
ln -sf "configs/$SELECTED.json" "$SCRIPT_DIR/config.json"
echo "📋 Using config: $SELECTED"
echo ""

# Ask for YouTube source
echo "Connect to YouTube chat:"
echo "  1) Live Video ID (e.g. puhZur2y-g8)"
echo "  2) Channel Handle (e.g. @YourChannel)"
echo ""
read -p "Choice [1/2]: " CHOICE

if [ "$CHOICE" = "2" ]; then
    read -p "Enter channel handle (with @): " CHANNEL
    echo ""
    echo "🚀 Starting with config: $SELECTED | channel: $CHANNEL"
    echo "   OBS Browser Source URL: http://localhost:6969"
    echo ""
    exec bun "$SCRIPT_DIR/server.js" --channel="$CHANNEL"
else
    read -p "Enter live video ID: " LIVE_ID
    echo ""
    echo "🚀 Starting with config: $SELECTED | live: $LIVE_ID"
    echo "   OBS Browser Source URL: http://localhost:6969"
    echo ""
    exec bun "$SCRIPT_DIR/server.js" --live="$LIVE_ID"
fi
