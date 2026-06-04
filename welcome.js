// welcome.js — goofy onboarding for the CLI
import { execSync } from "child_process";

const SLEEP = (ms) => new Promise(r => setTimeout(r, ms));
const CLEAR = "\x1b[2J\x1b[H";
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m",
  white: "\x1b[37m", dim: "\x1b[2m", bold: "\x1b[1m",
  bgRed: "\x1b[41m", bgGreen: "\x1b[42m",
};

function c(color, text) { return `${color}${text}${COLORS.reset}`; }

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

async function spin(text, duration) {
  const start = Date.now();
  let i = 0;
  while (Date.now() - start < duration) {
    process.stdout.write(`\r  ${c(COLORS.cyan, FRAMES[i % FRAMES.length])} ${text}`);
    i++;
    await SLEEP(80);
  }
  process.stdout.write(`\r  ${c(COLORS.green, "✔")} ${text}\n`);
}

async function type(text, delay = 30) {
  for (const ch of text) {
    process.stdout.write(ch);
    await SLEEP(delay);
  }
}

async function main() {
  console.log(CLEAR);

  // ── Boot sequence ──
  await spin("Booting up...", 800);
  await spin("Loading chat engines...", 600);
  await spin("Calibrating epic overlay vibes...", 700);
  await spin("Petting the hamster that powers the server...", 900);
  console.log("");

  // ── Banner ──
  const banner = `
${c(COLORS.red, "  ╔══════════════════════════════════════════════════════╗")}
${c(COLORS.red, "  ║")}  ${c(COLORS.bold, "YouTube Live Chat OBS Overlay")}                     ${c(COLORS.red, "║")}
${c(COLORS.red, "  ╠══════════════════════════════════════════════════════╣")}
${c(COLORS.red, "  ║")}  ${c(COLORS.dim, "Chat langsung dari YouTube ke OBS — tanpa API key,")}   ${c(COLORS.red, "║")}
${c(COLORS.red, "  ║")}  ${c(COLORS.dim, "tanpa login, tanpa ribet. Satu command, langsung jalan.")} ${c(COLORS.red, "║")}
${c(COLORS.red, "  ╚══════════════════════════════════════════════════════╝")}
`;
  console.log(banner);

  // ── The pitch ──
  await SLEEP(400);
  await type(`\n  ${c(COLORS.yellow, "👋")} Halo! Gue asisten install yang agak hyperaktif.\n`, 25);
  await SLEEP(300);
  await type(`  ${c(COLORS.dim, "  (jangan khawatir, ini cuma muncul sekali — abis ini serius mode)")}\n`, 20);

  // ── Features rapid-fire ──
  await SLEEP(500);
  console.log("");
  const features = [
    { icon: "💬", text: "Real-time chat dari YouTube via WebSocket" },
    { icon: "🎨", text: "Warna custom per role (Owner, Mod, Member, Verified)" },
    { icon: "🖼️", text: "Trigger kata → GIF (\"pog\" → pogchamp.gif)" },
    { icon: "⭐", text: "Super Chat glowing + bertahan lebih lama" },
    { icon: "📐", text: "Posisi chat: kiri, tengah, kanan — bebas" },
    { icon: "🔄", text: "Edit config pas lagi live — langsung update di OBS" },
    { icon: "🎭", text: "Multi-config: preset buat turnamen, santai, podcast..." },
    { icon: "🪟", text: "Jalan di Windows, macOS, Linux — gas aja" },
  ];

  for (const f of features) {
    await SLEEP(120);
    console.log(`  ${f.icon}  ${f.text}`);
  }

  // ── The sell ──
  await SLEEP(600);
  console.log("");
  await type(`  ${c(COLORS.green, "✨")} Intinya: lo fokus streaming, gue urus overlay-nya.\n`, 25);

  // ── Transition ──
  await SLEEP(800);
  console.log("");
  console.log(`  ${c(COLORS.yellow, "⚡")} Sekarang lanjut ke ${c(COLORS.bold, "Setup Wizard")} buat ngatur tampilan...`);
  console.log(`  ${c(COLORS.dim, "  (pilih font, warna background, inline mode, dll)")}`);
  await SLEEP(1200);

  // ── Launch setup.js ──
  console.log("");
  console.log(c(COLORS.dim, "  ── Memulai setup.js ──"));
  console.log("");

  try {
    execSync("bun setup.js", { stdio: "inherit", cwd: import.meta.dir });
  } catch {
    console.log(`\n  ${c(COLORS.yellow, "⚠️")}  setup.js selesai (atau lo pencet Ctrl+C — gapapa)`);
  }

  // ── Outro ──
  console.log("");
  console.log(`${c(COLORS.green, "  ✅")}  Install beres! Tinggal jalanin:`);
  console.log(`\n      ${c(COLORS.cyan, "bun start.js")}    ${c(COLORS.dim, "# pilih config pake arrow key")}`);
  console.log(`      ${c(COLORS.cyan, "bash start.sh")}   ${c(COLORS.dim, "# atau lewat shell wrapper")}`);
  console.log("");
  console.log(`  ${c(COLORS.dim, "Happy streaming! 🎬")}`);
  console.log("");
}

main();
