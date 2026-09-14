import assert from "node:assert/strict";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import test from "node:test";
import {
  collectStructureReferences,
  structureReference,
} from "../src/utils/mc/references.ts";
import { buildMinecraftScenes } from "../src/utils/mc/build.ts";
import { prepareResource } from "../src/utils/mc/resources.ts";

test("references use Markdown structure, support nested fences and canonical aliases", () => {
  const markdown =
    "---\ntitle: Example\n---\n\n> ```mc-structure\n> src: mc/example.nbt\n> ```\n\n````md\n```mc-structure\nsrc: mc/ignored.nbt\n```\n````\n";
  const references = collectStructureReferences(markdown);
  assert.equal(references.length, 1);
  assert.equal(references[0].source, "mc/structures/example.nbt");
  assert.equal(
    references[0].id,
    structureReference("src: mc/structures/example.nbt").id
  );
  for (const source of [
    "mc/../x.nbt",
    "mc/a/../../x.nbt",
    "mc/./x.nbt",
    "mc/a\\x.nbt",
    "mc//x.nbt",
    "https://x.nbt",
  ])
    assert.throws(() => structureReference(`src: ${source}`));
});

test("build deduplicates article references, ignores unreferenced NBT and preserves output on failure", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mc-reference-build-"));
  const blog = path.join(root, "src/data/blog"),
    structures = path.join(root, "src/data/mc/structures");
  const publicDir = path.join(root, "public"),
    resources = path.resolve("src/data/mc/resources");
  try {
    await mkdir(blog, { recursive: true });
    await mkdir(structures, { recursive: true });
    await copyFile(
      "src/data/mc/structures/test.nbt",
      path.join(structures, "example.nbt")
    );
    await writeFile(path.join(structures, "unused.nbt"), "invalid unused NBT");
    await writeFile(
      path.join(blog, "a.md"),
      "```mc-structure\nsrc: mc/example.nbt\n```\n"
    );
    await writeFile(
      path.join(blog, "b.md"),
      "```mc-structure\nsrc: mc/structures/example.nbt\n```\n"
    );
    const manifest = await buildMinecraftScenes(root, publicDir, resources);
    assert.equal(manifest.scenes.length, 1);
    assert.equal(manifest.scenes[0].articles.length, 2);
    assert(
      manifest.scenes[0].dependencies.includes(
        "assets/ae2/models/block/drive/drive_base.json"
      )
    );
    const before = await readFile(
      path.join(publicDir, "mc-generated/manifest.json"),
      "utf8"
    );
    await writeFile(
      path.join(blog, "missing.md"),
      "```mc-structure\nsrc: mc/missing.nbt\n```\n"
    );
    await assert.rejects(
      buildMinecraftScenes(root, publicDir, resources),
      /missing.md:1.*missing.nbt/
    );
    assert.equal(
      await readFile(
        path.join(publicDir, "mc-generated/manifest.json"),
        "utf8"
      ),
      before
    );
    await rm(path.join(blog, "missing.md"));
    await rm(path.join(blog, "a.md"));
    await rm(path.join(blog, "b.md"));
    assert.equal(
      (await buildMinecraftScenes(root, publicDir, resources)).scenes.length,
      0
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("missing adapted resources fail without consulting a local Minecraft installation", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mc-no-fallback-"));
  try {
    await assert.rejects(
      prepareResource("ae2:controller", root, root),
      /Missing repository texture/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
