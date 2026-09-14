# 开发路线

> 更新日期：2026-09-14

## 当前阶段

Minecraft 结构展示的 AE2 首轮链路已经完成：

- Markdown 通过 `mc-structure` 引用 Structure NBT。
- Astro integration 在开发启动和生产构建时遍历 `src/data/mc/structures/` 并生成场景 JSON。
- CI 优先使用 `src/data/mc/resources/` 中的固定 AE2 19.2.17 纹理。
- 本地缺少固定资源时，可从指定 Minecraft 版本的 mod jar 提取。
- 页面使用 Three.js 和 OrbitControls 展示可旋转、可缩放的结构。
- 已用 `test.nbt` 验证控制器、分子装配室、样板供应器、驱动器和创造能源元件。

## 下一阶段

1. 解析 AE2 blockstate 与模型继承，为不同面选择正确纹理。
2. 支持朝向、模型旋转、透明材质和发光纹理层。
3. 为资源清单增加版本与来源 manifest，并补充缺失资源诊断。
4. 将文章详情中的 Minecraft 初始化逻辑拆成独立、按需加载的组件边界。
5. 完成 AE2 效果验收后，再接入 Create 6.0.10 的方块资源。

## 暂不处理

- Create Contraption 动画与 Ponder 系统。
- Litematic 和完整世界加载。
- 任意 Minecraft 或模组版本的通用兼容。
- 浏览器直接读取 NBT 或 mod jar。
