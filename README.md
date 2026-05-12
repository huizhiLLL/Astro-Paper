# huizhi's Aside

这是 huizhi's Aside 的博客站点仓库，用于记录一些技术笔记、个人想法和碎碎念。

站点基于 [AstroPaper](https://github.com/satnaing/astro-paper) 框架初始化并进行个性化调整。

## Obsidian 写作约定

博客文章位于 `src/data/blog`，静态图片资源位于 `public/blog-assets`。

为方便与 Obsidian 协同，Markdown 中可以按 Obsidian 习惯引用图片：

```md
![RubiKey_2.png](blog-assets/rubikey/RubiKey_2.png)
```

构建时会自动转换为站点可访问的 `/blog-assets/...` 路径。

## 评论系统

文章页已预留 [Giscus](https://giscus.app/zh-CN) 评论组件，评论数据存储在 GitHub Discussions。

启用前需要：

1. 在 GitHub 仓库中开启 Discussions。
2. 安装 [giscus GitHub App](https://github.com/apps/giscus)，并授权到当前仓库。
3. 打开 Giscus 配置页，填写仓库名并选择一个 Discussion 分类。
4. 将配置页生成的 `repoId`、`categoryId` 等值同步到 `src/config.ts` 的 `comments` 配置中，并把 `enabled` 改为 `true`。
