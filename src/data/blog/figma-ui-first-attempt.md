---
title: Figma UI 设计初次尝试
pubDatetime: 2026-01-28T02:57:46+08:00
draft: false
featured: false
tags:
  - 设计
  - Figma
  - UI
description: 第一次接触 Figma 做 UI 设计的过程，包含配色思考和实际成品。
---
## 一、历程

### 背景
晚上偶然看到群友在问怎么学 UI 设计，群主大大推了一篇 [B 站教程](https://www.bilibili.com/video/BV1QzADeFEcF/)。刚好自己也有点感兴趣，立马就去下 Figma 跟着教程搓了一两个小时。

### 成果
我个人还是挺满意的，除了配色之外基本都和教程差不多，我做了一些微调。

![huizhi-figma.png](/blog-assets/figma/huizhi-figma.png)

### 配色方案思考

起初就是打算以樱花粉为主色调，然后去问 Gemini 如何搭配，以下便是其给出的方案（虽然一些压根没用上）。

#### 我的配色方案表

| 分类          | 变量名             | 色值      | 逻辑说明                          |
| ----------- | --------------- | ------- | ----------------------------- |
| **Surface** | Surface White   | #FFFFFF | 纯白。用于卡片最顶层，与粉色背景拉开层次          |
| **Surface** | Surface Default | #FFF1F8 | 樱花粉。作为全局 Page Background      |
| **Surface** | Surface Dark    | #2D282A | 带有一点点红调的深炭灰色。避免纯黑（#000），更有高级感 |
| **Brand**   | Brand Primary   | #FF85B2 | 经典的樱花粉主色。用于主要按钮、进度条           |
| **Brand**   | Brand Secondary | #FFB7D2 | 次级主色。用于悬停 (Hover) 或图标点缀       |
| **Text**    | Text Primary    | #3D3035 | 深巧克力灰。比纯黑更柔和，与粉色背景契合度极高       |
| **Text**    | Text Secondary  | #8E7B82 | 中灰色，用于说明文字或副标题                |
| **Text**    | Text Invert     | #FFFFFF | 反白。用于 Brand Primary 按钮上的文字    |
| **Icon**    | Icon Default    | #5F4D54 | 默认图标颜色，保持足够的识别度               |
| **Icon**    | Icon Secondary  | #C2A9B4 | 装饰性图标，降低存在感                   |
| **Icon**    | Icon Invert     | #FFFFFF | 与反白文字一致                       |

---

## 二、笔记

### 字体样式配置表

以下是基于 SF Pro 字体的层级样式配置：

| 层级名称 | 字体 | 字重 | 字号 (pt) | 行高 (pt) | 应用场景 |
|---------|------|------------|----------|----------|----------|
| H1 | SF Pro | Expanded Semibold | 32 | 40 | 页面主标题、大标题 |
| H2 | SF Pro | Expanded Semibold | 20 | 28 | 章节标题、副标题 |
| Title | SF Pro | Bold | 16 | 24 | 卡片标题、区块标题 |
| Body Bold | SF Pro | Semibold | 16 | 24 | 正文强调、按钮文字 |
| Body | SF Pro | Regular | 16 | 24 | 常规正文内容 |
| Caption | SF Pro | Regular | 14 | 22 | 辅助文字、说明文字、时间戳 |

### 字重递减规律

```
Expanded Semibold (H1, H2)
    ↓
Bold (Title)
    ↓
Semibold (Body Bold)
    ↓
Regular (Body, Caption)
```

> **注**：此配置遵循"标题醒目、正文紧凑"的排版逻辑

### 设计规范总结

1. **字体统一**：所有层级使用 SF Pro 字体，保持视觉一致性
2. **字重递减**：从 Expanded Semibold 到 Regular，体现视觉权重层级
3. **行高比例**：
   - H1：32pt / 40pt（行高比 1.25）
   - H2：20pt / 28pt（行高比 1.4）
   - 正文组：16pt / 24pt（行高比 1.5）
   - Caption：14pt / 22pt（行高比 1.57）

---

*参考资料：[B 站 Figma UI 设计教程](https://www.bilibili.com/video/BV1QzADeFEcF/)*


