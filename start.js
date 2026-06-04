// start.js — Interactive launcher with arrow-key selection
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, rmSync, symlinkSync, copyFileSync, readlinkSync } from "fs";
import { join } from "path";
import { select, input } from "@inquirer/prompts";
import { spawn } from "child_process";

const WINDOWS = process.platform === "win32";
const ROOT = import.meta.dir;
const CONFIGS_DIR = join(ROOT, "configs");
const TEMPLATE_PATH = join(ROOT, "config.template.json");
const LINK_PATH = join(ROOT, "config.json");

if (!existsSync(CONFIGS_DIR)) mkdirSync(CONFIGS_DIR);

function activateConfig(name) {
    if (existsSync(LINK_PATH)) rmSync(LINK_PATH, { force: true });
    try {
        symlinkSync(`configs/${name}.json`, LINK_PATH);
    } catch {
        // Windows without admin/Developer Mode — fall back to copy
        copyFileSync(join(CONFIGS_DIR, `${name}.json`), LINK_PATH);
    }
}

function listConfigs() {
    if (!existsSync(CONFIGS_DIR)) return [];
    return readdirSync(CONFIGS_DIR)
        .filter(f => f.endsWith(".json"))
        .map(f => f.replace(".json", ""));
}

function getActive() {
    try {
        return readlinkSync(LINK_PATH).replace("configs/", "").replace(".json", "");
    } catch { return ""; }
}

// ─── Main ───

console.log("");
console.log("╔══════════════════════════════════════════════╗");
console.log("║     YouTube Live Chat Overlay — Start        ║");
console.log("╚══════════════════════════════════════════════╝");
console.log("");

let configs = listConfigs();
if (configs.length === 0) {
    mkdirSync(CONFIGS_DIR, { recursive: true });
    const template = readFileSync(TEMPLATE_PATH, "utf-8");
    writeFileSync(join(CONFIGS_DIR, "default.json"), template);
    configs = ["default"];
}

const active = getActive();

// Config picker
const choices = configs.map(c => ({
    name: c === active ? `${c}  ← active` : c,
    value: c,
}));
choices.push({ name: "➕  Create new config", value: "_new_" });

const chosen = await select({
    message: "Pick a config",
    choices,
    default: configs.indexOf(active) >= 0 ? configs.indexOf(active) : 0,
});

let selected = chosen;
if (chosen === "_new_") {
    selected = await input({ message: "New config name" });
    if (!selected) { console.log("Cancelled."); process.exit(0); }
    const path = join(CONFIGS_DIR, `${selected}.json`);
    if (existsSync(path)) {
        console.log(`❌ Config "${selected}" already exists.`);
        process.exit(1);
    }
    copyFileSync(TEMPLATE_PATH, path);
    console.log(`✅ Created config: ${selected}`);
}

// Activate
activateConfig(selected);
console.log(`📋 Using config: ${selected}`);

// Live source
console.log("");
const source = await select({
    message: "Connect to YouTube chat via",
    choices: [
        { name: "Live Video ID (e.g. puhZur2y-g8)", value: "live" },
        { name: "Channel Handle (e.g. @YourChannel)", value: "channel" },
    ],
});

let arg;
if (source === "channel") {
    const handle = await input({
        message: "Channel handle (with @)",
        validate: v => v.startsWith("@") ? true : "Must start with @",
    });
    arg = `--channel=${handle}`;
} else {
    const id = await input({
        message: "Live video ID",
        validate: v => /^[a-zA-Z0-9_-]{11}$/.test(v) ? true : "Must be 11 characters",
    });
    arg = `--live=${id}`;
}

// Launch
console.log("");
console.log(`🚀 Starting: ${selected} | ${arg}`);
console.log("   OBS Browser Source →  http://localhost:6969");
console.log("   💡 GIFs go in:  public/gifs/");
console.log("");

const server = spawn("bun", ["server.js", arg], {
    cwd: ROOT,
    stdio: "inherit",
});

server.on("exit", (code) => {
    process.exit(code || 0);
});
