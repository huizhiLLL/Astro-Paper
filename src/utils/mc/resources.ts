import { copyFile, mkdir, access } from "node:fs/promises";
import path from "node:path";

export type MCResource = { textureUrl?: string; source: string };
export const resourceRootFor = (publicDir: string) =>
  path.resolve(publicDir, "../src/data/mc/resources");
export async function prepareResource(
  id: string,
  publicDir: string,
  resourceRoot = resourceRootFor(publicDir)
): Promise<MCResource> {
  const [namespace, name] = id.split(":");
  if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(id) || id.includes(".."))
    throw new Error(`Invalid block ID: ${id}`);
  const candidates = [
    `assets/${namespace}/textures/block/${name}.png`,
    `assets/${namespace}/textures/block/${name}/${name.split("/").at(-1)}_front.png`,
    `assets/${namespace}/textures/block/${name}/${name.split("/").at(-1)}.png`,
  ];
  for (const candidate of candidates) {
    const source = path.join(resourceRoot, candidate);
    try {
      await access(source);
    } catch {
      continue;
    }
    const filename = `${namespace}-${name.replaceAll("/", "-")}.png`;
    const target = path.join(publicDir, "mc-generated/textures", filename);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    return {
      textureUrl: `/mc-generated/textures/${filename}`,
      source: `repository:${candidate}`,
    };
  }
  const supported = [
    "ae2:controller",
    "ae2:molecular_assembler",
    "ae2:drive",
    "ae2:pattern_provider",
    "ae2:creative_energy_cell",
  ];
  if (supported.includes(id))
    throw new Error(
      `Missing repository texture for ${id}: ${candidates.join(", ")}`
    );
  process.stderr.write(
    `[mc] No base texture for ${id}; using a placeholder (no local resource fallback).` +
      "\n"
  );
  return { source: "unsupported" };
}
