import * as THREE from "three";
import type { BlockModel, FaceName, ModelFace } from "../utils/mc/appearance";

/** Bake the supported axis-aligned Minecraft elements, retaining per-face UVs. */
export function createMinecraftModel(
  model: BlockModel,
  materialForFace: (face: ModelFace) => THREE.Material
) {
  const batches = new Map<
    THREE.Material,
    { positions: number[]; uvs: number[] }
  >();
  for (const element of model.elements) {
    const [x0, y0, z0] = element.from.map(value => value / 16 - 0.5);
    const [x1, y1, z1] = element.to.map(value => value / 16 - 0.5);
    const corners: Record<FaceName, number[][]> = {
      east: [
        [x1, y1, z1],
        [x1, y1, z0],
        [x1, y0, z1],
        [x1, y0, z0],
      ],
      west: [
        [x0, y1, z0],
        [x0, y1, z1],
        [x0, y0, z0],
        [x0, y0, z1],
      ],
      up: [
        [x0, y1, z0],
        [x1, y1, z0],
        [x0, y1, z1],
        [x1, y1, z1],
      ],
      down: [
        [x0, y0, z1],
        [x1, y0, z1],
        [x0, y0, z0],
        [x1, y0, z0],
      ],
      south: [
        [x0, y1, z1],
        [x1, y1, z1],
        [x0, y0, z1],
        [x1, y0, z1],
      ],
      north: [
        [x1, y1, z0],
        [x0, y1, z0],
        [x1, y0, z0],
        [x0, y0, z0],
      ],
    };
    for (const [name, face] of Object.entries(element.faces)) {
      const material = materialForFace(face);
      let batch = batches.get(material);
      if (!batch) {
        batch = { positions: [], uvs: [] };
        batches.set(material, batch);
      }
      const [u0, v0, u1, v1] = face.uv;
      const uv = [
        [u0 / 16, 1 - v0 / 16],
        [u1 / 16, 1 - v0 / 16],
        [u1 / 16, 1 - v1 / 16],
        [u0 / 16, 1 - v1 / 16],
      ];
      const turns = (face.rotation ?? 0) / 90;
      for (const index of [0, 2, 1, 2, 3, 1]) {
        batch.positions.push(...corners[name as FaceName][index]);
        const corner = [0, 1, 3, 2][index];
        batch.uvs.push(...uv[(corner - turns + 4) % 4]);
      }
    }
  }
  const group = new THREE.Group();
  for (const [material, batch] of batches) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(batch.positions, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(batch.uvs, 2));
    geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry, material));
  }
  const [x, y] = model.rotation ?? [0, 0];
  group.rotation.set(
    -THREE.MathUtils.degToRad(x),
    -THREE.MathUtils.degToRad(y),
    0,
    "YXZ"
  );
  return group;
}
