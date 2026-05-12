type MarkdownNode = {
  type?: string;
  url?: string;
  children?: MarkdownNode[];
};

const PUBLIC_ASSET_PREFIXES = ["blog-assets/"];

const isAbsoluteOrSpecialUrl = (url: string) =>
  url.startsWith("/") ||
  url.startsWith("#") ||
  url.startsWith("//") ||
  /^[a-z][a-z\d+.-]*:/i.test(url);

const normalizePublicAssetUrl = (url: string) => {
  if (isAbsoluteOrSpecialUrl(url)) return url;

  const normalizedUrl = url.startsWith("./") ? url.slice(2) : url;
  if (PUBLIC_ASSET_PREFIXES.some(prefix => normalizedUrl.startsWith(prefix))) {
    return `/${normalizedUrl}`;
  }

  return url;
};

const walk = (node: MarkdownNode) => {
  if (
    (node.type === "image" || node.type === "definition") &&
    typeof node.url === "string"
  ) {
    node.url = normalizePublicAssetUrl(node.url);
  }

  node.children?.forEach(walk);
};

export function remarkObsidianImagePaths() {
  return (tree: MarkdownNode) => {
    walk(tree);
  };
}
