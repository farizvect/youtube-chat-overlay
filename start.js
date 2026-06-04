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
import { select, input, confirm } from "@inquirer/prompts";

const ROOT = import.meta.dir;
const CONFIGS_DIR = join(ROOT, "configs");
const GIFS_DIR = join(ROOT, "public", "gifs");
const TEMPLATE_PATH = join(ROOT, "config.template.json");
const LINK_PATH = join(ROOT, "config.json");
const ACTIVE_PATH = join(ROOT, ".active-config");

const FONTS = ["Roboto", "Inter", "Poppins", "Nunito", "Open Sans", "Montserrat"];
const BG_PRESETS = [
    { name: "🌙 Dark (default)", value: { color: "rgba(50, 50, 68, 0.9)", noBackground: false } },
    { name: "⬛ Solid black", value: { color: "rgba(0, 0, 0, 0.85)", noBackground: false } },
    { name: "🟣 Dark purple", value: { color: "rgba(30, 30, 50, 0.9)", noBackground: false } },
    { name: "👻 Transparent (no background)", value: { color: "transparent", noBackground: true } },
    { name: "🎨 Custom RGBA", value: { color: null, noBackground: false } },
];

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

// ─── Edit Config Wizard ───

async function editConfig(name) {
    const cfg = loadConfig(name);

    console.log(`\n✏️  Editing: ${name}`);
    console.log("   Press Enter to keep current values.\n");

    // Font
    const fontIdx = FONTS.indexOf(cfg.fontFamily);
    cfg.fontFamily = await select({
        message: "🔤 Font:",
        choices: FONTS.map(f => ({ name: f, value: f })),
        default: fontIdx >= 0 ? fontIdx : 0,
    });

    // Font size
    const sizeStr = await input({
        message: "📏 Font size (12-32):",
        default: String(cfg.fontSize || 16),
        validate: v => {
            const n = parseInt(v, 10);
            return (n >= 12 && n <= 32) ? true : "Must be between 12 and 32";
        },
    });
    cfg.fontSize = parseInt(sizeStr, 10);

    // Background
    const bg = await select({
        message: "🎨 Background style:",
        choices: BG_PRESETS,
    });
    if (bg.noBackground) {
        cfg.noBackground = true;
    } else if (bg.color === null) {
        const custom = await input({
            message: "🎨 RGBA color:",
            default: cfg.backgroundColor || "rgba(20,20,30,0.8)",
        });
        cfg.backgroundColor = custom;
        cfg.noBackground = false;
    } else {
        cfg.backgroundColor = bg.color;
        cfg.noBackground = false;
    }

    // Inline mode
    cfg.inlineChat = await confirm({
        message: "💬 Inline chat mode? (username: message on same line)",
        default: cfg.inlineChat || false,
    });

    // Position
    const posChoices = [
        { name: "↙️  Bottom-left (default)", value: "bottom-left" },
        { name: "⬇️  Bottom-center", value: "bottom-center" },
        { name: "↘️  Bottom-right", value: "bottom-right" },
    ];
    cfg.position = await select({
        message: "📌 Message position:",
        choices: posChoices,
        default: posChoices.findIndex(p => p.value === (cfg.position || "bottom-left")),
    });

    // Super Chat duration
    const scStr = await input({
        message: "⭐ Super Chat duration multiplier (1-10):",
        default: String(cfg.superChatDuration || 3),
        validate: v => {
            const n = parseInt(v, 10);
            return (n >= 1 && n <= 10) ? true : "Must be between 1 and 10";
        },
    });
    cfg.superChatDuration = parseInt(scStr, 10);

    saveConfig(name, cfg);
    console.log(`\n✅ Config "${name}" saved`);

    try {
        const port = cfg.port || 6969;
        await fetch(`http://localhost:${port}/reload`, { method: "POST" });
        console.log("🔄 Server config reloaded");
    } catch {
        // Server not running.
    }
}

// ─── GIF Manager ───

