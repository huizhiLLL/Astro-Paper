import path from "node:path";
import { buildScene } from "./mc/scene.ts";
const parseOptions = (value: string) =>
  Object.fromEntries(
    value.split(/\r?\n/).flatMap(line => {
      const separator = line.indexOf(":");
      return separator === -1
        ? []
        : [[line.slice(0, separator).trim(), line.slice(separator + 1).trim()]];
    })
  );
export function remarkMinecraftScenes() {
  return async (tree: { children: unknown[] }, file: { cwd?: string }) => {
    const root = file.cwd ?? process.cwd();
    const children = tree.children as Array<{
      type: string;
      lang?: string | null;
      value?: string;
      [key: string]: unknown;
    }>;
    for (let index = 0; index < children.length; index += 1) {
      const node = children[index];
      if (node.type !== "code" || node.lang !== "mc-structure") continue;
      const options = parseOptions(node.value ?? "") as Record<string, string>;
      if (!options.src) throw new Error("mc-structure requires a src field");
      if (!options.src.startsWith("mc/") || options.src.includes(".."))
        throw new Error("Invalid Minecraft structure path: " + options.src);
      let result;
      try {
        result = await buildScene(
          path.resolve(root, "src/data/mc", options.src.slice(3)),
          options.src,
          path.join(root, "public")
        );
      } catch (error) {
        throw new Error(
          "Failed to build " +
            options.src +
            ": " +
            (error instanceof Error ? error.message : String(error))
        );
      }
      const caption = options.caption ?? options.src;
      const safeCaption = caption
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
      children[index] = {
        type: "html",
        value:
          '<div class="mc-scene-viewer" data-mc-scene="' +
          result.sceneUrl +
          '" data-mc-caption="' +
          safeCaption +
          '" data-mc-size="' +
          result.scene.size.join("x") +
          '"><p class="mc-scene-fallback">' +
          safeCaption +
          ": " +
          result.scene.size.join(" x ") +
          " blocks</p></div>",
      };
    }
  };
}
