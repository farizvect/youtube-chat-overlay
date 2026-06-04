// setup.js — Interactive configuration + GIF manager
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { symlinkSync, unlinkSync, readlinkSync, copyFileSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

const ROOT = import.meta.dir;
const CONFIGS_DIR = join(ROOT, "configs");
const GIFS_DIR = join(ROOT, "public", "gifs");
const TEMPLATE_PATH = join(ROOT, "config.template.json");
const LINK_PATH = join(ROOT, "config.json");

const FONTS = ["Roboto", "Inter", "Poppins", "Nunito", "Open Sans", "Montserrat"];
const BG_PRESETS = {
    "1": { name: "Dark (default)", color: "rgba(50, 50, 68, 0.9)" },
    "2": { name: "Solid black", color: "rgba(0, 0, 0, 0.85)" },
    "3": { name: "Dark purple", color: "rgba(30, 30, 50, 0.9)" },
    "4": { name: "Transparent (no background)", color: "transparent" },
    "5": { name: "Custom", color: null },
};

// ─── Helpers ───

function listConfigs() {
    if (!existsSync(CONFIGS_DIR)) return [];
    return readdirSync(CONFIGS_DIR)
        .filter(f => f.endsWith(".json"))
        .map(f => f.replace(".json", ""));
}

function getActiveConfig() {
    try {
        const link = readlinkSync(LINK_PATH);
        return link.replace("configs/", "").replace(".json", "") || "default";
    } catch {
        return "default";
    }
}

function activateConfig(name) {
    const target = `configs/${name}.json`;
    if (existsSync(LINK_PATH)) unlinkSync(LINK_PATH);
    symlinkSync(target, LINK_PATH);
}

function listGifFiles() {
    if (!existsSync(GIFS_DIR)) return [];
    return readdirSync(GIFS_DIR).filter(f => /\.(gif|png|webp)$/i.test(f));
}

function loadConfig(name) {
    const path = join(CONFIGS_DIR, `${name}.json`);
    return JSON.parse(readFileSync(path, "utf-8"));
}

function saveConfig(name, cfg) {
    const path = join(CONFIGS_DIR, `${name}.json`);
    writeFileSync(path, JSON.stringify(cfg, null, 4));
}

// ─── Edit Config Wizard ───

async function editConfig(name) {
    const cfg = loadConfig(name);

    console.log("");
    console.log(`─── Editing: ${name} ───`);
    console.log("Press Enter to keep current values.");
    console.log("");

    // Font
    console.log("Font choices:");
    FONTS.forEach((f, i) => console.log(`  ${i + 1}) ${f}`));
    const currentFontIdx = FONTS.indexOf(cfg.fontFamily) + 1 || 1;
    const fontChoice = await ask(`Font [1-${FONTS.length}, default=${currentFontIdx}]: `);
    const idx = parseInt(fontChoice) - 1;
    if (idx >= 0 && idx < FONTS.length) cfg.fontFamily = FONTS[idx];

    // Font size
    const size = await ask(`Font size [default=${cfg.fontSize}]: `);
    const sizeNum = parseInt(size);
    if (sizeNum >= 12 && sizeNum <= 32) cfg.fontSize = sizeNum;

    // Background
    console.log("");
    console.log("Background style:");
    Object.entries(BG_PRESETS).forEach(([k, v]) => console.log(`  ${k}) ${v.name}`));
    const bgChoice = await ask("Choice [1-5, default=1]: ");
    if (bgChoice === "4") {
        cfg.noBackground = true;
    } else if (bgChoice === "5") {
        const custom = await ask("Enter RGBA color (e.g. rgba(20,20,30,0.8)): ");
        if (custom) { cfg.backgroundColor = custom; cfg.noBackground = false; }
    } else if (BG_PRESETS[bgChoice]) {
        cfg.backgroundColor = BG_PRESETS[bgChoice].color;
        cfg.noBackground = false;
    }

    // Inline mode
    const inline = await ask("Inline chat mode? (username: message on same line) [y/N]: ");
    cfg.inlineChat = inline.toLowerCase() === "y";

    saveConfig(name, cfg);
    console.log("");
    console.log(`✅ Config "${name}" saved`);
    console.log("");
}

// ─── GIF Manager ───

async function gifManager() {
    while (true) {
        const active = getActiveConfig();
        const cfg = loadConfig(active);
        const gifs = cfg.customGifs || {};
        const gifFiles = listGifFiles();

        console.log("");
        console.log("─── GIF Manager ───");
        console.log(`  Config: ${active}`);
        console.log("");
        if (Object.keys(gifs).length === 0) {
            console.log("  No GIF triggers configured.");
        } else {
            console.log("  Trigger → File:");
            Object.entries(gifs).forEach(([k, v]) => console.log(`    ${k} → ${v}`));
        }
        console.log("");
        if (gifFiles.length > 0) {
            console.log("  Files in public/gifs/:");
            gifFiles.forEach(f => console.log(`    - ${f}`));
        } else {
            console.log("  No GIF files in public/gifs/");
        }
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
            if (gifFiles.length === 0) {
                console.log("❌ No GIF files. Import one first (option 3).");
                continue;
            }
            console.log("Available files:");
            gifFiles.forEach(f => console.log(`  ${f}`));
            const file = await ask("Filename (e.g. happycat.gif): ");
            if (!file) continue;
            if (!gifFiles.includes(file)) {
                console.log("❌ File not found in public/gifs/");
                continue;
            }
            gifs[keyword] = `/gifs/${file}`;
            cfg.customGifs = gifs;
            saveConfig(active, cfg);
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
            saveConfig(active, cfg);
            console.log(`✅ Removed: "${keyword}"`);
            continue;
        }

        if (choice === "3") {
            const url = await ask("GIF URL (must be .gif/.png/.webp): ");
            if (!url) continue;
            const filename = url.split("/").pop()?.split("?")[0] || "imported.gif";
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
                    saveConfig(active, cfg);
                    console.log(`✅ Added: "${keyword}" → /gifs/${filename}`);
                }
            } catch (e) {
                console.log(`❌ Download failed: ${e.message}`);
            }
            continue;
        }
    }
}

