import { access, readFile } from "node:fs/promises";
import path from "node:path";

/** Collect resource dependencies without claiming to render every Minecraft model. */
export async function collectDependencies(ids: string[], root: string) {
  const files = new Set<string>();
  const visited = new Set<string>();
  const resourcePath = (id: string, kind: string, extension: string) => {
    const [namespace, name] = id.includes(":")
      ? id.split(":")
      : ["minecraft", id];
    if (
      !/^[a-z0-9_.-]+$/.test(namespace) ||
      !/^[a-z0-9_./-]+$/.test(name) ||
      name.includes("..")
    )
      throw new Error(`Invalid resource ID: ${id}`);
    return `assets/${namespace}/${kind}/${name}${extension}`;
  };
  async function read(relative: string) {
    files.add(relative);
    try {
      return await readFile(path.join(root, relative), "utf8");
    } catch {
      throw new Error(`Missing repository dependency: ${relative}`);
    }
  }
  async function texture(id: string) {
    if (id.startsWith("#")) return;
    const file = resourcePath(id, "textures", ".png");
    try {
      await access(path.join(root, file));
    } catch {
      throw new Error(`Missing repository texture: ${file}`);
    }
    files.add(file);
    try {
      await access(path.join(root, `${file}.mcmeta`));
      files.add(`${file}.mcmeta`);
    } catch {
      /* Static texture. */
    }
  }
  async function model(id: string) {
    if (id.startsWith("builtin/") || id.startsWith("minecraft:builtin/"))
      return;
    const file = resourcePath(id, "models", ".json");
    if (visited.has(file)) return;
    visited.add(file);
    const data = JSON.parse(await read(file));
    if (typeof data.parent === "string") await model(data.parent);
    for (const value of Object.values(data.textures ?? {}))
      if (typeof value === "string") await texture(value);
  }
  async function variants(value: unknown): Promise<void> {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "model" && typeof child === "string") await model(child);
      else if (typeof child === "object") await variants(child);
    }
  }
  for (const id of new Set(ids)) {
    if (
      ["minecraft:air", "minecraft:cave_air", "minecraft:void_air"].includes(id)
    )
      continue;
    const state = resourcePath(id, "blockstates", ".json");
    try {
      await access(path.join(root, state));
    } catch {
      process.stderr.write(
        `[mc] No blockstate for ${id}; only explicit adapter/base texture can be used.` +
          "\n"
      );
      continue;
    }
    await variants(JSON.parse(await read(state)));
    if (id === "ae2:drive") await model("ae2:block/drive/drive_base");
    for (const language of ["zh_cn", "en_us"]) {
      const file = `assets/${id.split(":")[0]}/lang/${language}.json`;
      try {
        await access(path.join(root, file));
        files.add(file);
      } catch {
        /* Name falls back to ID. */
      }
    }
  }
  return [...files].sort();
}
