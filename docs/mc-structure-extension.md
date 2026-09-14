# Minecraft 结构演示扩展

> 状态：AE2 首轮真实纹理与 Three.js 展示已完成
>
> 更新日期：2026-09-14

## 1. 目标与边界

本扩展用于在博客文章中表达 Minecraft 科技模组的结构、机器组合和空间关系。它是博客的教学表达组件，不是 Minecraft Web 客户端，也不追求还原完整游戏世界。

第一阶段的验收目标是：

> 一篇普通 Markdown 文章，加上一个随文章同步的 Structure NBT 文件，通过 Astro 生产构建后，页面能够展示可旋转、可缩放的 3D 结构，并在资源或脚本异常时保留可理解的静态降级内容。

当前版本基线：

```text
Minecraft: 1.21.1
NeoForge: 21.1.250
FML: 4.0.44
NeoForm: 20240808.144430
Applied Energistics 2: 19.2.17
Create: 6.0.10
Create Connected: 1.3.3
ExtendedAE: 2.2.36
ExtendedAE Plus: 1.6.2
```

当前本地版本包根目录为 `D:\31691\.minecraft\versions\huizhi's test`。本地开发可以从该版本目录中的 mod jar 提取缺失资源；CI 使用 `src/data/mc/resources/` 中整理并提交的固定版本资源。完整版本包、mod jar 和未使用的原始资源不提交到博客仓库。

第一阶段不做：

- 完整 Minecraft 世界加载或玩家视角复刻。
- Litematic 支持。
- Create Contraption 或复杂实体行为模拟。
- 动态机械动画、时间轴和完整 Ponder 系统。
- 任意 Minecraft 版本和任意模组的自动兼容。
- 直接在浏览器中解析 mod jar 或原始 NBT。

## 2. 文章作者体验

文章继续使用普通 `.md`，不要求迁移到 MDX，也不要求作者导入 Astro 组件。结构通过 fenced code block 引用：

````markdown
```mc-structure
src: mc/structures/ae2-network.nbt
caption: AE2 基础网络
```
````

单方块展示使用同一套语义，但可以由文章直接提供方块 ID：

````markdown
```mc-block
id: ae2:controller
caption: AE2 控制器
```
````

在 Obsidian 中，这些内容仍然是合法 Markdown，会显示为普通代码块；在 Astro 构建时，专用 remark 插件识别 `mc-structure`，将其转换为博客组件需要的节点或占位标记。`mc-block` 语法先记录为后续扩展，不属于第一阶段已实现能力。

`src` 是构建输入路径，不是浏览器 URL。文章作者只需要维护文章和结构文件，构建系统负责 NBT 解析、资源处理和浏览器产物生成。

## 3. 源文件与生成文件

文章和 NBT 文件必须由当前的 Obsidian/GitHub Actions 同步链路一起提交到 Astro 仓库。建议使用以下目录：

```text
src/
└─ data/
   ├─ blog/                    文章 Markdown
   └─ mc/
      ├─ structures/           Structure NBT 文件
      └─ resources/            CI 使用的固定版本资源

public/
└─ mc-generated/               构建生成的浏览器资源，不提交仓库
```

文章引用：

```text
src: mc/structures/ae2-network.nbt
```

对应的构建输入：

```text
src/data/mc/structures/ae2-network.nbt
```

当前构建产物包含场景数据和纹理；后续可以增加静态预览与 manifest，例如：

```text
public/mc-generated/<scene-id>/
├─ scene.json
├─ preview.png
├─ manifest.json
└─ textures/
```

生成目录由 Astro integration 在启动与构建时刷新，不作为源文件提交。固定资源目录需要保留来源版本说明，避免模组更新后无法解释旧文章的展示结果。

## 4. 构建链路

```text
普通 Markdown
    ↓
remarkMinecraftScenes
    ↓ 识别 mc-structure
校验引用路径
    ↓
NBT 与版本化资源输入
    ↓
构建期解析和标准化
    ↓
scene.json / 纹理
    ↓
文章结构展示占位标记
    ↓
浏览器端 Three.js 方块与纹理渲染
```

