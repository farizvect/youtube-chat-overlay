# Multi-Config + GIF Management — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Multiple named configs (switch via CLI), GIF management (add/remove/list via wizard), all integrated into `setup.js`.

**Architecture:** `configs/` directory holds named `.json` files. Active config is a `config.json` symlink. `setup.js` wizard adds config switching + GIF management options. `server.js` reads config.json (unchanged — it just follows the symlink).

**Tech Stack:** Bun, JSON, symlinks, readline wizard.

**Test video ID:** `puhZur2y-g8`

---

### Task 1: Create `configs/` directory + migrate existing config

**Objective:** Move current `config.json` into `configs/default.json`. Replace `config.json` with symlink. Server unaffected.

**Files:**
- Create: `configs/default.json`
- Modify: root `config.json` → symlink to `configs/default.json`
- Modify: `.gitignore` (add `config.json`, keep tracking `configs/`)

**Step 1: Create configs/ directory**

```bash
mkdir configs
```

**Step 2: Move config + create symlink**

```bash
if [ -f config.json ]; then
    mv config.json configs/default.json
else
    cp config.template.json configs/default.json
fi
ln -sf configs/default.json config.json
```

**Step 3: Update .gitignore**

`config.json` already gitignored. Add explicit ignore but it doesn't matter with symlink. Just verify `configs/` directory files ARE tracked.

**Step 4: Test server**

```bash
bun server.js --live=puhZur2y-g8
# Health check → pass
```

**Step 5: Commit**

```bash
git add configs/ config.json .gitignore
git commit -m "feat: move config to configs/default.json with symlink"
```

---

### Task 2: Add config switching to `setup.js`

**Objective:** `setup.js` main menu now offers: 1) Edit current config, 2) Switch config, 3) Create new config, 4) GIF management, 5) Exit. Existing wizard becomes option 1.

**Files:**
- Modify: `setup.js`

**Step 1: Add main menu + config operations**

Add to `setup.js`:

```javascript
import { readdirSync, symlinkSync, unlinkSync, existsSync } from "fs";

const CONFIGS_DIR = join(import.meta.dir, "configs");

function listConfigs() {
    if (!existsSync(CONFIGS_DIR)) return [];
    return readdirSync(CONFIGS_DIR)
        .filter(f => f.endsWith(".json"))
        .map(f => f.replace(".json", ""));
}

function getActiveConfig() {
    try {
        const link = readlinkSync(join(import.meta.dir, "config.json"));
        const name = link.replace("configs/", "").replace(".json", "");
        return name || "default";
    } catch {
        return "default";
    }
}

async function switchConfig(name) {
    const target = `configs/${name}.json`;
    const linkPath = join(import.meta.dir, "config.json");
    if (existsSync(linkPath)) unlinkSync(linkPath);
    symlinkSync(target, linkPath);
    console.log(`✅ Switched to config: ${name}`);
}

async function createConfig(name) {
    const path = join(CONFIGS_DIR, `${name}.json`);
    if (existsSync(path)) {
        console.log(`❌ Config "${name}" already exists.`);
        return false;
    }
    // Copy from template
    const template = JSON.parse(readFileSync(join(import.meta.dir, "config.template.json"), "utf-8"));
    writeFileSync(path, JSON.stringify(template, null, 4));
    console.log(`✅ Created config: ${name} (from template)`);
    return true;
}

async function deleteConfig(name) {
    if (name === "default") {
        console.log("❌ Cannot delete default config.");
        return;
    }
    const path = join(CONFIGS_DIR, `${name}.json`);
    if (!existsSync(path)) {
        console.log(`❌ Config "${name}" not found.`);
        return;
    }
    unlinkSync(path);
    console.log(`✅ Deleted config: ${name}`);
}

async function mainMenu() {
    while (true) {
        const active = getActiveConfig();
        const configs = listConfigs();

        console.log("");
        console.log("╔════════════════════════════════════╗");
        console.log("║   Chat Overlay — Setup Wizard     ║");
        console.log("╚════════════════════════════════════╝");
        console.log(`  Active config: ${active}`);
        console.log("");
        console.log("  1) Edit current config");
        console.log("  2) Switch config");
        console.log("  3) Create new config");
        console.log("  4) Delete config");
        console.log("  5) Manage GIFs");
        console.log("  0) Exit");
        console.log("");

        const choice = await ask("Choice [0-5]: ");

        if (choice === "0") break;
        if (choice === "1") { await editConfig(active); continue; }
        if (choice === "2") {
            console.log("\nAvailable configs:");
            configs.forEach(c => {
                const marker = c === active ? " ← active" : "";
                console.log(`  - ${c}${marker}`);
            });
            const name = await ask("\nConfig name to switch to: ");
            if (name && configs.includes(name)) {
                await switchConfig(name);
            } else {
                console.log("❌ Config not found.");
            }
            continue;
        }
        if (choice === "3") {
            const name = await ask("New config name: ");
            if (name) await createConfig(name);
            continue;
        }
        if (choice === "4") {
            console.log("\nConfigs:");
            configs.forEach(c => console.log(`  - ${c}`));
            const name = await ask("\nConfig name to delete: ");
            if (name) await deleteConfig(name);
            continue;
        }
        if (choice === "5") {
            await gifManager();
            continue;
        }
    }
    console.log("\n👋 Bye!\n");
}
```

