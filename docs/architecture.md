# 架构说明

> 更新日期：2026-09-14

## 1. 技术栈

- Astro 5：页面、布局、静态生成和内容渲染。
- TypeScript：配置、工具函数和类型检查。
- Tailwind CSS 4：样式体系，通过 `@tailwindcss/vite` 接入。
- Astro Content Collections：加载并校验 `src/data/blog` 中的 Markdown 文章。
- Pagefind：生产构建阶段生成站内搜索索引。
- Shiki：代码高亮及差异、重点行、文件名等 transformer。
- `@astrojs/sitemap`、`@astrojs/rss`：站点地图和 RSS。
- Satori、Resvg、Sharp：动态 OG 图片生成与图像处理。
- Giscus：基于 GitHub Discussions 的文章评论。

## 2. 目录职责

```text
.
├─ public/                 静态资源，文章图片位于 public/blog-assets/
├─ src/
│  ├─ assets/              构建时处理的图片与图标
│  ├─ components/          可复用 Astro UI 组件
│  ├─ data/blog/           博客 Markdown 内容
│  ├─ data/mc/             Minecraft 结构与固定版本资源输入
│  ├─ layouts/             页面布局与文章详情布局
│  ├─ pages/               Astro 路由和 API 路由
│  ├─ styles/              全局样式与排版样式
│  ├─ utils/               内容筛选、排序、路径、图片和 OG 工具
│  ├─ config.ts            站点主配置
│  ├─ constants.ts         社交链接等常量
│  └─ content.config.ts    内容集合和 frontmatter schema
├─ docs/                   项目与架构文档
└─ astro.config.ts         Astro、Markdown、Vite 和环境配置
```

## 3. 内容数据流

1. `src/content.config.ts` 使用 `glob` loader 从 `src/data/blog` 加载非下划线开头的 Markdown 文件。
2. Astro 根据 schema 校验文章元数据，包括标题、发布时间、描述、标签和可选的草稿、置顶、修改时间等字段。
3. 页面通过 `getCollection("blog")` 读取文章。
4. `postFilter` 隐藏草稿，并在生产环境隐藏尚未到发布时间的文章；开发环境允许查看定时文章。
5. `getSortedPosts` 按修改时间或发布时间倒序排列。
6. 首页、文章列表、归档、标签页和文章详情分别消费筛选后的集合。
7. 构建时生成静态 HTML、RSS、站点地图、OG 图片和 Pagefind 搜索索引。

## 4. 文章约定

文章目录：`src/data/blog/`。

最小 frontmatter 示例：

```yaml
---
title: "文章标题"
pubDatetime: 2026-09-12T12:00:00+08:00
tags:
  - 示例
description: "用于列表、SEO 和 RSS 的简短描述。"
---
```

常用字段：

- `draft: true`：草稿，不进入生产页面。
- `featured: true`：显示在首页 Featured 区域。
- `modDatetime`：文章修改时间，用于排序和显示 Updated。
- `tags`：标签数组，默认值为 `others`。
- `ogImage`：文章专属 OG 图片，可使用图片资源或字符串路径。
- `hideEditPost: true`：隐藏当前文章的 GitHub 编辑入口。
- `timezone`：覆盖站点默认时区 `Asia/Shanghai`。

公共文章图片放在 `public/blog-assets/`。Markdown 可以写成：

```md
![说明](blog-assets/example/image.png)
```

`remarkObsidianImagePaths` 会把这类路径转换为站点可访问的 `/blog-assets/...` 路径。绝对 URL、锚点和其他协议不会被改写。

## 5. Minecraft 结构演示构建链路

文章仍然是普通 Markdown，不迁移到 MDX。专用 remark 插件识别以下 fenced block：

````markdown
```mc-structure
src: mc/structures/ae2-network.nbt
caption: AE2 基础网络
```
````

`src` 指向 `src/data/mc/` 下的构建输入。文章和 NBT 文件由 Obsidian/GitHub Actions 一起同步。构建链路为：

```text
Markdown
  → remarkMinecraftScenes
  → 引用校验
  → 仓库固定资源优先、本机 mod jar 回退
  → 标准化 scene JSON / 纹理
  → 文章中的结构展示占位标记
  → 浏览器端 Three.js 渲染
```

浏览器不直接读取 NBT、mod jar 或原始资源包。自定义 Astro integration 在开发启动和生产构建阶段遍历 `src/data/mc/structures/`，将 NBT 转换为 `public/mc-generated/` 下的标准化场景数据和纹理。资源解析优先读取 `src/data/mc/resources/` 中整理并提交的固定资源，保证 CI 可复现；仓库资源缺失时，本地构建才使用 `MC_RESOURCE_ROOT` 与 `MC_VERSION` 指向的 Minecraft 版本目录，从 mod jar 提取纹理。

浏览器端使用 Three.js 的方块几何体和最近邻纹理过滤渲染场景，OrbitControls 提供旋转和缩放。当前实现为每个方块复用一张基础纹理，尚未解析 blockstate、模型继承、逐面纹理、发光层和方向状态。当前样本来自 Create 蓝图与笔，内容包含 AE2 19.2.17 方块；导出 NBT 采用小写 `size`/`blocks` 字段，`blocks` 可能是数字键 Compound，方块 ID 从 block NBT 的 `id` 读取。

当前扩展的完整决策、错误处理、目录约定和第一阶段任务见 [Minecraft 结构演示扩展](mc-structure-extension.md)。

## 6. 路由与页面职责

- `/`：展示置顶文章和最近文章。
- `/posts/`：分页展示全部文章。
- `/posts/<slug>/`：文章详情、上一篇/下一篇及评论。
- `/tags/`：标签总览。
- `/tags/<tag>/`：按标签分页展示文章。
- `/archives/`：按年份和月份归档。
- `/search/`：Pagefind 搜索界面。
- `/friends/`：Markdown 友链页面。
- `/rss.xml`、`/sitemap-index.xml`、`/robots.txt`：站点分发与爬虫相关接口。
- `/og.png`：站点动态 OG 图片接口。

页面通常由 `Layout`、`Header`、主体布局和 `Footer` 组合。文章详情使用 `PostDetails`，普通带标题页面使用 `Main`。

## 7. 配置与外部服务

`src/config.ts` 是站点行为的主要配置入口，包含站点信息、分页数量、时区、归档开关、编辑链接、评论配置和动态 OG 图片开关。

外部服务与运行要求：

- Giscus 需要 `SITE.comments` 中的仓库、仓库 ID、分类和分类 ID 正确匹配。
- Google 站点验证通过可选的 `PUBLIC_GOOGLE_SITE_VERIFICATION` 环境变量提供。
- Pagefind 搜索结果需要至少成功执行一次生产构建后才完整可用。
- `SITE.website` 应与实际部署域名一致，否则 canonical、RSS 和 sitemap 地址会不准确。

## 8. 扩展原则

新增内容表达能力时，优先按以下边界设计：

1. 文章元数据继续由 Content Collections 负责校验，避免在页面中散落字符串约定。
2. 与文章无关的通用展示逻辑放入 `src/components/` 或 `src/utils/`，不要堆进单个页面路由。
3. 交互组件应有明确的数据输入和可预测的静态降级效果，确保构建失败或脚本不可用时文章仍可读。
4. 大型资源、第三方运行时和客户端脚本需要评估构建体积、移动端性能及 SEO 影响。
5. 新增路由、环境变量、文章字段或构建步骤时，同步更新本文件和 `README.md` 的相关说明。
6. Minecraft 结构输入和浏览器生成产物分离，避免让文章格式承担底层渲染细节。
