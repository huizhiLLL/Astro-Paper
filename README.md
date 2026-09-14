# huizhi's Aside

`huizhi's Aside` 是基于 [AstroPaper](https://github.com/satnaing/astro-paper) 二次修改的个人博客站点，用于持续积累文章，也为后续的创意性内容扩展保留空间。

## 文档

- [项目说明](docs/project.md)：项目定位、内容方向、当前范围和日常使用。
- [架构说明](docs/architecture.md)：技术栈、目录职责、内容数据流、路由和扩展原则。
- [CI 与内容同步](docs/ci.md)：Obsidian 增量同步、固定资源、构建和验证。
- [开发路线](docs/roadmap.md)：Minecraft 结构展示等扩展的阶段状态与下一步。
- [AGENTS.md](AGENTS.md)：面向协作者和编码代理的工作约定。

## 文章与资源

博客文章位于 `src/data/blog`，静态图片资源位于 `public/blog-assets`。

为方便与 Obsidian 协同，Markdown 中可以按 Obsidian 习惯引用图片：

```md
![RubiKey_2.png](blog-assets/rubikey/RubiKey_2.png)
```

构建时会自动转换为站点可访问的 `/blog-assets/...` 路径。

## Minecraft 结构展示

文章可以通过 `mc-structure` fenced block 引用 `src/data/mc/structures/` 中的 NBT。`pnpm dev` 和 `pnpm run build` 启动 Astro 时会生成浏览器使用的场景 JSON 与纹理；页面使用 Three.js 展示可旋转、可缩放的 3D 结构。

````md
```mc-structure
src: mc/test.nbt
caption: AE2 测试网络
```
````

构建只使用 `src/data/mc/resources/` 中已入库的固定版本资源，不读取本机 Minecraft 目录。文章引用 `mc/test.nbt` 对应 `src/data/mc/structures/test.nbt`，旧写法 `mc/structures/test.nbt` 仍兼容。详见 [Minecraft 结构演示扩展](docs/mc-structure-extension.md)。

开发与 CI 使用 Node.js 24、pnpm 9.15.9。常用验证：`pnpm resources:check`、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm build`、`pnpm test:preview`。
