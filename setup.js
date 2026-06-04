// setup.js — Interactive configuration + GIF manager
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "fs";
import { symlinkSync, unlinkSync, readlinkSync, copyFileSync } from "fs";
import { join } from "path";
import { select, input, confirm } from "@inquirer/prompts";

const ROOT = import.meta.dir;
const CONFIGS_DIR = join(ROOT, "configs");
const GIFS_DIR = join(ROOT, "public", "gifs");
const TEMPLATE_PATH = join(ROOT, "config.template.json");
const LINK_PATH = join(ROOT, "config.json");

if (!existsSync(CONFIGS_DIR)) mkdirSync(CONFIGS_DIR);
if (!existsSync(GIFS_DIR)) mkdirSync(GIFS_DIR);

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
        return link.replace("configs/", "").replace(".json", "");
    } catch {
        return "default";
    }
}

function activateConfig(name) {
    if (existsSync(LINK_PATH)) unlinkSync(LINK_PATH);
    symlinkSync(`configs/${name}.json`, LINK_PATH);
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

// ─── Edit Config ───

async function editConfig(name) {
    const cfg = loadConfig(name);

    console.log(`\n─── Editing: ${name} ───\n`);

    // Font
    const fonts = ["Roboto", "Inter", "Poppins", "Nunito", "Open Sans", "Montserrat"];
    const fontIdx = fonts.indexOf(cfg.fontFamily);
    cfg.fontFamily = await select({
        message: "Font",
        choices: fonts.map((f, i) => ({ name: f, value: f })),
        default: fontIdx >= 0 ? fontIdx : 0,
    });

    // Font size
    const size = await input({
        message: "Font size (12-32)",
        default: String(cfg.fontSize || 16),
        validate: v => {
            const n = parseInt(v);
            return (n >= 12 && n <= 32) ? true : "Must be 12-32";
        },
    });
    cfg.fontSize = parseInt(size);

    // Background
    const bg = await select({
        message: "Background style",
        choices: [
            { name: "Dark (default)", value: "rgba(50, 50, 68, 0.9)" },
            { name: "Solid black", value: "rgba(0, 0, 0, 0.85)" },
            { name: "Dark purple", value: "rgba(30, 30, 50, 0.9)" },
            { name: "Transparent (no background)", value: "transparent" },
        ],
    });
    if (bg === "transparent") {
        cfg.noBackground = true;
    } else {
        cfg.backgroundColor = bg;
        cfg.noBackground = false;
    }

    // Inline mode
    cfg.inlineChat = await confirm({
        message: "Inline chat mode? (username: message on same line)",
        default: cfg.inlineChat || false,
    });

    // Position
    cfg.position = await select({
        message: "Message position",
        choices: [
            { name: "Bottom-left (default)", value: "bottom-left" },
            { name: "Bottom-center", value: "bottom-center" },
            { name: "Bottom-right", value: "bottom-right" },
        ],
        default: ["bottom-left", "bottom-center", "bottom-right"].indexOf(cfg.position || "bottom-left"),
    });

    // Super Chat duration
    const sc = await input({
        message: "Super Chat duration multiplier (1-10)",
        default: String(cfg.superChatDuration || 3),
        validate: v => {
            const n = parseInt(v);
            return (n >= 1 && n <= 10) ? true : "Must be 1-10";
        },
    });
    cfg.superChatDuration = parseInt(sc);

    saveConfig(name, cfg);
    console.log(`✅ Config "${name}" saved`);

    await triggerReload(cfg.port || 6969);
}

async function triggerReload(port) {
    try {
        await fetch(`http://localhost:${port}/reload`, { method: "POST" });
        console.log("🔄 Server config reloaded\n");
    } catch {
        console.log("");
    }
}

// ─── GIF Manager ───

async function gifManager() {
    const active = getActiveConfig();
    const cfg = loadConfig(active);

    while (true) {
        const gifs = cfg.customGifs || {};
        const gifFiles = listGifFiles();

        console.log(`\n─── GIF Manager (config: ${active}) ───`);
        console.log(`  Files go in:  public/gifs/`);
        if (Object.keys(gifs).length === 0) {
            console.log("  No triggers configured.");
        } else {
            console.log("  Trigger → File:");
            for (const [k, v] of Object.entries(gifs)) {
                console.log(`    ${k} → ${v}`);
            }
        }
        if (gifFiles.length > 0) {
            console.log(`\n  Files in public/gifs/:  ${gifFiles.join(", ")}`);
        } else {
            console.log("\n  No GIF files in public/gifs/");
        }

        const action = await select({
            message: "What do you want to do?",
            choices: [
                { name: "Add GIF trigger", value: "add" },
                { name: "Remove GIF trigger", value: "remove" },
                { name: "Import GIF from URL", value: "import" },
                { name: "← Back to main menu", value: "back" },
            ],
        });

        if (action === "back") break;

        if (action === "add") {
            if (gifFiles.length === 0) {
                console.log("❌ No GIF files found. Put .gif/.png/.webp files in public/gifs/ first.");
                console.log("   Or use option 3 (Import GIF from URL) to download one.\n");
                continue;
            }
            const file = await select({
                message: "Pick a GIF file",
                choices: gifFiles.map(f => ({ name: f, value: f })),
            });
            const keyword = await input({ message: "Trigger word" });
            if (!keyword) continue;
            gifs[keyword] = `/gifs/${file}`;
            cfg.customGifs = gifs;
            saveConfig(active, cfg);
            console.log(`✅ Added: "${keyword}" → /gifs/${file}`);
        }

        if (action === "remove") {
            if (Object.keys(gifs).length === 0) continue;
            const keyword = await select({
                message: "Trigger to remove",
                choices: Object.keys(gifs).map(k => ({ name: `${k} → ${gifs[k]}`, value: k })),
            });
            delete gifs[keyword];
            cfg.customGifs = gifs;
            saveConfig(active, cfg);
            console.log(`✅ Removed: "${keyword}"`);
        }

        if (action === "import") {
            const url = await input({ message: "GIF URL (.gif/.png/.webp)" });
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
                const keyword = await input({ message: "Trigger word for this GIF" });
                if (keyword) {
                    gifs[keyword] = `/gifs/${filename}`;
                    cfg.customGifs = gifs;
                    saveConfig(active, cfg);
                    console.log(`✅ Added: "${keyword}" → /gifs/${filename}`);
                }
            } catch (e) {
                console.log(`❌ Download failed: ${e.message}`);
            }
        }
    }
}