浏览器只加载构建后的 Web 资源，不直接读取 NBT、mod jar 或 Minecraft 资源包。当前使用 Three.js 展示结构：控制器已支持默认在线常亮与连接材质，分子装配室已使用原版镂空模型和逐面纹理，驱动器已使用原版逐面外壳与空槽模型；其他方块保留基础立方体。通用模型继承、完整方块状态与动态灯光仍待后续实现。

NBT 不是组件的最终数据格式。构建过程需要将 NBT 转换成项目自己的标准化场景数据，使文章组件和底层输入格式解耦：

```text
Structure NBT → 标准化场景 JSON → Web 渲染
单方块 ID     → 标准化场景 JSON → Web 渲染
```

## 5. 构建输入与资源策略

初期资源只服务于实际引用的方块，不复制完整 AE2、Create 或 Minecraft 资源包到网站。资源处理至少需要覆盖：

- 方块 ID 和 BlockState。
- blockstates 变体选择。
- models 继承与模型引用。
- 贴图路径解析。
- 方块朝向和基础旋转。
- 结构中的方块位置、尺寸和 palette。

构建工具先读取 `src/data/mc/resources/` 中按原资源路径整理的固定资源，使本地和 CI 得到相同结果；缺失时再从 `MC_RESOURCE_ROOT`/`MC_VERSION` 指向的本地 mod jar 提取。当前仅整理 `test.nbt` 使用的 AE2 19.2.17 纹理，原始 jar 不作为浏览器资源发布。

最脆弱的技术假设是：固定版本的 AE2/Create 资源可以被稳定转换为浏览器可用模型。如果通用模型解析暂时无法成立，第一阶段可以退化为构建期生成少量预处理 GLTF/JSON 模型，但不能退化为让文章作者手写完整空间结构。

## 6. 错误处理与降级

构建期间应尽早暴露内容错误：

- 引用的 NBT 文件不存在：构建失败，并指出文章文件和 `src`。
- NBT 无法解析或结构为空：构建失败，并指出具体结构文件。
- 资源缺失：至少输出明确警告；若无法生成可理解的结果，则构建失败。
- 存在暂不支持的方块：允许使用明确的占位方块，并在构建日志中列出方块 ID。
- 浏览器脚本加载失败：显示静态预览图、结构标题和版本信息，而不是空白区域。

## 7. 第一阶段工作拆解

### 7.1 确定输入约定

- 确认 `src/data/mc/structures/` 作为 NBT 源文件目录。
- 确认 `mc-structure` 和 `mc-block` fenced block 的字段格式。
- 定义引用路径只能指向仓库内允许的目录，禁止通过 `../` 越界。
- 已准备真实的 Create 蓝图导出样本：`src/data/mc/structures/test.nbt`。
- 已确认后续结构文件统一来自 Create 的蓝图与笔导出。
- 已确认该导出是 gzip 压缩 NBT，使用小写 `size`、`blocks` 字段；实际方块 ID 位于每个 block 的 `nbt.id`，不能只按原版 Structure NBT 的 palette 解释。

产物：文章语法约定、目录约定、测试样本。

### 7.2 打通版本化资源输入

- 建立 Minecraft 1.21.1、AE2 19.2.17、Create 6.0.10 的资源输入说明。
- 决定 NeoForge 的具体构建号以及本地资源获取方式。
- 验证能否提取一个原版方块、一个 AE2 方块和一个 Create 方块的模型与贴图。
- 已记录当前 AE2 纹理的来源版本和文件映射；更完整的许可说明随资源范围扩展继续补充。

产物：固定版本资源目录或资源准备脚本，以及版本 manifest。

### 7.3 实现最小 NBT 标准化器

- 读取 Structure NBT。
- 解析结构尺寸、palette、blocks 和方块状态。
- 将方块坐标和方块 ID 转换为项目内部的标准化 JSON。
- 对缺少模型、未知方块和不支持状态提供可诊断错误。
- 用真实导出的 NBT 和一个最小测试 fixture 验证结果。

