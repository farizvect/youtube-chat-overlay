// test_start.js — Automated tests for start.js core logic
// Run: bun test_start.js
import {
    readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync,
    symlinkSync, unlinkSync, copyFileSync, readlinkSync, rmSync,
} from "fs";
import { basename, join } from "path";

let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.error(`  ❌ ${msg}`); }
}

const ROOT = import.meta.dir;
const CONFIGS_DIR = join(ROOT, "configs");
const GIFS_DIR = join(ROOT, "public", "gifs");
const TEMPLATE_PATH = join(ROOT, "config.template.json");
const LINK_PATH = join(ROOT, "config.json");
const ACTIVE_PATH = join(ROOT, ".active-config");

// ── Helpers (mirrors from start.js) ──

function validConfigName(name) {
    return /^[a-zA-Z0-9_-]{1,64}$/.test(name);
}

function configPath(name) {
    if (!validConfigName(name)) throw new Error(`Invalid config name: ${name}`);
    return join(CONFIGS_DIR, `${name}.json`);
}

function ensureDirs() {
    mkdirSync(CONFIGS_DIR, { recursive: true });
    mkdirSync(GIFS_DIR, { recursive: true });
}

function listConfigs() {
    ensureDirs();
    return readdirSync(CONFIGS_DIR)
        .filter(f => f.endsWith(".json"))
        .map(f => f.replace(/\.json$/, ""))
        .filter(validConfigName)
        .sort((a, b) => a.localeCompare(b));
}

