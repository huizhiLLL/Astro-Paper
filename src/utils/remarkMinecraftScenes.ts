import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  structureReference,
  visitStructures,
  type MarkdownNode,
} from "./mc/references.ts";

export function remarkMinecraftScenes() {
  return async (tree: MarkdownNode, file: { cwd?: string }) => {
    const nodes: MarkdownNode[] = [];
    visitStructures(tree, node => nodes.push(node));
    for (const node of nodes) {
      const reference = structureReference(node.value ?? "");
      const generated = path.join(
        file.cwd ?? process.cwd(),
        "public/mc-generated",
        reference.id,
        "scene.json"
      );
      let scene;
      try {
        scene = JSON.parse(await readFile(generated, "utf8"));
      } catch {
        throw new Error(
          `Scene was not prepared by the Minecraft integration: ${reference.source}`
        );
      }
      const caption = reference.caption
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
      node.type = "html";
      node.value = `<div class="mc-scene-viewer" data-mc-scene="${reference.sceneUrl}" data-mc-caption="${caption}" data-mc-size="${scene.size.join("x")}"><p class="mc-scene-fallback">${caption}: ${scene.size.join(" x ")} blocks</p></div>`;
      delete node.lang;
    }
  };
}
