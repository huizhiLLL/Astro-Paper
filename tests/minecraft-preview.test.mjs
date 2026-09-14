import path from "node:path";
import test from "node:test";
import {
  discoverScenePages,
  checkRendererModules,
  checkSceneResources,
} from "../scripts/mc-preview-checks.mjs";

// Discover the build's real routes instead of depending on a temporary article.
const origin = process.env.MC_PREVIEW_ORIGIN ?? "http://localhost:4321";
const pages = await discoverScenePages(path.resolve("dist"));

if (pages.length === 0) {
  test(
    "Minecraft page checks",
    { skip: "No published structure pages in this build" },
    () => {}
  );
}
for (const route of pages) {
  test(`Renderer modules: ${route}`, () =>
    checkRendererModules(origin, route, !!process.env.MC_PREVIEW_PRODUCTION));
  test(`Scene resources and fallback: ${route}`, () =>
    checkSceneResources(origin, route));
}
