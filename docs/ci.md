# CI 与内容同步

开发、GitHub Actions 和 Cloudflare Pages 使用 Node.js 24、pnpm 9.15.9；版本由 `.node-version` 与 `package.json` 固定。

## Obsidian → 博客仓库

Obsidian 仓库的 `.github/workflows/sync-astro-paper.yml` 在 `Blog/Note/**` 或同步脚本/workflow 变更时触发，也支持手动运行。流程检出两个仓库、验证同步脚本、增量复制内容、安装依赖并构建博客；构建成功后才向 Astro-Paper 推送。

| Obsidian 来源            | 博客目标                  | 规则                               |
| ------------------------ | ------------------------- | ---------------------------------- |
| `Blog/Note/**/*.md`      | `src/data/blog/`          | 排除根目录的 `mc/`、`blog-assets/` |
| `Blog/Note/blog-assets/` | `public/blog-assets/`     | 保留子目录与文件名                 |
| `Blog/Note/mc/**/*.nbt`  | `src/data/mc/structures/` | 只同步 NBT，保留子目录             |

同步按字节比较，只更新新增/变化文件；不会删除目标端文件、不会整体覆盖 `src/data/`、不会修改固定资源库。源文件删除或改名后，需要在博客仓库单独删除旧文件。同步不再强制提交 Pagefind 或 Minecraft 构建产物。

文章引用示例：

````md
```mc-structure
src: mc/ae2/network.nbt
caption: AE2 网络
```
````

对应 Obsidian 的 `Blog/Note/mc/ae2/network.nbt` 和博客的 `src/data/mc/structures/ae2/network.nbt`。旧引用 `mc/structures/...` 仍兼容。

## 博客 CI

`.github/workflows/ci.yml` 在 main 推送、PR 或手动触发时执行：

1. 安装 Node.js 24、pnpm 9.15.9，按 lockfile 安装依赖。
2. `pnpm resources:check`：验证固定资源逐文件哈希。
3. `pnpm lint`、`pnpm format:check`：验证工程代码；原始资产与同步文章不参与 Prettier 重排。
4. `pnpm test`：模型、拾取、NBT/引用与资源构建测试。
5. `pnpm build`：Astro 检查和静态构建、Pagefind 索引。
6. `pnpm test:preview`：启动 `astro preview` 服务，以 HTTP 验证 `dist/` 的页面模块、场景、纹理与降级内容，随后关闭服务器；不使用浏览器自动化。
7. 上传 `dist/` 为保留 7 天的 Actions artifact。

Cloudflare Pages 继续通过仓库 Git 集成部署，输出目录为 `dist`，构建命令应为 `pnpm build`。GitHub CI 与 Cloudflare 是独立触发；本 workflow 不保证 Cloudflare 等待 CI，通过分支保护/部署策略才可建立发布门禁。后台构建设置不由仓库 workflow 自动修改。

## 资源与生成物

- `src/data/mc/structures/`：原始 NBT。
- `src/data/mc/resources/assets/`：固定版本原始资源，提交仓库。
- `src/data/mc/resources/manifest.json`：导入版本和逐文件校验值，提交仓库。
- `public/mc-generated/`：按文章引用生成的场景、渲染纹理、依赖清单，忽略 Git，不手动维护。
- `dist/`：部署结果，包含场景与搜索索引。

资源已覆盖固定版本的渲染素材；这不代表自动还原所有模型。控制器、分子装配室、驱动器为定向适配，其他方块采用基础纹理立方体或明确警告的占位显示。引用到的资源依赖缺失会报错，不从本机补齐。

更新资源时显式执行 `scripts/import-mc-resources.ps1`，提供三个固定版本包路径和原版 assets 目录，再运行 `pnpm resources:check`。日常文章同步与构建不需要安装 Minecraft、Java 或 mod jar。导入顺序为原版 → Create → AE2，原始资产的哈希与来源随提交保存。
