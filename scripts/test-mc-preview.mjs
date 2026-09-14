import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";

const origin = "http://127.0.0.1:4399";
const server = spawn(
  process.execPath,
  [
    "node_modules/astro/astro.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4399",
  ],
  { stdio: "inherit" }
);
try {
  let ready = false;
  for (let attempt = 0; attempt < 360; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Preview server exited: ${server.exitCode}`);
    try {
      ready = (
        await fetch(`${origin}/robots.txt`, {
          signal: AbortSignal.timeout(1000),
        })
      ).ok;
    } catch {
      /* Wait for startup. */
    }
    if (ready) break;
    await setTimeout(500);
  }
  if (!ready) throw new Error("Preview server did not become ready");
  const result = spawn(
    process.execPath,
    ["--test", "tests/minecraft-preview.test.mjs"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        MC_PREVIEW_ORIGIN: origin,
        MC_PREVIEW_PRODUCTION: "1",
      },
    }
  );
  const code = await new Promise((resolve, reject) => {
    result.once("exit", resolve);
    result.once("error", reject);
  });
  if (code !== 0) throw new Error(`Preview tests failed: ${code}`);
} finally {
  server.kill();
}