async function gifManager() {
    while (true) {
        const active = getActiveConfig();
        const cfg = loadConfig(active);
        const gifs = cfg.customGifs || {};
        const gifFiles = listGifFiles();

        console.log(`\n🎞️  GIF Manager — config: ${active}`);

        if (Object.keys(gifs).length > 0) {
            console.log("   Triggers:");
            Object.entries(gifs).forEach(([k, v]) => console.log(`     ${k} → ${v}`));
        } else {
            console.log("   No GIF triggers configured.");
        }

        if (gifFiles.length > 0) {
            console.log("   Files:");
            gifFiles.forEach(f => console.log(`     📁 ${f}`));
        }

        const action = await select({
            message: "GIF Manager:",
            choices: [
                { name: "➕ Add GIF trigger", value: "add" },
                { name: "➖ Remove GIF trigger", value: "remove" },
                { name: "📥 Import GIF from URL", value: "import" },
                { name: "🔙 Back", value: "back" },
            ],
        });

        if (action === "back") break;

        if (action === "add") {
            if (gifFiles.length === 0) {
                console.log("\n❌ No GIF files. Import one first.");
                continue;
            }
            const keyword = await input({
                message: "Trigger word:",
                validate: v => v.trim() ? true : "Cannot be empty",
            });
            const file = await select({
                message: "Pick a GIF file:",
                choices: gifFiles.map(f => ({ name: `📁 ${f}`, value: f })),
            });
            gifs[keyword.trim()] = `/gifs/${file}`;
            cfg.customGifs = gifs;
            saveConfig(active, cfg);
            console.log(`\n✅ Added: "${keyword}" → /gifs/${file}`);
        }

        if (action === "remove") {
            if (Object.keys(gifs).length === 0) {
                console.log("\n❌ No triggers to remove.");
                continue;
            }
            const keyword = await select({
                message: "Trigger to remove:",
                choices: Object.keys(gifs).map(k => ({ name: `${k} → ${gifs[k]}`, value: k })),
            });
            delete gifs[keyword];
            cfg.customGifs = gifs;
            saveConfig(active, cfg);
            console.log(`\n✅ Removed: "${keyword}"`);
        }

        if (action === "import") {
            const url = await input({
                message: "GIF URL (.gif/.png/.webp):",
                validate: v => v.trim() ? true : "Cannot be empty",
            });
            const filename = url.split("/").pop()?.split("?")[0] || "imported.gif";
            if (!/^[a-zA-Z0-9_.-]+\.(gif|png|webp)$/i.test(filename)) {
                console.log("\n❌ Filename must be .gif, .png, or .webp");
                continue;
            }
            const dest = join(GIFS_DIR, filename);
            console.log(`\n📥 Downloading ${filename}...`);
            try {
                const resp = await fetch(url);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const buf = await resp.arrayBuffer();
                writeFileSync(dest, Buffer.from(buf));
                console.log(`✅ Downloaded to public/gifs/${filename}`);
                const useNow = await confirm({
                    message: "Add a trigger for this GIF now?",
                    default: true,
                });
                if (useNow) {
                    const keyword = await input({
                        message: "Trigger word:",
                        validate: v => v.trim() ? true : "Cannot be empty",
                    });
                    gifs[keyword.trim()] = `/gifs/${filename}`;
                    cfg.customGifs = gifs;
                    saveConfig(active, cfg);
                    console.log(`\n✅ Added: "${keyword}" → /gifs/${filename}`);
                }
            } catch (e) {
                console.log(`\n❌ Download failed: ${e.message}`);
            }
        }
    }
}

// ─── Config Manager ───

async function createConfig() {
    const name = await input({
        message: "📝 New config name:",
        validate: v => {
            if (!v.trim()) return "Cannot be empty";
            if (!validConfigName(v.trim())) return "Only letters, numbers, dash, underscore. Max 64 chars.";
            if (existsSync(configPath(v.trim()))) return `Config "${v.trim()}" already exists.`;
            return true;
        },
    });

    writeFileSync(configPath(name.trim()), JSON.stringify(templateConfig(), null, 4));
    console.log(`\n✅ Created config: ${name.trim()}`);

    const sw = await confirm({ message: "Switch to it now?", default: true });
    if (sw) {
        activateConfig(name.trim());
        console.log(`✅ Switched to config: ${name.trim()}`);
    }
}

