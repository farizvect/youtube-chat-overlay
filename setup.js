// setup.js — Interactive config wizard for non-technical users
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

const FONTS = ["Roboto", "Inter", "Poppins", "Nunito", "Open Sans", "Montserrat"];
const BG_PRESETS = {
    "1": { name: "Dark (default)", color: "rgba(50, 50, 68, 0.9)" },
    "2": { name: "Solid black", color: "rgba(0, 0, 0, 0.85)" },
    "3": { name: "Dark purple", color: "rgba(30, 30, 50, 0.9)" },
    "4": { name: "Transparent (no background)", color: "transparent" },
    "5": { name: "Custom", color: null },
};

async function main() {
    try {
        console.log("");
        console.log("╔════════════════════════════════════╗");
        console.log("║   Chat Overlay — Setup Wizard     ║");
        console.log("╚════════════════════════════════════╝");
        console.log("");
        console.log("Let's configure your chat overlay.");
        console.log("Press Enter to keep defaults.");
        console.log("");

        const templatePath = join(import.meta.dir, "config.template.json");
        const cfg = JSON.parse(readFileSync(templatePath, "utf-8"));

        // Font
        console.log("Font choices:");
        FONTS.forEach((f, i) => console.log(`  ${i + 1}) ${f}`));
        const fontChoice = await ask(`Font [1-${FONTS.length}, default=1]: `);
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

        // Write config
        const configPath = join(import.meta.dir, "config.json");
        writeFileSync(configPath, JSON.stringify(cfg, null, 4));

        console.log("");
        console.log("✅ Config saved to config.json");
        console.log("");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        rl.close();
    }
}

main().then(() => {
    // Give writeFileSync time to flush, then exit
    setTimeout(() => process.exit(0), 50);
});