**Step 2: Rename existing `main()` to `editConfig(configName)`**

The existing wizard code loads `config.template.json` — change it to load `configs/${configName}.json` and save back to same file.

```javascript
async function editConfig(name) {
    const configPath = join(CONFIGS_DIR, `${name}.json`);
    const cfg = JSON.parse(readFileSync(configPath, "utf-8"));
    // ... existing wizard questions ...
    writeFileSync(configPath, JSON.stringify(cfg, null, 4));
    console.log(`✅ Config "${name}" saved`);
}
```

**Step 3: Replace final `main()` call with `mainMenu()`**

**Step 4: Test**

```bash
bun setup.js   # Main menu appears
# → 3 → "tournament" → creates configs/tournament.json
# → 2 → "tournament" → switches
# → 1 → edit it
# → 0 → exit
bun server.js --live=puhZur2y-g8   # Uses tournament config
```

**Step 5: Commit**

```bash
git add setup.js
git commit -m "feat: add multi-config switching to setup wizard"
```

---

### Task 2.5: Add config picker to `start.sh`

**Objective:** `start.sh` lists available configs before asking for live ID. User picks one → symlink updated → server starts with that config.

**Files:**
- Modify: `start.sh`

**Step 1: Rewrite start.sh with config picker**

```bash
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
```

**Step 2: Test**

```bash
bash start.sh
# → shows configs, pick one
# → asks live ID
# → server starts with that config
```

**Step 3: Commit**

```bash
git add start.sh
git commit -m "feat: add config picker to start.sh"
```

---

### Task 3: Add GIF management to `setup.js`

**Objective:** In-wizard GIF manager: list, add (from URL or local path), remove, preview mapping.

**Files:**
- Modify: `setup.js`

**Step 1: Add GIF manager function**

