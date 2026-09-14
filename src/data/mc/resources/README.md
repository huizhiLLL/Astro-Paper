# Minecraft 固定资源

此目录保存构建和 CI 所需的最小固定资源集，不包含完整 Minecraft 版本包或 mod jar。文件保持原资源包中的相对路径，`src/utils/mc/resources.ts` 与 `src/utils/mc/appearance.ts` 会优先从这里复制实际被结构引用的纹理。

当前资源来源：

- Minecraft：1.21.1
- Mod：Applied Energistics 2 19.2.17
- 本地来源文件：`[应用能源2] appliedenergistics2-19.2.17.jar`
- 原始路径：`assets/ae2/textures/block/` 与 `assets/ae2/models/block/`

当前整理的纹理：

- `controller.png`
- `controller_powered.png`、`controller_lights.png` 及其 `.mcmeta`
- `controller_column_powered.png`、`controller_column_lights.png` 及其 `.mcmeta`
- `controller_inside_a.png`、`controller_inside_b.png`
- `creative_energy_cell.png`
- `molecular_assembler.png`
- `pattern_provider.png`
- `drive/drive_front.png`、`drive/drive_inside.png`、`drive/drive_inside_top.png`、`drive/drive_inside_bottom.png`
- `generics/back.png`、`generics/front.png`、`generics/side.png`、`generics/top.png`、`generics/bottom.png`

模型文件：`assets/ae2/models/block/molecular_assembler.json`，保留原版 13 个元素和逐面 UV。驱动器使用 `assets/ae2/models/block/drive/drive_base.json`，保留原版外壳、逐面贴图与空槽结构；不添加已插入存储元件的模型。

控制器邻接规则参考 [AE2 19.2.17 ControllerBlock](https://github.com/AppliedEnergistics/Applied-Energistics-2/blob/neoforge/v19.2.17/src/main/java/appeng/block/networking/ControllerBlock.java)。仅一条轴的正负两侧都相连时使用柱体，两条以上轴贯通时根据局部坐标奇偶性选择内部 A/B。在线灯光取动画第一帧；构建产物包含底色合成图和黑底自发光遮罩，原始资源不作修改。

纹理图像和模型内容保持原版，动画元数据仅做格式整理；这些资源用于 `test.nbt` 的博客结构预览。增加或升级资源时，需要同步更新本文件、对应版本文档和页面验收样本。上游许可信息以 Applied Energistics 2 项目及所用版本包内的声明为准。

中文名称：`assets/ae2/lang/zh_cn.json` 从同版本语言文件中摘录当前五种方块的原始译名，供悬停提示使用；新增方块时同步补充。
