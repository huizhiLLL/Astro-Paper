---
title: 在博客中实现 GuideMe
pubDatetime: 2026-09-14T12:00:00+08:00
draft: false
featured: true
tags:
  - MC
description: 控制器亮起来了什么都会好起来的
---
## 背景

最近 mc 科技向的 mod 和整合包接触的比较多，必然绕不开 AE2 —— 科技模组中的“红石”

这的确是一个非常伟大的模组，强大的物流 + 自动化

在观看 GuideMe 以及一些 AE2 的教程的过程中，想到了 AE2 的教学形式：

GuideMe 的思路便是在 md 中穿插 Scene，并利用游戏本身来进行渲染；
在社媒平台的教学，则是实机录屏逐渐讲解，或是利用剪辑与建模呈现出更加清晰可视化的教学，这当然是各有优点的

那为什么不能有一种游戏外的文档，来实现 GuideMe 的功能？
换句话说，对于自有的博客，完全可以利用 threejs + nbt 解析来做到博客内 Scene 的呈现与可视化

## 取舍

对于作者来说，足够方便的撰写是必要的 —— 我并不喜欢 md 夹杂轻代码的标签，尤其是在 obsidian 写作的过程中

因此，可以采用自定义类型的 fenced code block 的方法来引用对应的 nbt 结构文件 —— nbt 从“蓝图与笔”/结构方块而来
再配合 obsidian actions 实现 ci 自动化，便可保证顺畅的写作体验

## 示例

```mc-structure
src: mc/ae2/test.nbt
caption: AE2 结构简单示例
```

