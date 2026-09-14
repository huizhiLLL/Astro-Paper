import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { once } from "node:events";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  discoverScenePages,
  checkRendererModules,
  checkSceneResources,
} from "../scripts/mc-preview-checks.mjs";

const marker = url => `<div data-mc-scene="${url}"><p>结构说明</p></div>`;

test("discovery follows renamed/nested articles and accepts a site without scenes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mc-preview-pages-"));
  try {
    await assert.rejects(discoverScenePages(root), /No HTML build output/);
    await writeFile(path.join(root, "index.html"), "<html>普通首页</html>");
    assert.deepEqual(await discoverScenePages(root), []);
    const article = path.join(root, "posts/new-name/index.html");
    await mkdir(path.dirname(article), { recursive: true });
    await writeFile(article, marker("/scene.json"));
    assert.deepEqual(await discoverScenePages(root), ["/posts/new-name/"]);
    const renamed = path.join(root, "posts/改名/index.html");
    await mkdir(path.dirname(renamed), { recursive: true });
    await writeFile(renamed, marker("/scene.json"));
    await rm(article);
    assert.deepEqual(await discoverScenePages(root), [
      "/posts/%E6%94%B9%E5%90%8D/",
    ]);
    await rm(renamed);
    assert.deepEqual(await discoverScenePages(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("preview validates every scene and texture without assuming specific blocks or bundle names", async () => {
  const routes = new Map([
    [
      "/posts/new-name/",
      [
        "text/html",
        '<script type="module" src="/assets/renamed.js"></script>' +
          marker("/a.json") +
          marker("/b.json"),
      ],
    ],
    ["/assets/renamed.js", ["text/javascript", 'import "./renderer.js";']],
    [
      "/assets/renderer.js",
      [
        "text/javascript",
        'document.createElement("canvas").className="mc-scene-three";',
      ],
    ],
    [
      "/a.json",
      [
        "application/json",
        JSON.stringify({
          blocks: [{ id: "minecraft:stone" }],
          resources: { "minecraft:stone": { textureUrl: "/stone.png" } },
        }),
      ],
    ],
    [
      "/b.json",
      [
        "application/json",
        JSON.stringify({
          blocks: [{ id: "custom:block", model: "custom" }],
          models: {
            custom: {
              elements: [
                {
                  faces: {
                    north: {
                      textureUrl: "/base.png",
                      emissiveUrl: "/light.png",
                    },
                  },
                },
              ],
            },
          },
        }),
      ],
    ],
    ["/stone.png", ["image/png", "fixture"]],
    ["/base.png", ["image/png", "fixture"]],
    ["/light.png", ["image/png", "fixture"]],
  ]);
  const server = createServer((request, response) => {
    const entry = routes.get(request.url);
    if (!entry) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, { "content-type": entry[0] });
    response.end(entry[1]);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    await checkRendererModules(origin, "/posts/new-name/");
    assert.equal(await checkSceneResources(origin, "/posts/new-name/"), 2);
    routes.delete("/light.png");
    await assert.rejects(
      checkSceneResources(origin, "/posts/new-name/"),
      /light.png/
    );
    routes.set("/assets/renderer.js", ["text/javascript", "void 0;"]);
    await assert.rejects(
      checkRendererModules(origin, "/posts/new-name/"),
      /no renderer module/
    );
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
