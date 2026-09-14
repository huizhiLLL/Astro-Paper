import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prepareResource, resourceRootFor } from "./resources.ts";
import { parseNbt, type NbtValue } from "./nbt.ts";
import { prepareAppearances, type BlockModel } from "./appearance.ts";
import { structureReference } from "./references.ts";
import { collectDependencies } from "./dependencies.ts";
export type SceneBlock = {
  id: string;
  state: Record<string, string>;
  pos: [number, number, number];
  nbt?: Record<string, NbtValue>;
  model?: string;
};
export type MCScene = {
  schema: 1;
  source: string;
  dataVersion?: number;
  size: [number, number, number];
  palette: string[];
  resources?: Record<string, { textureUrl?: string; source: string }>;
  models?: Record<string, BlockModel>;
  names?: Record<string, string>;
  dependencies?: string[];
  blocks: SceneBlock[];
};
const asCompound = (value: NbtValue | undefined) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const asNumber = (value: NbtValue | undefined) =>
  typeof value === "number" ? value : 0;
const asString = (value: NbtValue | undefined) =>
  typeof value === "string" ? value : "";
const field = (record: Record<string, NbtValue>, name: string) =>
  record[name] ??
  record[name.toLowerCase()] ??
  record[name[0].toUpperCase() + name.slice(1)];
export const parseStructureNbt = (input: Buffer, source: string): MCScene => {
  const root = parseNbt(input);
  const rawSize = field(root, "size");
  const size: [number, number, number] =
    Array.isArray(rawSize) && rawSize.length >= 3
      ? [Number(rawSize[0]), Number(rawSize[1]), Number(rawSize[2])]
      : [0, 0, 0];
  const rawPalette = field(root, "palette");
  const paletteCompound = Array.isArray(rawPalette)
    ? Object.fromEntries(
        rawPalette.map((entry, index) => [String(index), entry])
      )
    : asCompound(rawPalette);
  const palette = Object.keys(paletteCompound)
    .sort((a, b) => Number(a) - Number(b))
    .map(key => asString(asCompound(paletteCompound[key]).Name));
  const rawBlocksValue = field(root, "blocks");
  const rawBlocks = Array.isArray(rawBlocksValue)
    ? rawBlocksValue
    : Object.entries(asCompound(rawBlocksValue))
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, value]) => value);
  const blocks = rawBlocks.map(raw => {
    const block = asCompound(raw);
    const paletteEntry = asCompound(
      paletteCompound[String(asNumber(block.state))]
    );
    const rawPos = Array.isArray(block.pos) ? block.pos : [];
    const properties = asCompound(paletteEntry.Properties);
    const nbt = asCompound(block.nbt);
    const blockId =
      asString(paletteEntry.Name) || asString(nbt.id) || "minecraft:air";
    if (!palette.includes(blockId)) palette.push(blockId);
    return {
      id: blockId,
      state: Object.fromEntries(
        Object.entries(properties).map(([key, value]) => [key, String(value)])
      ),
      pos: [0, 1, 2].map(index => Number(rawPos[index] ?? 0)) as [
        number,
        number,
        number,
      ],
      ...(Object.keys(nbt).length > 0 ? { nbt } : {}),
    };
  });
  if (size.some(value => value <= 0) || blocks.length === 0)
    throw new Error("Structure is empty or has invalid size: " + source);
  return {
    schema: 1,
    source,
    dataVersion: asNumber(field(root, "dataVersion")),
    size,
    palette,
    blocks,
  };
};
export const buildScene = async (
  sourceFile: string,
  sourceLabel: string,
  publicDir: string,
  resourceRoot = resourceRootFor(publicDir)
) => {
  const input = await readFile(sourceFile);
  const { id } = structureReference(`src: ${sourceLabel}`);
  const scene = parseStructureNbt(input, sourceLabel);
  scene.blocks = scene.blocks.filter(
    block =>
      !["minecraft:air", "minecraft:cave_air", "minecraft:void_air"].includes(
        block.id
      )
  );
  if (scene.blocks.length === 0)
    throw new Error(`Structure contains no renderable blocks: ${sourceLabel}`);
  scene.palette = [...new Set(scene.blocks.map(block => block.id))];
  scene.dependencies = await collectDependencies(scene.palette, resourceRoot);
  const resources: MCScene["resources"] = {};
  for (const block of scene.blocks)
    resources[block.id] ??= await prepareResource(
      block.id,
      publicDir,
      resourceRoot
    );
  scene.resources = resources;
  const translations: Record<string, string> = {};
  for (const namespace of new Set(scene.palette.map(id => id.split(":")[0]))) {
    for (const language of ["en_us", "zh_cn"]) {
      try {
        Object.assign(
          translations,
          JSON.parse(
            await readFile(
              path.join(
                resourceRoot,
                `assets/${namespace}/lang/${language}.json`
              ),
              "utf8"
            )
          )
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
  }
  scene.names = Object.fromEntries(
    scene.palette.map(id => [
      id,
      translations[`block.${id.replace(":", ".")}`] ?? id,
    ])
  );
  const { models, modelKeys } = await prepareAppearances(
    scene.blocks,
    resourceRoot,
    publicDir
  );
  scene.models = models;
  scene.blocks.forEach((block, index) => {
    if (modelKeys[index]) block.model = modelKeys[index];
  });
  const outputDir = path.join(publicDir, "mc-generated", id);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "scene.json"), JSON.stringify(scene));
  return { id, sceneUrl: "/mc-generated/" + id + "/scene.json", scene };
};