```javascript
import { copyFileSync } from "fs";

const GIFS_DIR = join(import.meta.dir, "public", "gifs");

function listGifs() {
    if (!existsSync(GIFS_DIR)) return [];
    return readdirSync(GIFS_DIR).filter(f => /\.(gif|png|webp)$/i.test(f));
}

async function gifManager() {
    while (true) {
        const configPath = join(CONFIGS_DIR, `${getActiveConfig()}.json`);
        const cfg = JSON.parse(readFileSync(configPath, "utf-8"));
        const gifs = cfg.customGifs || {};

        console.log("");
        console.log("─── GIF Manager ───");
        console.log("");
        if (Object.keys(gifs).length === 0) {
            console.log("  No GIF triggers configured.");
        } else {
            console.log("  Trigger → File:");
            Object.entries(gifs).forEach(([k, v]) => console.log(`    ${k} → ${v}`));
        }
        console.log("");
        console.log("  Available GIF files in public/gifs/:");
        listGifs().forEach(f => console.log(`    - ${f}`));
        console.log("");
        console.log("  1) Add GIF trigger");
        console.log("  2) Remove GIF trigger");
        console.log("  3) Import GIF from URL");
        console.log("  0) Back");
        console.log("");

        const choice = await ask("Choice [0-3]: ");

        if (choice === "0") break;
        if (choice === "1") {
            const keyword = await ask("Trigger word: ");
            if (!keyword) continue;
            console.log("Available files:");
            listGifs().forEach(f => console.log(`  ${f}`));
            const file = await ask("Filename (e.g. happycat.gif): ");
            if (!file) continue;
            const filePath = join(GIFS_DIR, file);
            if (!existsSync(filePath)) {
                console.log("❌ File not found. Drop it in public/gifs/ first.");
                continue;
            }
            gifs[keyword] = `/gifs/${file}`;
            cfg.customGifs = gifs;
            writeFileSync(configPath, JSON.stringify(cfg, null, 4));
            console.log(`✅ Added: "${keyword}" → /gifs/${file}`);
            continue;
        }
        if (choice === "2") {
            const keyword = await ask("Trigger word to remove: ");
            if (!keyword || !gifs[keyword]) {
                console.log("❌ Not found.");
                continue;
            }
            delete gifs[keyword];
            cfg.customGifs = gifs;
            writeFileSync(configPath, JSON.stringify(cfg, null, 4));
            console.log(`✅ Removed: "${keyword}"`);
            continue;
        }
        if (choice === "3") {
            const url = await ask("GIF URL (must be .gif/.png/.webp): ");
            if (!url) continue;
            const filename = url.split("/").pop().split("?")[0];
            if (!/\.(gif|png|webp)$/i.test(filename)) {
                console.log("❌ Must be .gif, .png, or .webp");
                continue;
            }
            const dest = join(GIFS_DIR, filename);
            console.log(`Downloading ${filename}...`);
            try {
                const resp = await fetch(url);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const buf = await resp.arrayBuffer();
                writeFileSync(dest, Buffer.from(buf));
                console.log(`✅ Downloaded to public/gifs/${filename}`);
                const keyword = await ask("Trigger word for this GIF: ");
                if (keyword) {
                    gifs[keyword] = `/gifs/${filename}`;
                    cfg.customGifs = gifs;
                    writeFileSync(configPath, JSON.stringify(cfg, null, 4));
                    console.log(`✅ Added: "${keyword}" → /gifs/${filename}`);
                }
            } catch (e) {
                console.log(`❌ Download failed: ${e.message}`);
            }
            continue;
        }
    }
}
```

**Step 2: Test GIF manager**

```bash
bun setup.js → 5 (Manage GIFs)
# → 1 → "pog" → "happycat.gif" → added
# → 3 → URL → downloads
# → 2 → "pog" → removed
# → 0 → back
```

**Step 3: Commit**

```bash
git add setup.js
git commit -m "feat: add GIF management to setup wizard"
```

---

### Task 4: Test full flow end-to-end

**Objective:** Verify everything works together.

**Step 1: Test multi-config flow**

```bash
bun setup.js
# 3 → "stream" → create
# 2 → "stream" → switch
# 1 → edit "stream" (change font to Inter, font size 18)
# 0 → exit
bun server.js --live=puhZur2y-g8 &
sleep 3
curl -s http://localhost:6969/health
kill %1
```

**Step 2: Test GIF flow**

```bash
bun setup.js → 5
# Check list shows current GIFs
# Add a new trigger
# Switch config, verify different GIF set
# Back to default
```

**Step 3: Smoke test — same as before**

Health check + static files + server start.

**Step 4: Commit if any fixes needed**

```bash
git add -A
git commit -m "test: end-to-end multi-config + GIF flow verified"
```

---

## Summary

| # | Task | What |
|---|------|------|
| 1 | `configs/` directory | `configs/default.json` + `config.json` symlink |
| 2 | Multi-config wizard | Create/switch/edit/delete configs from `setup.js` |
| 2.5 | Config picker in `start.sh` | List configs, pick one, create new on-the-fly |
| 3 | GIF manager | Add/remove/list/import GIFs from `setup.js` |
| 4 | Smoke test | End-to-end verify |

**User flows:**

```bash
# Setup (first time)
bash install.sh

# Start stream — pick config + live ID
bash start.sh
  Available configs:
    1) default ← active
    2) tournament
    3) chill-stream
    n) Create new config
  Pick config [1-3/n]: 2
  Connect to YouTube chat: 1
  Enter live video ID: puhZur2y-g8
  🚀 Starting with config: tournament | live: puhZur2y-g8

# Manage everything
bun setup.js
  → 1) Edit current config (font, colors, background)
  → 2) Switch config
  → 3) Create new config
  → 4) Delete config
  → 5) Manage GIFs (add/remove/import from URL)
  → 0) Exit
```
