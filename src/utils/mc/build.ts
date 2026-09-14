import {
  mkdir,
  readFile,
  readdir,
  realpath,
  cp,
  rm,
  mkdtemp,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { buildScene } from "./scene.ts";
import { collectStructureReferences } from "./references.ts";

async function articles(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await articles(target)));
    else if (
      entry.isFile() &&
      !entry.name.startsWith("_") &&
      entry.name.endsWith(".md")
    )
      result.push(target);
  }
  return result.sort();
}

export async function buildMinecraftScenes(
  root: string,
  publicDir: string,
  resourceRoot = path.join(root, "src/data/mc/resources")
) {
  const references = new Map<string, string[]>();
  for (const article of await articles(path.join(root, "src/data/blog"))) {
    const label = path.relative(root, article).split(path.sep).join("/");
    try {
      for (const reference of collectStructureReferences(
        await readFile(article, "utf8")
      )) {
        const owners = references.get(reference.source) ?? [];
        owners.push(`${label}:${reference.line}`);
        references.set(reference.source, owners);
      }
    } catch (error) {
      throw new Error(`${label}: ${String(error)}`);
    }
  }
  await mkdir(path.join(root, ".astro"), { recursive: true });
  const staging = await mkdtemp(path.join(root, ".astro/mc-build-"));
  const generated = path.join(staging, "mc-generated");
  await mkdir(generated, { recursive: true });
  const manifest = {
    schema: 1,
    scenes: [] as Array<{
      source: string;
      sceneUrl: string;
      articles: string[];
      dependencies: string[];
    }>,
  };
  try {
    const structureRoot = path.join(root, "src/data/mc/structures");
    for (const [source, owners] of references) {
      try {
        const file = await realpath(path.join(root, "src/data", source));
        const allowed = await realpath(structureRoot);
        const relative = path.relative(allowed, file);
        if (relative.startsWith("..") || path.isAbsolute(relative))
          throw new Error("Structure resolves outside the structure directory");
        const result = await buildScene(file, source, staging, resourceRoot);
        manifest.scenes.push({
          source,
          sceneUrl: result.sceneUrl,
          articles: owners,
          dependencies: result.scene.dependencies ?? [],
        });
      } catch (error) {
        throw new Error(`${owners.join(", ")} -> ${source}: ${String(error)}`);
      }
    }
    await writeFile(
      path.join(generated, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );
    await mkdir(publicDir, { recursive: true });
    const destination = path.join(publicDir, "mc-generated");
    // Keep the watched directory itself in place on Windows.
    await mkdir(destination, { recursive: true });
    await cp(generated, destination, { recursive: true, force: true });
    const prune = async (current: string, expected: string) => {
      const names = new Set(await readdir(expected));
      for (const entry of await readdir(current, { withFileTypes: true })) {
        const target = path.join(current, entry.name);
        if (!names.has(entry.name))
          await rm(target, {
            recursive: true,
            force: true,
            maxRetries: 3,
            retryDelay: 100,
          });
        else if (entry.isDirectory())
          await prune(target, path.join(expected, entry.name));
      }
    };
    await prune(destination, generated);
    process.stdout.write(
      `[mc] Built ${manifest.scenes.length} referenced structure(s).` + "\n"
    );
    return manifest;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
