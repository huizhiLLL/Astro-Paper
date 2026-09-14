import { createHash } from "node:crypto";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";

export type MarkdownNode = {
  type: string;
  lang?: string | null;
  value?: string;
  children?: MarkdownNode[];
  position?: { start: { line: number } };
};
export function structureReference(value: string) {
  const options = Object.fromEntries(
    value.split(/\r?\n/).flatMap(line => {
      const colon = line.indexOf(":");
      return colon < 0
        ? []
        : [[line.slice(0, colon).trim(), line.slice(colon + 1).trim()]];
    })
  );
  const input = options.src;
  if (
    !input ||
    !/^mc\/.+\.nbt$/i.test(input) ||
    input.includes("\\") ||
    input.includes(":") ||
    input.split("/").some(part => part === ".." || part === "." || !part)
  )
    throw new Error(`Invalid mc-structure src: ${input ?? "(missing)"}`);
  const source = input.startsWith("mc/structures/")
    ? input
    : `mc/structures/${input.slice(3)}`;
  const id = createHash("sha256").update(source).digest("hex").slice(0, 16);
  return {
    source,
    id,
    sceneUrl: `/mc-generated/${id}/scene.json`,
    caption: options.caption ?? input,
  };
}
export function visitStructures(
  tree: MarkdownNode,
  visit: (node: MarkdownNode) => void
) {
  if (tree.type === "code" && tree.lang === "mc-structure") visit(tree);
  for (const child of tree.children ?? []) visitStructures(child, visit);
}
export function collectStructureReferences(markdown: string) {
  const tree = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .parse(markdown);
  const references: Array<
    ReturnType<typeof structureReference> & { line: number }
  > = [];
  visitStructures(tree as MarkdownNode, node => {
    references.push({
      ...structureReference(node.value ?? ""),
      line: node.position?.start.line ?? 1,
    });
  });
  return references;
}