// ─── Create Config ───

async function createConfig() {
    const name = await input({ message: "New config name" });
    if (!name) return;
    const path = join(CONFIGS_DIR, `${name}.json`);
    if (existsSync(path)) {
        console.log(`❌ Config "${name}" already exists.`);
        return;
    }
    const template = JSON.parse(readFileSync(TEMPLATE_PATH, "utf-8"));
    writeFileSync(path, JSON.stringify(template, null, 4));
    console.log(`✅ Created config: ${name}`);

    const sw = await confirm({ message: "Switch to it now?", default: true });
    if (sw) {
        activateConfig(name);
        console.log(`✅ Switched to config: ${name}`);
    }
}

// ─── Switch Config ───

async function switchConfig() {
    const active = getActiveConfig();
    const configs = listConfigs();
    if (configs.length <= 1) {
        console.log("Only one config exists. Create a new one first.");
        return;
    }
    const name = await select({
        message: "Switch to config",
        choices: configs.map(c => ({
            name: c === active ? `${c}  ← active` : c,
            value: c,
        })),
    });
    if (name !== active) {
        activateConfig(name);
        console.log(`✅ Switched to: ${name}`);
    }
}

// ─── Delete Config ───

async function deleteConfig() {
    const active = getActiveConfig();
    const configs = listConfigs();
    if (configs.length <= 1) {
        console.log("❌ Cannot delete the only config.");
        return;
    }
    const name = await select({
        message: "Delete config",
        choices: configs
            .filter(c => c !== "default")
            .map(c => ({
                name: c === active ? `${c}  ← active` : c,
                value: c,
            })),
    });
    if (!name) return;
    const path = join(CONFIGS_DIR, `${name}.json`);
    unlinkSync(path);
    console.log(`✅ Deleted: ${name}`);
    if (name === active) {
        activateConfig("default");
        console.log("   Switched to default");
    }
}

// ─── Main Menu ───

async function mainMenu() {
    while (true) {
        const active = getActiveConfig();

        console.log("");
        console.log("╔════════════════════════════════════╗");
        console.log("║   Chat Overlay — Setup Wizard     ║");
        console.log("╚════════════════════════════════════╝");
        console.log(`  Active config: ${active}`);

        const choice = await select({
            message: "What do you want to do?",
            choices: [
                { name: "🎨  Edit current config", value: "edit" },
                { name: "🔄  Switch config", value: "switch" },
                { name: "➕  Create new config", value: "create" },
                { name: "🗑️   Delete config", value: "delete" },
                { name: "🖼️   Manage GIFs", value: "gifs" },
                { name: "👋  Exit", value: "exit" },
            ],
        });

        if (choice === "exit") break;

        switch (choice) {
            case "edit": await editConfig(active); break;
            case "switch": await switchConfig(); break;
            case "create": await createConfig(); break;
            case "delete": await deleteConfig(); break;
            case "gifs": await gifManager(); break;
        }
    }

    console.log("\n👋 Bye!\n");
    process.exit(0);
}

mainMenu();