function getActiveConfig() {
    const configs = listConfigs();
    if (existsSync(ACTIVE_PATH)) {
        const active = readFileSync(ACTIVE_PATH, "utf-8").trim();
        if (configs.includes(active)) return active;
    }
    try {
        const target = readlinkSync(LINK_PATH);
        const name = basename(target).replace(/\.json$/, "");
        if (configs.includes(name)) return name;
    } catch {}
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

function validLiveId(id) {
    return /^[a-zA-Z0-9_-]{6,32}$/.test(id);
}

function validChannelHandle(handle) {
    return /^@[a-zA-Z0-9_.-]{2,64}$/.test(handle);
}

// ── Cleanup ──

function cleanup() {
    for (const f of [LINK_PATH, ACTIVE_PATH]) {
        try { unlinkSync(f); } catch {}
    }
    for (const f of readdirSync(CONFIGS_DIR).filter(f => f !== ".gitkeep")) {
        try { unlinkSync(join(CONFIGS_DIR, f)); } catch {}
    }
}

// ── Tests ──

console.log("\n═══ validConfigName ═══");
assert(validConfigName("default"), "default is valid");
assert(validConfigName("tournament"), "tournament is valid");
assert(validConfigName("my-config_2"), "my-config_2 is valid");
assert(!validConfigName(""), "empty string is invalid");
assert(!validConfigName("../escape"), "../ is invalid");
assert(!validConfigName("a/b"), "a/b is invalid");
assert(!validConfigName("a b"), "space is invalid");
assert(!validConfigName("a".repeat(65)), "> 64 chars is invalid");
assert(validConfigName("a".repeat(64)), "64 chars is valid");

console.log("\n═══ validLiveId ═══");
assert(validLiveId("puhZur2y-g8"), "standard live ID");
assert(validLiveId("abcDEF12345"), "alphanumeric ID");
assert(!validLiveId("short"), "too short");
assert(!validLiveId(""), "empty");
assert(validLiveId("a".repeat(32)), "32 chars max");
assert(!validLiveId("a".repeat(33)), "> 32 chars invalid");
assert(!validLiveId("has space!"), "special chars invalid");

console.log("\n═══ validChannelHandle ═══");
assert(validChannelHandle("@YourChannel"), "standard handle");
assert(validChannelHandle("@a.b_c"), "dotted handle");
assert(!validChannelHandle("no-at"), "missing @");
assert(!validChannelHandle("@"), "@ alone");
assert(!validChannelHandle("@a"), "too short after @");

console.log("\n═══ ensureDefaultConfig ═══");
cleanup();
ensureDefaultConfig();
assert(existsSync(configPath("default")), "default config created");
assert(existsSync(LINK_PATH), "config.json created");
assert(existsSync(ACTIVE_PATH), ".active-config created");
const def = loadConfig("default");
assert(def._configured === false, "fresh default has _configured=false");

console.log("\n═══ listConfigs ═══");
const initial = listConfigs();
assert(initial.includes("default"), "lists default");
assert(initial.length === 1, "only default so far");

console.log("\n═══ create + activate config ═══");
const testCfg = templateConfig();
testCfg.fontFamily = "Inter";
writeFileSync(configPath("test-a"), JSON.stringify(testCfg, null, 4));
activateConfig("test-a");
assert(getActiveConfig() === "test-a", "active is now test-a");
assert(readFileSync(ACTIVE_PATH, "utf-8").trim() === "test-a", ".active-config has test-a");

// Also create a second config
writeFileSync(configPath("test-b"), JSON.stringify(testCfg, null, 4));
const cfgs = listConfigs();
assert(cfgs.includes("default"), "has default");
assert(cfgs.includes("test-a"), "has test-a");
assert(cfgs.includes("test-b"), "has test-b");
assert(cfgs.length === 3, "3 configs total");

console.log("\n═══ switch config ═══");
activateConfig("test-b");
assert(getActiveConfig() === "test-b", "switched to test-b");

console.log("\n═══ saveConfig marks _configured ═══");
saveConfig("test-a", { ...loadConfig("test-a"), fontFamily: "Poppins" });
const reloaded = loadConfig("test-a");
assert(reloaded._configured === true, "_configured set after save");
assert(reloaded.fontFamily === "Poppins", "font updated");

console.log("\n═══ delete config ═══");
unlinkSync(configPath("test-b"));
assert(!listConfigs().includes("test-b"), "test-b deleted");
// After deleting the active config, .active-config is stale ("test-b") → falls back to default
assert(getActiveConfig() === "default", "falls back to default after active deleted");

console.log("\n═══ getActiveConfig fallback to .active-config ═══");
// Simulate Windows copy fallback: config.json is a real file, not symlink
activateConfig("test-a");
const src = configPath("test-a");
unlinkSync(LINK_PATH);
copyFileSync(src, LINK_PATH);
// .active-config should still work
assert(getActiveConfig() === "test-a", "active via .active-config even without symlink");

console.log("\n═══ activateConfig writes .active-config ═══");
activateConfig("default");
assert(readFileSync(ACTIVE_PATH, "utf-8").trim() === "default", ".active-config updated");

console.log("\n═══ GIF helper: listGifFiles ═══");
ensureDirs();
function listGifFiles() {
    return readdirSync(GIFS_DIR).filter(f => /\.(gif|png|webp)$/i.test(f));
}
const gifs = listGifFiles();
assert(Array.isArray(gifs), "returns array");
assert(gifs.includes("happycat.gif"), "happycat.gif exists in public/gifs/");

console.log("\n═══ Syntax check (start.js) ═══");
const proc = Bun.spawnSync(["node", "--check", join(ROOT, "start.js")]);
assert(proc.exitCode === 0, "start.js passes node --check");

const proc2 = Bun.spawnSync(["node", "--check", join(ROOT, "setup.js")]);
assert(proc2.exitCode === 0, "setup.js passes node --check");

const proc3 = Bun.spawnSync(["bash", "-n", join(ROOT, "start.sh")]);
assert(proc3.exitCode === 0, "start.sh passes bash -n");

// ── Cleanup ──
cleanup();

// ── Summary ──
console.log(`\n══════════════════════════════════`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════\n`);
process.exit(failed > 0 ? 1 : 0);
