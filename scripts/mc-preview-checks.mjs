import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export async function discoverScenePages(directory) {
  const pages = [];
  let htmlCount = 0;
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile() && entry.name.endsWith(".html")) {
        htmlCount++;
        const html = await readFile(file, "utf8");
        if (!/<div\b[^>]*\bdata-mc-scene=/.test(html)) continue;
        const relative = path
          .relative(directory, file)
          .split(path.sep)
          .map(encodeURIComponent)
          .join("/");
        const route = `/${relative}`.replace(/index\.html$/, "");
        pages.push(route);
      }
    }
  }
  await walk(directory);
  assert(htmlCount > 0, "No HTML build output found; run pnpm build first");
  return pages.sort();
}

export async function checkRendererModules(origin, route, production = true) {
  const visited = new Set();
  let rendererFound = false;
  async function checkModule(url) {
    if (visited.has(url)) return;
    visited.add(url);
    const response = await fetch(url);
    assert.equal(response.status, 200, `${url}: ${response.statusText}`);
    assert.match(response.headers.get("content-type") ?? "", /javascript/);
    const source = await response.text();
    rendererFound ||= source.includes("mc-scene-three");
    for (const match of source.matchAll(
      /\b(?:from\s*|import\s*)["']([^"']+)["']/g
    )) {
      const dependency = new URL(match[1], url);
      if (dependency.origin === new URL(origin).origin)
        await checkModule(dependency.href);
    }
  }
  const pageUrl = new URL(route, origin);
  const page = await fetch(pageUrl);
  assert.equal(page.status, 200, `${route}: ${page.statusText}`);
  if (production) {
    const html = await page.text();
    for (const match of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)) {
      const script = new URL(match[1], pageUrl);
      if (script.origin === pageUrl.origin) await checkModule(script.href);
    }
  } else {
    await checkModule(new URL("/src/scripts/minecraft-scene.ts", origin).href);
  }
  assert(
    rendererFound,
    `${route}: no renderer module found in the served module graph`
  );
}

export async function checkSceneResources(origin, route) {
  const response = await fetch(new URL(route, origin));
  assert.equal(response.status, 200, `${route}: ${response.statusText}`);
  const html = await response.text();
  const markers = [
    ...html.matchAll(
      /<div[^>]*data-mc-scene="([^"]+)"[^>]*>([\s\S]*?)<\/div>/g
    ),
  ];
  assert(markers.length > 0, `${route}: expected a scene marker`);
  const textureUrls = new Set();
  for (const marker of markers) {
    const visible = marker[2]
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    assert(visible, `${route}: scene has no visible fallback text`);
    const sceneUrl = new URL(marker[1], origin);
    const scene = await fetch(sceneUrl);
    assert.equal(
      scene.status,
      200,
      `${route} -> ${sceneUrl}: ${scene.statusText}`
    );
    const data = await scene.json();
    assert(
      Array.isArray(data.blocks) && data.blocks.length > 0,
      `${sceneUrl}: empty or invalid blocks`
    );
    for (const block of data.blocks) {
      if (block.model)
        assert(
          data.models?.[block.model],
          `${sceneUrl}: missing model ${block.model}`
        );
    }
    const addTexture = url => {
      if (url === undefined) return; // Unsupported blocks can intentionally use untextured placeholders.
      assert(
        typeof url === "string" && url.length > 0,
        `${sceneUrl}: invalid texture URL`
      );
      textureUrls.add(new URL(url, sceneUrl).href);
    };
    for (const resource of Object.values(data.resources ?? {}))
      addTexture(resource.textureUrl);
    for (const model of Object.values(data.models ?? {})) {
      for (const element of model.elements) {
        for (const face of Object.values(element.faces)) {
          addTexture(face.textureUrl);
          addTexture(face.emissiveUrl);
        }
      }
    }
  }
  for (const url of textureUrls) {
    const texture = await fetch(url);
    assert.equal(
      texture.status,
      200,
      `${route} -> ${url}: ${texture.statusText}`
    );
    assert.match(texture.headers.get("content-type") ?? "", /^image\//);
  }
  return markers.length;
}
