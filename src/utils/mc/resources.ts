import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";

export type MCResource = { textureUrl?: string; source: string };
const cache = new Map<string, MCResource>();
const minecraftRoots = () => {
  const configured = process.env.MC_RESOURCE_ROOT || "D:\\31691\\.minecraft";
  const version = process.env.MC_VERSION || "huizhi's test";
  return [path.join(configured, "versions", version, "mods")];
};
const namespaceOf = (id: string) => id.split(":")[0] || "minecraft";
const nameOf = (id: string) => id.split(":")[1] || id;
const textureCandidates = (namespace: string, name: string) => [
  `assets/${namespace}/textures/block/${name}.png`,
  `assets/${namespace}/textures/block/${name}/${name}_front.png`,
  `assets/${namespace}/textures/block/${name}/${name}.png`,
];

export const prepareResource = async (
  id: string,
  publicDir: string
): Promise<MCResource> => {
  if (cache.has(id)) return cache.get(id)!;
  const namespace = namespaceOf(id);
  const name = nameOf(id);
  const outputDir = path.join(publicDir, "mc-generated", "textures");
  await mkdir(outputDir, { recursive: true });
  const target = path.join(outputDir, `${namespace}-${name}.png`);
  const candidates = textureCandidates(namespace, name);
  const repositoryResources = path.resolve(
    publicDir,
    "../src/data/mc/resources"
  );

  for (const candidate of candidates) {
    const source = path.join(repositoryResources, candidate);
    if (!existsSync(source)) continue;
    await copyFile(source, target);
    const result = {
      textureUrl: `/mc-generated/textures/${namespace}-${name}.png`,
      source: `repository:${candidate}`,
    };
    cache.set(id, result);
    return result;
  }

  for (const root of minecraftRoots()) {
    if (!existsSync(root)) continue;
    for (const jar of await readdir(root)) {
      if (!jar.endsWith(".jar")) continue;
      const temp = await mkdtemp(path.join(os.tmpdir(), "mc-resource-"));
      const archive = path.join(temp, "mod.jar");
      try {
        // Java jar may misread non-ASCII Windows paths under the current locale.
        await copyFile(path.join(root, jar), archive);
        const entries = execFileSync("jar", ["tf", archive], {
          encoding: "utf8",
        })
          .split(/\r?\n/)
          .map(entry => entry.trim())
          .filter(Boolean);
        const texturePath = candidates.find(candidate =>
          entries.includes(candidate)
        );
        if (!texturePath) continue;
        execFileSync("jar", ["xf", archive, texturePath], {
          cwd: temp,
          stdio: "ignore",
        });
        const source = path.join(temp, texturePath);
        if (existsSync(source)) {
          await writeFile(target, new Uint8Array(await readFile(source)));
          const result = {
            textureUrl: `/mc-generated/textures/${namespace}-${name}.png`,
            source: jar,
          };
          cache.set(id, result);
          return result;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to extract ${id} from ${jar}: ${message}`);
      } finally {
        await rm(temp, { recursive: true, force: true });
      }
    }
  }

  const result = { source: "unresolved" };
  cache.set(id, result);
  return result;
};
