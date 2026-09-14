# 项目说明

> 更新日期：2026-09-14

## 1. 项目定位

`huizhi's Aside` 是一个基于 [AstroPaper](https://github.com/satnaing/astro-paper) 二次修改的个人博客站点，线上地址为 `https://blog.huizhi.ink/`。

项目有两个并行目标：

1. 持续积累个人文章，记录技术实践、工具使用、兴趣项目、学习笔记和生活随笔。
2. 为后续的创意性内容表达保留空间，在稳定博客写作体验的基础上逐步探索新的交互和可视化形式。

## 2. 当前范围

当前仓库是一个以静态生成博客为核心的前端项目，已经具备：

- 文章首页、文章列表、文章详情、标签页和归档页。
- 特色文章、分页、文章搜索和 RSS Feed。
- 深色/浅色模式、响应式布局、站点地图、robots.txt 和动态 OG 图片。
- Giscus 评论、GitHub 编辑入口和友链页面。
- 通过 Astro Content Collections 校验文章 frontmatter。
- 兼容 Obsidian 风格的 `blog-assets/...` 图片引用。

## 3. 内容方向

文章不限定为单一技术主题，当前内容大致覆盖：

- Web、Astro、部署和 VPS 运维。
- Bot、AstrBot、MCP 和 AI 工具实践。
- 魔方、Minecraft、软件和效率工具。
- CTF、编码、设计、演示工具以及年度总结、随笔等。

内容的价值优先级是：真实使用或实践记录、过程中的判断与取舍、可复用的信息，以及个人视角。文章可以不完整，但应尽量说明背景、做法、结果和局限。

## 4. 已确定的扩展方向

博客后续将探索 Minecraft 科技模组结构演示组件，用于表达 AE2、Create 等模组中的机器组合、结构关系和流程。它服务于技术写作，不是 Minecraft Web 客户端。

文章继续使用普通 Markdown，并通过自定义 fenced block 引用结构：

````markdown
```mc-structure
src: mc/structures/ae2-network.nbt
caption: AE2 基础网络
```
````

文章和 `.nbt` 文件由现有 Obsidian/GitHub Actions 链路一起同步。Astro 构建时负责解析 NBT、处理固定版本资源、生成 Web 场景数据；浏览器只加载生成后的资源。当前版本基线为 Minecraft 1.21.1、NeoForge 21.1.250、AE2 19.2.17、Create 6.0.10；当前样本由 Create 蓝图与笔导出，结构内容以 AE2 方块为主；Create 资源适配留到后续阶段。

第一阶段验收目标是：一篇普通 Markdown 文章引用一个同步进来的 Structure NBT 文件，生产构建后显示可旋转、可缩放的 3D 结构，并在脚本或资源异常时提供静态降级。详细设计和任务拆解见 [Minecraft 结构演示扩展](mc-structure-extension.md)。

当前用于准备和导出结构的本地版本包为 `D:\31691\.minecraft\versions\huizhi's test`。需要导出新结构时在该版本中使用 Create 的蓝图与笔；该路径仅作为本地版本与 mod 资源的来源记录，不进入文章引用和线上产物。

## 5. 日常使用

安装依赖：

```bash
pnpm install
```

本地开发：

```bash
pnpm dev
```

常用检查：

```bash
pnpm lint
pnpm run format:check
```

构建生产站点：

```bash
pnpm run build
```

构建命令会先执行 Astro 类型检查和构建，再使用 Pagefind 生成搜索索引，并将索引复制到 `public/pagefind`。

## 6. 当前状态

截至 2026 年 9 月 14 日，Minecraft 结构演示已完成 AE2 首轮可用链路：文章 fenced block 引用 `src/data/mc/structures/` 下的 NBT；Astro 启动和构建时生成标准化场景 JSON 和纹理；页面通过 Three.js 显示可旋转、可缩放的方块结构，并保留文本降级。当前 `test.nbt` 中的 AE2 19.2.17 方块使用仓库内整理的固定纹理，因此本地和 CI 构建不依赖个人 Minecraft 目录。完整 blockstate、逐面模型、发光层，以及 Create 资源适配属于下一阶段。新增功能应服务于文章阅读或内容表达，不应为了扩展而扩展。
