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
  → 仓库固定版本资源与依赖检查
  → 标准化 scene JSON / 纹理
  → 文章中的结构展示占位标记
  → 浏览器端 Three.js 渲染
```

浏览器不直接读取 NBT、mod jar 或原始资源包。Astro integration 使用 Markdown 语法树收集 `src/data/blog/` 中的结构引用，支持嵌套引用并排除普通代码示例，按规范化路径去重。`mc/foo.nbt` 与旧写法 `mc/structures/foo.nbt` 都指向 `src/data/mc/structures/foo.nbt`；不构建未引用的 NBT。

构建只读取 `src/data/mc/resources/` 的固定资产，沿引用方块的 blockstate、模型父级、纹理与动画元数据记录依赖；动态模型仍由定向适配补充入口。当前保守记录 blockstate 所有变体的依赖，但浏览器输出仅包含适配器实际使用的纹理和场景。`public/mc-generated/manifest.json` 记录结构、引用文章/行号和资源依赖。先在 `.astro/` 临时目录完成生成，成功后替换产物；失败时保留上一次生成结果。remark 插件只读取准备好的场景，避免重复构建。开发服务器监听文章、NBT 和资源变化后重新生成。

源资源由显式运行的 `scripts/import-mc-resources.ps1` 批量导入，日常构建不执行导入、不读取本机目录、无环境变量回退。导入清单记录包版本、包 SHA-256 与逐文件 SHA-256；Git 保留原始资产字节，CI 验证清单。当前固定版本为 Minecraft 1.21.1、AE2 19.2.17、Create 6.0.10，保留命名空间下的 blockstates、models、textures 与中英语言文件，不导入 Java 代码和声音。

Vite 依赖缓存按 Astro 命令隔离在 `node_modules/.vite/<command>/`，避免运行检查或构建时覆盖开发服务仍在使用的预打包依赖。结构占位标记始终包含可见的标题与尺寸说明，脚本成功后才替换成交互视图；模块加载失败时仍保留文本。启动 `pnpm dev` 后可运行 `node --test tests/minecraft-preview.test.mjs` 检查模块依赖、静态降级和场景资源；在开发服务保持运行的情况下执行构建，再重跑此测试，可验证缓存隔离。该测试不覆盖 WebGL 画面。`pnpm test` 验证控制器连接分类、模型旋转、自发光遮罩、装配室透明视线与框架遮挡，以及重复资源生成；`node --test tests/minecraft-drive.test.mjs` 验证驱动器顶部、侧面、背面、底部贴图及十个空槽的深度。测试直接加载 TypeScript，使用 Node.js 24 运行。

修改 remark 插件后，若文章内容未变化，Astro 可能复用旧的渲染 HTML；构建前运行 `pnpm exec astro sync --force` 刷新内容缓存。

浏览器端使用 Three.js 方块几何体，保持 Minecraft 的 +Y 向上，并按实际结构包围盒居中。默认从 -Z 侧斜上方观察，按视口宽高自动取景；OrbitControls 提供旋转和缩放，限制相机进入地平线以下。颜色纹理使用 sRGB；不超过 64×64 的像素纹理先在客户端按最近邻放大 8 倍，再使用线性放大过滤、三线性 mipmap 缩小过滤和最高 8 倍各向异性过滤，使近景平滑过渡限制在原始像素边界的 1/8 范围内，配合抗锯齿、半球光与方向光改善斜面采样和空间层次；画布像素比上限为 2。画布透明，背景由容器的主题背景色提供；工具栏与底部说明使用主题前景色，随站点亮暗主题即时切换。场景 JSON 保持 schema 1，增加可选 `models` 表、方块 `model` 引用和 `names` 中文名称表。`src/utils/mc/appearance.ts` 在构建期定向生成 AE2 控制器、分子装配室与驱动器的模型描述，`src/scripts/minecraft-model.ts` 按元素、面、UV 和旋转生成几何体，并按材质合批；同型号共享几何体与纹理。控制器按 AE2 19.2.17 的双侧邻接规则选择普通块、X/Y/Z 柱体、内部 A/B 纹理；坐标奇偶性使用结构局部坐标。普通块和柱体固定使用在线贴图第一帧，底色与灯层在构建期合成，另生成黑底自发光遮罩；内部 A/B 按原版保持非发光。分子装配室读取固定的 13 元素原模型，保留逐面 UV/90° UV 旋转，使用双面 alphaTest 裁剪与 alpha-to-coverage，保持深度写入。驱动器读取原版 `drive_base.json`，按原模型使用外壳各面与内部贴图，并保留十个槽位的凹陷结构；当前默认朝北、空槽，不模拟已插入存储元件或状态灯。其他方块仍使用基础立方体纹理；通用 blockstate、模型继承、任意元素旋转及网络状态模拟尚未实现。当前样本来自 Create 蓝图与笔，内容包含 AE2 19.2.17 方块；导出 NBT 采用小写 `size`/`blocks` 字段，`blocks` 可能是数字键 Compound，方块 ID 从 block NBT 的 `id` 读取。

悬停交互由 `src/scripts/minecraft-hover.ts` 管理：按最近的方块包围盒选中整个方块（包括镂空模型），绘制随主题变化的外轮廓，并在鼠标旁显示中文名称。中文名称来自各命名空间的 `zh_cn.json`，缺少中文时尝试 `en_us.json`，仍缺少时回退方块 ID。提示框限制在画布内，不拦截指针；拖动、移出、取消或窗口失焦时清除，触摸操作不触发悬停。卸载时清理监听、主题观察器与轮廓资源。`node --test tests/minecraft-hover.test.mjs` 验证最近方块拾取、中文提示、拖动与移出状态、主题更新和清理；该测试使用 DOM 替身，不覆盖浏览器画面。

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
