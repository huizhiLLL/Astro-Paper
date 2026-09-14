import { fileURLToPath } from "node:url";
import { defineConfig, envField } from "astro/config";
import type { AstroIntegration } from "astro";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { remarkObsidianImagePaths } from "./src/utils/remarkObsidianImagePaths";
import { remarkMinecraftScenes } from "./src/utils/remarkMinecraftScenes";
import { SITE } from "./src/config";
import { buildMinecraftScenes } from "./src/utils/mc/build";

const minecraftScenes = (): AstroIntegration => ({
  name: "minecraft-scenes",
  hooks: {
    "astro:config:setup": async ({ config }) => {
      await buildMinecraftScenes(
        fileURLToPath(config.root),
        fileURLToPath(config.publicDir)
      );
    },
    "astro:server:setup": ({ server }) => {
      let timer: ReturnType<typeof setTimeout>;
      let pending = Promise.resolve();
      const root = server.config.root;
      const changed = (file: string) => {
        const normalized = file.replaceAll("\\", "/");
        if (
          !normalized.includes("/src/data/blog/") &&
          !normalized.includes("/src/data/mc/")
        )
          return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          pending = pending.then(async () => {
            try {
              await buildMinecraftScenes(root, server.config.publicDir);
              server.ws.send({ type: "full-reload" });
            } catch (error) {
              server.config.logger.error(String(error));
            }
          });
        }, 200);
      };
      server.watcher
        .on("add", changed)
        .on("change", changed)
        .on("unlink", changed);
      server.httpServer?.once("close", () => {
        clearTimeout(timer);
        server.watcher
          .off("add", changed)
          .off("change", changed)
          .off("unlink", changed);
      });
    },
  },
});

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  integrations: [
    {
      name: "isolated-vite-cache",
      hooks: {
        "astro:config:setup": ({ command, config, updateConfig }) => {
          // Checks/builds must not invalidate a running dev server's dependencies.
          updateConfig({
            vite: {
              cacheDir: fileURLToPath(
                new URL(`./node_modules/.vite/${command}/`, config.root)
              ),
            },
          });
        },
      },
    },
    minecraftScenes(),
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
    }),
  ],
  markdown: {
    remarkPlugins: [
      remarkObsidianImagePaths,
      remarkMinecraftScenes,
      remarkToc,
      [remarkCollapse, { test: "Table of contents" }],
    ],
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    // eslint-disable-next-line
    // @ts-ignore
    // This will be fixed in Astro 6 with Vite 7 support
    // See: https://github.com/withastro/astro/issues/14030
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    preserveScriptOrder: true,
  },
});
