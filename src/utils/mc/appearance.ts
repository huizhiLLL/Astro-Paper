import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export type FaceName = "east" | "west" | "up" | "down" | "south" | "north";
export type ModelFace = {
  textureUrl: string;
  emissiveUrl?: string;
  cutout?: boolean;
  uv: [number, number, number, number];
  rotation?: number;
};
export type BlockModel = {
  rotation?: [number, number];
  elements: Array<{
    from: [number, number, number];
    to: [number, number, number];
    faces: Partial<Record<FaceName, ModelFace>>;
  }>;
};
type PositionedBlock = { id: string; pos: [number, number, number] };
export type ControllerType =
  | "block"
  | "column_x"
  | "column_y"
  | "column_z"
  | "inside_a"
  | "inside_b";

// AE2 19.2.17 ControllerBlock#getControllerType: a column needs both neighbors.
export function controllerType(
  pos: [number, number, number],
  controllers: Set<string>
): ControllerType {
  const axes = pos.map((_, axis) =>
    [-1, 1].every(delta => {
      const neighbor = [...pos];
      neighbor[axis] += delta;
      return controllers.has(neighbor.join(","));
    })
  );
  const count = axes.filter(Boolean).length;
  if (count >= 2)
    return pos.reduce((sum, value) => sum + Math.abs(value), 0) % 2 === 0
      ? "inside_a"
      : "inside_b";
  if (count === 1)
    return (["column_x", "column_y", "column_z"] as const)[axes.indexOf(true)];
  return "block";
}

const faceNames: FaceName[] = ["east", "west", "up", "down", "south", "north"];

export async function prepareAppearances(
  blocks: PositionedBlock[],
  resourceRoot: string,
  publicDir: string
) {
  const models: Record<string, BlockModel> = {};
  const controllers = new Set(
    blocks
      .filter(block => block.id === "ae2:controller")
      .map(block => block.pos.join(","))
  );
  const modelKeys = blocks.map(block =>
    block.id === "ae2:controller"
      ? `ae2:controller/${controllerType(block.pos, controllers)}`
      : block.id === "ae2:molecular_assembler" || block.id === "ae2:drive"
        ? block.id
        : undefined
  );
  const textureDir = path.join(resourceRoot, "assets/ae2/textures/block");
  const outputDir = path.join(publicDir, "mc-generated/ae2");
  await mkdir(outputDir, { recursive: true });
  const outputUrl = (name: string) => `/mc-generated/ae2/${name}.png`;
  const prepared = new Set<string>();

  for (const key of new Set(modelKeys)) {
    if (!key) continue;
    if (key === "ae2:molecular_assembler" || key === "ae2:drive") {
      const isDrive = key === "ae2:drive";
      const raw = JSON.parse(
        await readFile(
          path.join(
            resourceRoot,
            isDrive
              ? "assets/ae2/models/block/drive/drive_base.json"
              : "assets/ae2/models/block/molecular_assembler.json"
          ),
          "utf8"
        )
      );
      const textureUrls: Record<string, string> = {};
      if (isDrive) {
        for (const [alias, texture] of Object.entries(raw.textures) as [
          string,
          string,
        ][]) {
          const asset = texture.replace(/^ae2:block\//, "");
          const name = asset.replaceAll("/", "-");
          await copyFile(
            path.join(textureDir, `${asset}.png`),
            path.join(outputDir, `${name}.png`)
          );
          textureUrls[`#${alias}`] = outputUrl(name);
        }
      }
      models[key] = {
        elements: raw.elements.map(
          (element: {
            from: [number, number, number];
            to: [number, number, number];
            rotation?: { angle: number };
            faces: Partial<
              Record<
                FaceName,
                { uv: ModelFace["uv"]; rotation?: number; texture: string }
              >
            >;
          }) => {
            if (element.rotation?.angle)
              throw new Error(`Unsupported element rotation in ${key}`);
            return {
              from: element.from,
              to: element.to,
              faces: Object.fromEntries(
                Object.entries(element.faces).map(([face, value]) => [
                  face,
                  {
                    textureUrl: isDrive
                      ? textureUrls[value.texture]
                      : "/mc-generated/textures/ae2-molecular_assembler.png",
                    cutout: !isDrive,
                    uv: value.uv,
                    rotation: value.rotation,
                  },
                ])
              ),
            };
          }
        ),
      };
      continue;
    }
    const type = key.split("/")[1] as ControllerType;
    const stem = type.startsWith("column_")
      ? "controller_column"
      : type.startsWith("inside_")
        ? `controller_${type}`
        : "controller";
    const inside = type.startsWith("inside_");
    if (!prepared.has(stem)) {
      if (inside) {
        await copyFile(
          path.join(textureDir, `${stem}.png`),
          path.join(outputDir, `${stem}.png`)
        );
      } else {
        // Use a static online frame, not network simulation or a bloom effect.
        const lights = await sharp(path.join(textureDir, `${stem}_lights.png`))
          .extract({ left: 0, top: 0, width: 16, height: 16 })
          .png()
          .toBuffer();
        const base = await readFile(
          path.join(textureDir, `${stem}_powered.png`)
        );
        // Bake complementary layers into one surface to avoid coplanar z-fighting.
        await sharp(lights)
          .composite([{ input: base }])
          .png()
          .toFile(path.join(outputDir, `${stem}.png`));
        await sharp({
          create: { width: 16, height: 16, channels: 4, background: "black" },
        })
          .composite([{ input: lights }])
          .png()
          .toFile(path.join(outputDir, `${stem}_emissive.png`));
      }
      prepared.add(stem);
    }
    const face: ModelFace = {
      textureUrl: outputUrl(stem),
      ...(!inside ? { emissiveUrl: outputUrl(`${stem}_emissive`) } : {}),
      uv: [0, 0, 16, 16],
    };
    models[key] = {
      ...(type === "column_x"
        ? { rotation: [90, 90] as [number, number] }
        : type === "column_z"
          ? { rotation: [90, 0] as [number, number] }
          : {}),
      elements: [
        {
          from: [0, 0, 0],
          to: [16, 16, 16],
          faces: Object.fromEntries(faceNames.map(name => [name, face])),
        },
      ],
    };
  }
  return { models, modelKeys };
}
