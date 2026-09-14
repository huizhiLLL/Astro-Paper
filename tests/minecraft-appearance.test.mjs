import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import * as THREE from "three";
import sharp from "sharp";
import {
  controllerType,
  prepareAppearances,
} from "../src/utils/mc/appearance.ts";
import { createMinecraftModel } from "../src/scripts/minecraft-model.ts";
import { prepareResource } from "../src/utils/mc/resources.ts";

const resourceRoot = path.resolve("src/data/mc/resources");
const output = await mkdtemp(path.join(os.tmpdir(), "ae2-appearance-test-"));
after(() => rm(output, { recursive: true, force: true }));
const controller = pos => ({ id: "ae2:controller", pos });
const neighbors = positions => new Set(positions.map(pos => pos.join(",")));

test("controller ends/corners stay blocks; only opposite pairs create columns", () => {
  assert.equal(controllerType([0, 0, 0], new Set()), "block");
  assert.equal(controllerType([0, 0, 0], neighbors([[1, 0, 0]])), "block");
  assert.equal(
    controllerType(
      [0, 0, 0],
      neighbors([
        [1, 0, 0],
        [0, 1, 0],
      ])
    ),
    "block"
  );
  for (let axis = 0; axis < 3; axis++) {
    const pair = [-1, 1].map(sign =>
      [0, 1, 2].map(i => (i === axis ? sign : 0))
    );
    assert.equal(
      controllerType([0, 0, 0], neighbors(pair)),
      ["column_x", "column_y", "column_z"][axis]
    );
  }
  assert.equal(
    controllerType(
      [0, 0, 0],
      neighbors([
        [-1, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ])
    ),
    "column_x"
  );
});

test("intersections alternate inside textures using AE2 coordinate parity", () => {
  for (const pos of [
    [0, 0, 0],
    [1, 0, 0],
    [-1, 0, 0],
  ]) {
    const surrounding = [
      [-1, 0, 0],
      [1, 0, 0],
      [0, -1, 0],
      [0, 1, 0],
    ].map(delta => delta.map((value, i) => value + pos[i]));
    assert.equal(
      controllerType(pos, neighbors(surrounding)),
      pos[0] === 0 ? "inside_a" : "inside_b"
    );
  }
});

test("only controller neighbors affect material selection", async () => {
  const { modelKeys } = await prepareAppearances(
    [
      controller([0, 0, 0]),
      controller([1, 0, 0]),
      { id: "minecraft:stone", pos: [-1, 0, 0] },
    ],
    resourceRoot,
    output
  );
  assert.deepEqual(modelKeys, [
    "ae2:controller/block",
    "ae2:controller/block",
    undefined,
  ]);
});

test("online controllers have an opaque surface and a separate masked light map", async () => {
  const { models } = await prepareAppearances(
    [controller([-1, 0, 0]), controller([0, 0, 0]), controller([1, 0, 0])],
    resourceRoot,
    output
  );
  for (const model of Object.values(models)) {
    assert.equal(model.elements.length, 1, "No coplanar light overlay");
    const face = model.elements[0].faces.north;
    assert(face.emissiveUrl);
    const base = await sharp(path.join(output, face.textureUrl))
      .ensureAlpha()
      .raw()
      .toBuffer();
    const emission = await sharp(path.join(output, face.emissiveUrl))
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(
      base.length,
      16 * 16 * 4,
      "Animation sheet must be cropped to one frame"
    );
    for (let i = 3; i < base.length; i += 4) assert.equal(base[i], 255);
    const rgb = Array.from(
      { length: 256 },
      (_, i) => emission[i * 4] + emission[i * 4 + 1] + emission[i * 4 + 2]
    );
    assert(
      rgb.some(value => value > 0),
      "Lamp pixels emit light"
    );
    assert(
      rgb.some(value => value === 0),
      "Housing does not emit light"
    );
  }
});

test("column model rotations map the original Y axis onto X/Y/Z", async () => {
  for (let axis = 0; axis < 3; axis++) {
    const blocks = [-1, 0, 1].map(sign =>
      controller([0, 1, 2].map(i => (i === axis ? sign : 0)))
    );
    const { models, modelKeys } = await prepareAppearances(
      blocks,
      resourceRoot,
      output
    );
    const material = new THREE.MeshBasicMaterial();
    const object = createMinecraftModel(models[modelKeys[1]], () => material);
    const direction = new THREE.Vector3(0, 1, 0)
      .applyEuler(object.rotation)
      .toArray();
    assert(Math.abs(Math.abs(direction[axis]) - 1) < 1e-6);
    object.traverse(child => child.geometry?.dispose());
    material.dispose();
  }
});

test("assembler preserves the frame and has alpha-cutout sight lines through its core", async () => {
  const { models } = await prepareAppearances(
    [{ id: "ae2:molecular_assembler", pos: [0, 0, 0] }],
    resourceRoot,
    output
  );
  const model = models["ae2:molecular_assembler"];
  assert.equal(model.elements.length, 13);
  assert(Object.values(model.elements[0].faces).every(face => face.cutout));
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const object = createMinecraftModel(model, () => material);
  object.updateMatrixWorld(true);
  const { data, info } = await sharp(
    path.join(resourceRoot, "assets/ae2/textures/block/molecular_assembler.png")
  )
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  function opaqueHits(x, y) {
    const ray = new THREE.Raycaster(
      new THREE.Vector3(x, y, 2),
      new THREE.Vector3(0, 0, -1)
    );
    return ray.intersectObject(object, true).filter(hit => {
      const px = Math.min(
        info.width - 1,
        Math.max(0, Math.floor(hit.uv.x * info.width))
      );
      const py = Math.min(
        info.height - 1,
        Math.max(0, Math.floor((1 - hit.uv.y) * info.height))
      );
      return data[(py * info.width + px) * 4 + 3] >= 128;
    });
  }
  assert.equal(opaqueHits(0, 0).length, 0, "Can see through the middle");
  assert(
    opaqueHits(0.45, 0.45).length > 0,
    "Frame still occludes objects behind it"
  );
  assert.equal(
    object.children.length,
    1,
    "Batch shared material into one mesh"
  );
  object.traverse(child => child.geometry?.dispose());
  material.dispose();
});

test("recreating generated assets does not leave cached paths pointing at deleted files", async () => {
  const blocks = [controller([0, 0, 0])];
  await prepareAppearances(blocks, resourceRoot, output);
  await rm(path.join(output, "mc-generated"), { recursive: true, force: true });
  const { models } = await prepareAppearances(blocks, resourceRoot, output);
  const face = models["ae2:controller/block"].elements[0].faces.north;
  assert((await readFile(path.join(output, face.textureUrl))).length > 0);
});

test("base textures are recopied after the generated directory is rebuilt", async () => {
  const project = path.join(output, "project");
  const fixedTextures = path.join(
    project,
    "src/data/mc/resources/assets/ae2/textures/block"
  );
  await mkdir(fixedTextures, { recursive: true });
  await copyFile(
    path.join(
      resourceRoot,
      "assets/ae2/textures/block/molecular_assembler.png"
    ),
    path.join(fixedTextures, "molecular_assembler.png")
  );
  const publicDir = path.join(project, "public");
  const first = await prepareResource("ae2:molecular_assembler", publicDir);
  await rm(path.join(publicDir, "mc-generated"), {
    recursive: true,
    force: true,
  });
  const second = await prepareResource("ae2:molecular_assembler", publicDir);
  assert.equal(first.textureUrl, second.textureUrl);
  assert((await readFile(path.join(publicDir, second.textureUrl))).length > 0);
});

test("baked cube faces have outward normals on all six sides", async () => {
  const { models } = await prepareAppearances(
    [controller([0, 0, 0])],
    resourceRoot,
    output
  );
  const material = new THREE.MeshBasicMaterial();
  const object = createMinecraftModel(
    models["ae2:controller/block"],
    () => material
  );
  object.updateMatrixWorld(true);
  for (const axis of [0, 1, 2])
    for (const sign of [-1, 1]) {
      const normal = new THREE.Vector3().setComponent(axis, sign);
      const ray = new THREE.Raycaster(
        normal.clone().multiplyScalar(2),
        normal.clone().negate()
      );
      const hit = ray.intersectObject(object, true)[0];
      assert(hit, "Face must be visible from outside");
      assert(Math.abs(hit.distance - 1.5) < 1e-6);
      assert(hit.face.normal.dot(normal) > 0.99);
    }
  object.traverse(child => child.geometry?.dispose());
  material.dispose();
});
