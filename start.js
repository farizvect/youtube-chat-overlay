// start.js — launcher, first-run setup, config manager, and server starter
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readlinkSync,
    readdirSync,
    symlinkSync,
    unlinkSync,
    writeFileSync,
} from "fs";
import { basename, join } from "path";
import { spawn } from "child_process";
import { createInterface } from "readline";

const ROOT = import.meta.dir;
const CONFIGS_DIR = join(ROOT, "configs");
const GIFS_DIR = join(ROOT, "public", "gifs");
const TEMPLATE_PATH = join(ROOT, "config.template.json");
const LINK_PATH = join(ROOT, "config.json");
const ACTIVE_PATH = join(ROOT, ".active-config");

const FONTS = ["Roboto", "Inter", "Poppins", "Nunito", "Open Sans", "Montserrat"];
const BG_PRESETS = {
    "1": { name: "Dark (default)", color: "rgba(50, 50, 68, 0.9)" },
    "2": { name: "Solid black", color: "rgba(0, 0, 0, 0.85)" },
    "3": { name: "Dark purple", color: "rgba(30, 30, 50, 0.9)" },
    "4": { name: "Transparent (no background)", color: "transparent" },
    "5": { name: "Custom", color: null },
};

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

function ensureDirs() {
    mkdirSync(CONFIGS_DIR, { recursive: true });
    mkdirSync(GIFS_DIR, { recursive: true });
}

function validConfigName(name) {
    return /^[a-zA-Z0-9_-]{1,64}$/.test(name);
}

function configPath(name) {
    if (!validConfigName(name)) throw new Error(`Invalid config name: ${name}`);
    return join(CONFIGS_DIR, `${name}.json`);
}

function listConfigs() {
    ensureDirs();
    return readdirSync(CONFIGS_DIR)
        .filter(f => f.endsWith(".json"))
        .map(f => f.replace(/\.json$/, ""))
        .filter(validConfigName)
        .sort((a, b) => a.localeCompare(b));
}

function readText(path) {
    return readFileSync(path, "utf-8").trim();
}

function getActiveConfig() {
    const configs = listConfigs();

    if (existsSync(ACTIVE_PATH)) {
        const active = readText(ACTIVE_PATH);
        if (configs.includes(active)) return active;
    }

    try {
        const target = readlinkSync(LINK_PATH);
        const name = basename(target).replace(/\.json$/, "");
        if (configs.includes(name)) return name;
    } catch {
        // config.json may be a copied file on Windows fallback.
    }

    if (configs.includes("default")) return "default";
    return configs[0] || "default";
}

function activateConfig(name) {
    const src = configPath(name);
    if (!existsSync(src)) throw new Error(`Config not found: ${name}`);

    if (existsSync(LINK_PATH)) unlinkSync(LINK_PATH);

    try {
        symlinkSync(`configs/${name}.json`, LINK_PATH);
    } catch {
        // Windows without admin/developer mode may not allow symlinks.
        copyFileSync(src, LINK_PATH);
    }

    writeFileSync(ACTIVE_PATH, `${name}\n`);
}

function loadConfig(name) {
    return JSON.parse(readFileSync(configPath(name), "utf-8"));
}

function saveConfig(name, cfg) {
    cfg._configured = true;
    writeFileSync(configPath(name), JSON.stringify(cfg, null, 4));
    if (name === getActiveConfig()) activateConfig(name);
}

function templateConfig() {
    const cfg = JSON.parse(readFileSync(TEMPLATE_PATH, "utf-8"));
    cfg._configured = false;
    return cfg;
}

function ensureDefaultConfig() {
    ensureDirs();
    if (!existsSync(configPath("default"))) {
        writeFileSync(configPath("default"), JSON.stringify(templateConfig(), null, 4));
    }
    if (!existsSync(LINK_PATH)) activateConfig(getActiveConfig());
}

function listGifFiles() {
    ensureDirs();
    return readdirSync(GIFS_DIR).filter(f => /\.(gif|png|webp)$/i.test(f));
}

async function promptConfigName(message) {
    const name = (await ask(message)).trim();
    if (!name) return "";
    if (!validConfigName(name)) {
        console.log("❌ Use only letters, numbers, dash, or underscore. Max 64 chars.");
        return "";
    }
    return name;
}

