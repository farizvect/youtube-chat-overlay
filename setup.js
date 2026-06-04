// setup.js — compatibility wrapper. The real launcher/setup lives in start.js.
import { spawn } from "child_process";
import { join } from "path";

const child = spawn(process.execPath, [join(import.meta.dir, "start.js"), "--setup"], {
    cwd: import.meta.dir,
    stdio: "inherit",
});

child.on("exit", code => process.exit(code ?? 0));
