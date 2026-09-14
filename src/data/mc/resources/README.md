# Minecraft 固定资源

此目录是构建输入，运行时仅输出文章实际使用的 Web 资源。日常构建只读本目录，没有本机资源回退。

## 固定版本

- Minecraft 1.21.1（包含资产索引 17 的中文语言文件）。
- Applied Energistics 2 19.2.17。
- Create 6.0.10（Minecraft 1.21.1）。

`manifest.json` 记录源包 SHA-256、版本、逐文件来源和 SHA-256，共 14,202 个文件。`assets/<namespace>/` 保存 blockstates、models、textures（PNG 与动画元数据）、中文和英文语言文件；不包含 Java 代码、声音和整个 mod jar。原始文件保持字节内容，`.gitattributes` 禁止换行转换，Prettier 排除原始资源。

资源版权与许可沿用 [Minecraft](https://www.minecraft.net/usage-guidelines)、[AE2](https://github.com/AppliedEnergistics/Applied-Energistics-2) 和 [Create](https://github.com/Creators-of-Create/Create) 的上游声明。此清单用于记录固定资源来源，不改变上游许可。

## 导入与验证

在 PowerShell 7 中执行，路径显式传入，不保存在构建配置中：

```powershell
./scripts/import-mc-resources.ps1 `
  -MinecraftJar '<Minecraft 1.21.1 客户端 jar>' `
  -Ae2Jar '<AE2 19.2.17 jar>' `
  -CreateJar '<Create 6.0.10 jar>' `
  -MinecraftAssetsRoot '<包含 indexes/17.json 和 objects 的 assets 目录>'
pnpm resources:check
```

导入顺序为原版、Create、AE2；重复执行时跳过字节一致的资产。更新版本需同时更新脚本版本声明和依赖适配。CI 只验证清单，不执行本机导入。

## 定向适配

- 控制器：按 AE2 `ControllerBlock#getControllerType` 的双侧邻接规则切换普通/柱体/内部纹理；在线灯光固定第一帧。
- 分子装配室：原版 13 元素镂空模型、逐面 UV 和透明像素裁剪。
- 驱动器：原版逐面外壳与十个空槽，暂不展示已插入存储元件。
- 中文提示：优先命名空间 `zh_cn.json`，再尝试英文名称或方块 ID。

更多资源入库不等于自动支持全部模型行为，详见 [CI 与内容同步](../../../../docs/ci.md)。
