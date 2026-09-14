import assert from "node:assert/strict";
import test from "node:test";

// Run against a live dev server, including while/after running the build checks.
const origin = process.env.MC_PREVIEW_ORIGIN ?? "http://localhost:4321";

test("Minecraft preview serves its renderer dependency graph", async () => {
  const visited = new Set();
  async function checkModule(url) {
    if (visited.has(url)) return;
    visited.add(url);
    const response = await fetch(url);
    assert.equal(response.status, 200, `${url}: ${response.statusText}`);
    assert.match(response.headers.get("content-type"), /javascript/);
    const source = await response.text();
    for (const match of source.matchAll(
      /\b(?:from\s*|import\s*)["']([^"']+)["']/g
    )) {
      await checkModule(new URL(match[1], url).href);
    }
  }
  await checkModule(new URL("/src/scripts/minecraft-scene.ts", origin).href);
  assert(visited.size >= 3, "Must check Three.js and OrbitControls imports");
});

test("Minecraft preview has visible fallback content before scripts load", async () => {
  const response = await fetch(new URL("/posts/mc-structure-preview", origin));
  assert.equal(response.status, 200);
  const html = await response.text();
  const marker = html.match(
    /<div[^>]*data-mc-scene="([^"]+)"[^>]*>([\s\S]*?)<\/div>/
  );
  assert(marker, "Article must contain a scene marker");
  const visible = marker[2].replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
  assert.match(visible, /<p[^>]*>[^<]+blocks<\/p>/);
  const scene = await fetch(new URL(marker[1], origin));
  assert.equal(scene.status, 200);
  const data = await scene.json();
  assert.equal(data.names?.["ae2:drive"], "ME驱动器");
  assert(data.blocks.length > 0);
  assert(
    data.models?.["ae2:molecular_assembler"],
    "Sample must include the assembler model"
  );
  const textureUrls = new Set(
    Object.values(data.resources).map(resource => resource.textureUrl)
  );
  for (const model of Object.values(data.models)) {
    for (const element of model.elements) {
      for (const face of Object.values(element.faces)) {
        textureUrls.add(face.textureUrl);
        if (face.emissiveUrl) textureUrls.add(face.emissiveUrl);
      }
    }
  }
  for (const url of textureUrls) {
    const texture = await fetch(new URL(url, origin));
    assert.equal(texture.status, 200);
    assert.match(texture.headers.get("content-type"), /image\/png/);
  }
});
