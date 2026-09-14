import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { buildScene } from "./scene.ts";

const findStructures = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(entry => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory()
        ? findStructures(target)
        : Promise.resolve(entry.name.endsWith(".nbt") ? [target] : []);
    })
  );
  return files.flat();
};

export const buildMinecraftScenes = async (root: string, publicDir: string) => {
  const dataDir = path.join(root, "src/data/mc");
  const structuresDir = path.join(dataDir, "structures");
  await rm(path.join(publicDir, "mc-generated"), {
    recursive: true,
    force: true,
  });

  const structures = await findStructures(structuresDir);
  for (const structure of structures) {
    const relative = path.relative(dataDir, structure);
    const sourceLabel = `mc/${relative.split(path.sep).join("/")}`;
    await buildScene(structure, sourceLabel, publicDir);
  }
};