// ─── Main Menu ───

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

        if (choice === "1") {
            await editConfig(active);
            continue;
        }

        if (choice === "2") {
            console.log("\nAvailable configs:");
            configs.forEach(c => {
                const marker = c === active ? " ← active" : "";
                console.log(`  - ${c}${marker}`);
            });
            const name = (await ask("\nConfig name to switch to: ")).trim();
            if (name && configs.includes(name)) {
                activateConfig(name);
                console.log(`✅ Switched to config: ${name}`);
            } else if (name) {
                console.log("❌ Config not found.");
            }
            continue;
        }

        if (choice === "3") {
            const name = (await ask("New config name: ")).trim();
            if (!name) continue;
            const path = join(CONFIGS_DIR, `${name}.json`);
            if (existsSync(path)) {
                console.log(`❌ Config "${name}" already exists.`);
                continue;
            }
            const template = JSON.parse(readFileSync(TEMPLATE_PATH, "utf-8"));
            writeFileSync(path, JSON.stringify(template, null, 4));
            console.log(`✅ Created config: ${name}`);
            const sw = await ask("Switch to it now? [Y/n]: ");
            if (sw.toLowerCase() !== "n") {
                activateConfig(name);
                console.log(`✅ Switched to config: ${name}`);
            }
            continue;
        }

        if (choice === "4") {
            if (configs.length <= 1) {
                console.log("❌ Cannot delete the only config.");
                continue;
            }
            console.log("\nConfigs:");
            configs.forEach(c => console.log(`  - ${c}${c === active ? " ← active" : ""}`));
            const name = (await ask("\nConfig name to delete: ")).trim();
            if (!name) continue;
            if (name === "default") {
                console.log("❌ Cannot delete default config.");
                continue;
            }
            if (!configs.includes(name)) {
                console.log("❌ Config not found.");
                continue;
            }
            const path = join(CONFIGS_DIR, `${name}.json`);
            unlinkSync(path);
            if (name === active) {
                activateConfig("default");
                console.log(`✅ Deleted "${name}" — switched to default`);
            } else {
                console.log(`✅ Deleted: ${name}`);
            }
            continue;
        }

        if (choice === "5") {
            await gifManager();
            continue;
        }
    }

    console.log("\n👋 Bye!\n");
}

mainMenu().then(() => {
    rl.close();
    setTimeout(() => process.exit(0), 50);
});