产物：一个可独立运行的 NBT 到场景 JSON 转换流程。

### 7.4 实现最小资源到模型流程（AE2 三种方块已定向适配）

- 已根据标准化方块 ID 为 `test.nbt` 中的 AE2 方块选择基础纹理。
- 已将固定纹理整理到仓库，构建时生成浏览器可以加载的场景数据和纹理。
- 已加入控制器在线底图与独立自发光遮罩（固定第一帧），按邻接选择普通块、三轴柱体及交替内部纹理；内部纹理沿用原版非发光表现。
- 已读取分子装配室原模型的 13 个元素，保留逐面 UV 和 UV 旋转，以透明像素裁剪还原镂空和遮挡。
- 通用模型继承、其他方块逐面贴图、动态灯光和静态预览图待后续处理。

产物：包含场景 JSON、定向模型描述、基础纹理和控制器自发光遮罩的 `mc-generated` 目录；静态预览图后续补充。

### 7.5 接入 Markdown 构建过程（第一阶段已完成）

- 实现 `remarkMinecraftScenes`，识别 `mc-structure`。
- 在构建阶段校验引用文件并调用场景生成流程。
- 将 Markdown 节点转换为结构展示占位标记可消费的引用。
- 保证普通 `.md` 文章在 Obsidian 中仍可正常编辑和预览。

产物：文章中的 fenced block 能在 Astro 构建中生成组件占位内容。

### 7.6 实现浏览器组件（Three.js 基础版本已完成）

- 在文章详情布局中读取生成的 scene JSON。
- 使用 Three.js 和 OrbitControls 完成基础场景、默认视角、旋转和缩放。
- `mc-block` 单方块入口暂不实现，保留为后续扩展。
- 加入加载失败和静态文本降级状态。
- 保持 +Y 向上并按实际结构居中，从 -Z 侧斜上方自动取景，限制旋转到地平线以下。
- 使用 sRGB 颜色纹理；不超过 64×64 的像素纹理先按最近邻放大 8 倍，再使用线性与 mipmap 过滤及最高 8 倍各向异性过滤，缩窄近景像素边缘的平滑范围，同时保留远景和斜面过滤。配合方向光增强空间层次。

产物：文章页面中的可交互结构展示。

### 7.7 接入同步与生产构建（第一阶段约定已完成）

- 确认 Obsidian 仓库同步文章时会同步 `.nbt` 文件。
- 在 GitHub Actions 中确保依赖、资源准备和 Astro build 的顺序正确。
- 缺失 NBT、资源或生成产物时让构建失败，并输出可定位日志。
- 验证本地构建和 CI 构建使用相同版本基线。

产物：从文章仓库更新到线上展示的完整链路。

### 7.8 验收与性能检查

验收至少包括：

- 普通 Markdown 文章可以保留 `mc-structure` fenced block。
- 文章引用的真实 NBT 文件能够被构建找到并解析。
- 页面显示结构，支持旋转和缩放。
- 已验证一个包含多种 AE2 方块的结构；Create 方块或结构留到后续阶段。
- 缺失文件时构建明确失败。
- 脚本不可用时仍有静态预览和文本信息。
- 手机宽度下组件不溢出文章内容区域。
- 生成资源体积、首屏加载和重复场景缓存处于可接受范围。

## 8. 实现顺序建议

为了降低风险，建议按以下可独立验证的顺序推进：

1. 先完成目录、语法和测试样本，不接入真实渲染。
2. 再完成单方块资源转换，确认 AE2/Create 资源可以进入 Web 管线。
3. 再完成 NBT 到标准化 JSON，先用文本或静态预览验证结构数据。
4. 再完成 Three.js 组件，先渲染标准化 JSON。
5. 最后把 remark、构建生成器、组件和 GitHub Actions 串成完整链路。

这样即使资源自动解析遇到困难，也能明确知道问题位于资源转换、NBT 解析、Markdown 构建还是浏览器渲染，而不是同时排查整套系统。