async function manageConfigs() {
    while (true) {
        const active = getActiveConfig();
        const configs = listConfigs();

        console.log(`\n⚙️  Config Manager — active: ${active}`);

        const action = await select({
            message: "What do you want to do?",
            choices: [
                { name: "✏️  Edit current config", value: "edit" },
                { name: "🔄 Switch config", value: "switch" },
                { name: "➕ Create new config", value: "create" },
                { name: "🗑️  Delete config", value: "delete" },
                { name: "🎞️  Manage GIFs", value: "gifs" },
                { name: "🔙 Back", value: "back" },
            ],
        });

        if (action === "back") break;

        if (action === "edit") {
            await editConfig(active);
        }

        if (action === "switch") {
            const choices = configs.map(c => ({
                name: `${c === active ? "✅ " : "   "}${c}`,
                value: c,
            }));
            const name = await select({
                message: "Switch to:",
                choices,
            });
            activateConfig(name);
            console.log(`\n✅ Switched to config: ${name}`);
        }

        if (action === "create") {
            await createConfig();
        }

        if (action === "delete") {
            if (configs.length <= 1) {
                console.log("\n❌ Cannot delete the only config.");
                continue;
            }
            const deletable = configs.filter(c => c !== "default").map(c => ({
                name: `${c === active ? "📌 " : "   "}${c}`,
                value: c,
            }));
            const name = await select({
                message: "Config to delete:",
                choices: deletable,
            });
            unlinkSync(configPath(name));
            if (name === active) {
                activateConfig("default");
                console.log(`\n✅ Deleted "${name}" — switched to default`);
            } else {
                console.log(`\n✅ Deleted: ${name}`);
            }
        }

        if (action === "gifs") {
            await gifManager();
        }
    }
}

// ─── Source Picker ───

async function pickSource() {
    const source = await select({
        message: "📺 Connect to YouTube chat via:",
        choices: [
            { name: "🎬 Live Video ID (e.g. puhZur2y-g8)", value: "live" },
            { name: "📡 Channel Handle (e.g. @YourChannel)", value: "channel" },
        ],
    });

    if (source === "channel") {
        const handle = await input({
            message: "Channel handle (with @):",
            validate: v => /^@[a-zA-Z0-9_.-]{2,64}$/.test(v.trim()) ? true : "Must start with @ (2-64 chars)",
        });
        return `--channel=${handle.trim()}`;
    }

    const liveId = await input({
        message: "Live video ID:",
        validate: v => /^[a-zA-Z0-9_-]{6,32}$/.test(v.trim()) ? true : "Must be 6-32 chars (letters, numbers, dash, underscore)",
    });
    return `--live=${liveId.trim()}`;
}

// ─── Server Launcher ───

async function startServer() {
    const active = getActiveConfig();
    activateConfig(active);

    const arg = await pickSource();

    console.log(`\n🚀 Starting with config: ${active}`);
    console.log("   OBS Browser Source → http://localhost:6969\n");

    const server = spawn(process.execPath, [join(ROOT, "server.js"), arg], {
        cwd: ROOT,
        stdio: "inherit",
    });
    server.on("exit", code => process.exit(code ?? 0));
}

// ─── First Run ───

async function maybeFirstRunSetup() {
    const active = getActiveConfig();
    const cfg = loadConfig(active);
    if (cfg._configured === true) return;

    console.log("\n👋 First-time setup for this config.");
    const run = await confirm({ message: "Configure it now?", default: true });
    if (run) await editConfig(active);
}

// ─── Main ───

async function mainMenu() {
    ensureDefaultConfig();

    if (process.argv.includes("--setup")) {
        await manageConfigs();
        return;
    }

    await maybeFirstRunSetup();

    while (true) {
        const active = getActiveConfig();

        console.log("\n╔════════════════════════════════════╗");
        console.log("║   🎬 Chat Overlay — Launcher       ║");
        console.log("╚════════════════════════════════════╝");
        console.log(`   📋 Active config: ${active}`);

        const action = await select({
            message: "What do you want to do?",
            choices: [
                { name: "▶️  Start overlay server", value: "start" },
                { name: "⚙️  Manage configs / GIFs", value: "manage" },
                { name: "🚪 Exit", value: "exit" },
            ],
        });

        if (action === "exit") break;
        if (action === "manage") {
            await manageConfigs();
            continue;
        }
        if (action === "start") {
            await startServer();
            return;
        }
    }
}

mainMenu().catch(err => {
    console.error(`\n❌ ${err.message}`);
    process.exitCode = 1;
});
