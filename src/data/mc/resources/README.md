# Minecraft 固定资源

此目录保存构建和 CI 所需的最小固定资源集，不包含完整 Minecraft 版本包或 mod jar。文件保持原资源包中的相对路径，`scripts/build-mc-scenes.ts` 会优先从这里复制实际被结构引用的纹理。

当前资源来源：

- Minecraft：1.21.1
- Mod：Applied Energistics 2 19.2.17
- 本地来源文件：`[应用能源2] appliedenergistics2-19.2.17.jar`
- 原始路径：`assets/ae2/textures/block/`

当前整理的纹理：

- `controller.png`
- `creative_energy_cell.png`
- `molecular_assembler.png`
- `pattern_provider.png`
- `drive/drive_front.png`

这些文件未经编辑，只用于 `test.nbt` 的博客结构预览。增加或升级资源时，需要同步更新本文件、对应版本文档和页面验收样本。上游许可信息以 Applied Energistics 2 项目及所用版本包内的声明为准。
