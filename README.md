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
