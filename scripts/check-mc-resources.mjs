import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("src/data/mc/resources");
const manifest = JSON.parse(
  await readFile(path.join(root, "manifest.json"), "utf8")
);
const entries = Object.entries(manifest.files);
if (manifest.schema !== 1 || entries.length === 0)
  throw new Error("Invalid resource manifest");
for (let offset = 0; offset < entries.length; offset += 64) {
  await Promise.all(
    entries.slice(offset, offset + 64).map(async ([relative, value]) => {
      if (
        !relative.startsWith("assets/") ||
        relative.includes("..") ||
        relative.includes("\\")
      )
        throw new Error(`Unsafe resource path: ${relative}`);
      const bytes = await readFile(path.join(root, relative));
      const hash = createHash("sha256").update(bytes).digest("hex");
      if (hash !== value.sha256)
        throw new Error(`Resource checksum mismatch: ${relative}`);
    })
  );
}
process.stdout.write(
  `Verified ${entries.length} repository resource files.` + "\n"
);