async function editConfig(name) {
    const cfg = loadConfig(name);

    console.log("");
    console.log(`─── Editing: ${name} ───`);
    console.log("Press Enter to keep current values.");
    console.log("");

    console.log("Font choices:");
    FONTS.forEach((f, i) => console.log(`  ${i + 1}) ${f}`));
    const currentFontIdx = Math.max(FONTS.indexOf(cfg.fontFamily) + 1, 1);
    const fontChoice = await ask(`Font [1-${FONTS.length}, default=${currentFontIdx}]: `);
    const idx = parseInt(fontChoice, 10) - 1;
    if (idx >= 0 && idx < FONTS.length) cfg.fontFamily = FONTS[idx];

    const size = await ask(`Font size [default=${cfg.fontSize}]: `);
    const sizeNum = parseInt(size, 10);
    if (sizeNum >= 12 && sizeNum <= 32) cfg.fontSize = sizeNum;

    console.log("");
    console.log("Background style:");
    Object.entries(BG_PRESETS).forEach(([k, v]) => console.log(`  ${k}) ${v.name}`));
    const bgChoice = await ask("Choice [1-5, default=1]: ");
    if (bgChoice === "4") {
        cfg.noBackground = true;
    } else if (bgChoice === "5") {
        const custom = await ask("Enter RGBA color (e.g. rgba(20,20,30,0.8)): ");
        if (custom) {
            cfg.backgroundColor = custom;
            cfg.noBackground = false;
        }
    } else if (BG_PRESETS[bgChoice]) {
        cfg.backgroundColor = BG_PRESETS[bgChoice].color;
        cfg.noBackground = false;
    }

    const inline = await ask(`Inline chat mode? [${cfg.inlineChat ? "Y/n" : "y/N"}]: `);
    if (inline.trim()) cfg.inlineChat = inline.toLowerCase() === "y";

    console.log("");
    console.log("Message position:");
    console.log("  1) Bottom-left (default)");
    console.log("  2) Bottom-center");
    console.log("  3) Bottom-right");
    const posMap = { "1": "bottom-left", "2": "bottom-center", "3": "bottom-right" };
    const currentPos = Object.entries(posMap).find(([, v]) => v === (cfg.position || "bottom-left"))?.[0] || "1";
    const posChoice = await ask(`Choice [1-3, default=${currentPos}]: `);
    if (posMap[posChoice]) cfg.position = posMap[posChoice];

    const scDuration = await ask(`Super Chat duration multiplier [default=${cfg.superChatDuration || 3}]: `);
    const scNum = parseInt(scDuration, 10);
    if (scNum >= 1 && scNum <= 10) cfg.superChatDuration = scNum;

    saveConfig(name, cfg);
    console.log(`✅ Config "${name}" saved`);

    try {
        const port = cfg.port || 6969;
        await fetch(`http://localhost:${port}/reload`, { method: "POST" });
        console.log("🔄 Server config reloaded");
    } catch {
        // Server not running.
    }
}

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
            const keyword = (await ask("Trigger word: ")).trim();
            if (!keyword) continue;
            if (gifFiles.length === 0) {
                console.log("❌ No GIF files. Import one first (option 3).");
                continue;
            }
            console.log("Available files:");
            gifFiles.forEach(f => console.log(`  ${f}`));
            const file = (await ask("Filename (e.g. happycat.gif): ")).trim();
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
            const keyword = (await ask("Trigger word to remove: ")).trim();
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
            const url = (await ask("GIF URL (must be .gif/.png/.webp): ")).trim();
            if (!url) continue;
            const filename = url.split("/").pop()?.split("?")[0] || "imported.gif";
            if (!/^[a-zA-Z0-9_.-]+\.(gif|png|webp)$/i.test(filename)) {
                console.log("❌ Filename must be .gif, .png, or .webp and cannot contain paths.");
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
                const keyword = (await ask("Trigger word for this GIF: ")).trim();
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

async function createConfig() {
    const name = await promptConfigName("New config name: ");
    if (!name) return;

    const path = configPath(name);
    if (existsSync(path)) {
        console.log(`❌ Config "${name}" already exists.`);
        return;
    }

    writeFileSync(path, JSON.stringify(templateConfig(), null, 4));
    console.log(`✅ Created config: ${name}`);

    const sw = await ask("Switch to it now? [Y/n]: ");
    if (sw.toLowerCase() !== "n") {
        activateConfig(name);
        console.log(`✅ Switched to config: ${name}`);
    }
}

async function manageConfigs() {
    while (true) {
        const active = getActiveConfig();
        const configs = listConfigs();

        console.log("");
        console.log("─── Config Manager ───");
        console.log(`  Active config: ${active}`);
        console.log("");
        console.log("  1) Edit current config");
        console.log("  2) Switch config");
        console.log("  3) Create new config");
        console.log("  4) Delete config");
        console.log("  5) Manage GIFs");
        console.log("  0) Back");
        console.log("");

        const choice = await ask("Choice [0-5]: ");
        if (choice === "0") break;

        if (choice === "1") {
            await editConfig(active);
            continue;
        }

        if (choice === "2") {
            console.log("\nAvailable configs:");
            configs.forEach(c => console.log(`  - ${c}${c === active ? " ← active" : ""}`));
            const name = await promptConfigName("\nConfig name to switch to: ");
            if (name && configs.includes(name)) {
                activateConfig(name);
                console.log(`✅ Switched to config: ${name}`);
            } else if (name) {
                console.log("❌ Config not found.");
            }
            continue;
        }

        if (choice === "3") {
            await createConfig();
            continue;
        }

        if (choice === "4") {
            if (configs.length <= 1) {
                console.log("❌ Cannot delete the only config.");
                continue;
            }
            console.log("\nConfigs:");
            configs.forEach(c => console.log(`  - ${c}${c === active ? " ← active" : ""}`));
            const name = await promptConfigName("\nConfig name to delete: ");
            if (!name) continue;
            if (name === "default") {
                console.log("❌ Cannot delete default config.");
                continue;
            }
            if (!configs.includes(name)) {
                console.log("❌ Config not found.");
                continue;
            }
            unlinkSync(configPath(name));
            if (name === active) {
                activateConfig("default");
                console.log(`✅ Deleted "${name}" — switched to default`);
            } else {
                console.log(`✅ Deleted: ${name}`);
            }
            continue;
        }

        if (choice === "5") await gifManager();
    }
}

function validLiveId(id) {
    return /^[a-zA-Z0-9_-]{6,32}$/.test(id);
}

function validChannelHandle(handle) {
    return /^@[a-zA-Z0-9_.-]{2,64}$/.test(handle);
}

async function pickSource() {
    console.log("");
    console.log("Connect to YouTube chat:");
    console.log("  1) Live Video ID (e.g. puhZur2y-g8)");
    console.log("  2) Channel Handle (e.g. @YourChannel)");
    console.log("");

    const choice = await ask("Choice [1/2]: ");
    if (choice === "2") {
        const channel = (await ask("Enter channel handle (with @): ")).trim();
        if (!validChannelHandle(channel)) {
            console.log("❌ Invalid channel handle.");
            return null;
        }
        return `--channel=${channel}`;
    }

    const liveId = (await ask("Enter live video ID: ")).trim();
    if (!validLiveId(liveId)) {
        console.log("❌ Invalid live video ID.");
        return null;
    }
    return `--live=${liveId}`;
}

async function startServer() {
    const active = getActiveConfig();
    activateConfig(active);

    const arg = await pickSource();
    if (!arg) return;

    console.log("");
    console.log(`🚀 Starting with config: ${active}`);
    console.log("   OBS Browser Source URL: http://localhost:6969");
    console.log("");

    rl.close();
    const server = spawn(process.execPath, [join(ROOT, "server.js"), arg], {
        cwd: ROOT,
        stdio: "inherit",
    });
    server.on("exit", code => process.exit(code ?? 0));
}

async function maybeFirstRunSetup() {
    const active = getActiveConfig();
    const cfg = loadConfig(active);
    if (cfg._configured === true) return;

    console.log("");
    console.log("First-time setup for this config.");
    const run = await ask("Configure it now? [Y/n]: ");
    if (run.toLowerCase() !== "n") await editConfig(active);
}

async function mainMenu() {
    ensureDefaultConfig();

    if (process.argv.includes("--setup")) {
        await manageConfigs();
        return;
    }

    await maybeFirstRunSetup();

    while (true) {
        const active = getActiveConfig();
        console.log("");
        console.log("╔════════════════════════════════════╗");
        console.log("║   Chat Overlay — Launcher          ║");
        console.log("╚════════════════════════════════════╝");
        console.log(`  Active config: ${active}`);
        console.log("");
        console.log("  1) Start overlay server");
        console.log("  2) Manage configs / GIFs");
        console.log("  0) Exit");
        console.log("");

        const choice = await ask("Choice [0-2]: ");
        if (choice === "0") break;
        if (choice === "2") {
            await manageConfigs();
            continue;
        }
        if (choice === "1" || choice === "") {
            await startServer();
            return;
        }
    }
}

mainMenu()
    .catch(err => {
        console.error(`❌ ${err.message}`);
        process.exitCode = 1;
    })
    .finally(() => {
        if (!rl.closed) rl.close();
    });
