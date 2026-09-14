import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import * as THREE from "three";
import { prepareAppearances } from "../src/utils/mc/appearance.ts";
import { createMinecraftModel } from "../src/scripts/minecraft-model.ts";

test("drive uses separate housing textures and ten recessed empty slots", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "ae2-drive-test-"));
  const materials = new Map();
  let object;
  try {
    const { models, modelKeys } = await prepareAppearances(
      [{ id: "ae2:drive", pos: [0, 0, 0] }],
      path.resolve("src/data/mc/resources"),
      output
    );
    assert.equal(modelKeys[0], "ae2:drive");
    const model = models[modelKeys[0]];
    object = createMinecraftModel(model, face => {
      if (!materials.has(face.textureUrl))
        materials.set(face.textureUrl, new THREE.MeshBasicMaterial());
      const material = materials.get(face.textureUrl);
      material.name = face.textureUrl;
      return material;
    });
    object.updateMatrixWorld(true);
    const hit = (origin, direction) =>
      new THREE.Raycaster(
        new THREE.Vector3(...origin),
        new THREE.Vector3(...direction)
      ).intersectObject(object, true)[0];
    assert.match(
      hit([0, 2, 0], [0, -1, 0]).object.material.name,
      /generics-top/
    );
    assert.match(
      hit([2, 0, 0], [-1, 0, 0]).object.material.name,
      /generics-side/
    );
    assert.match(
      hit([0, 0, 2], [0, 0, -1]).object.material.name,
      /generics-back/
    );
    assert.match(
      hit([0, -2, 0], [0, 1, 0]).object.material.name,
      /generics-bottom/
    );
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 2; col++) {
        const slot = hit(
          [(12 - col * 8) / 16 - 0.5, (14 - row * 3) / 16 - 0.5, -2],
          [0, 0, 1]
        );
        assert(slot, "Slot must have a back wall");
        assert(
          slot.distance > 1.8,
          "Slot must be recessed rather than a flat front texture"
        );
        assert.match(slot.object.material.name, /drive_front/);
      }
    assert(
      Math.abs(hit([0.47, 0, -2], [0, 0, 1]).distance - 1.5) < 1e-6,
      "Housing extends to front edge"
    );
    for (const url of materials.keys())
      assert((await readFile(path.join(output, url))).length > 0);
  } finally {
    object?.traverse(child => child.geometry?.dispose());
    for (const material of materials.values()) material.dispose();
    await rm(output, { recursive: true, force: true });
  }
});
