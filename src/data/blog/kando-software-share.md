---
title: '关于电脑的导航性使用——Kando 软件分享'
pubDatetime: 2026-02-28T16:45:53+08:00
draft: false
featured: false
tags:
  - Windows
  - 效率
  - 工具
description: '分享 Kando 这类导航式启动工具，以及它在日常电脑使用中的意义。'
---
## 引言

就像使用浏览器有一些常去的网址,我们的电脑使用在平时一样有高频使用的软件。因而会有桌面、快捷方式、任务栏、开始栏等的存在。

像大多数的 Windows 用户一样,我最开始也是将下载的软件的快捷方式都排列在桌面上,并挑出一部分最高频率的放在任务栏中。可随着我对桌面干净、美化的追求,我开始寻找一些更优雅的方案来快速启动。例如桌面图标全部隐藏,取而代之的是使用开始栏的区域,以及 utools 的 `Alt + Space` 来快速启动应用(同时也搭配任务栏的高频率应用)。

> utools 的确是个不错的软件,可扩展性、自由度都很不错。不过我没怎么花时间去调,只是用了一段时间的快速启动。

后来偶然发现了 Kando 这个软件,于是……

## 软件展示

其实这里本来想放点 GIF 的,稍微录了点体积好大,也有点麻烦,干脆直接放点图吧()

![kando1.png](/blog-assets/kando/kando1.png)
![kando2.png](/blog-assets/kando/kando2.png)
![kando3.png](/blog-assets/kando/kando3.png)
![kando4.png](/blog-assets/kando/kando4.png)

## 快速开始

**Kando 官网:** [Kando - Do things with utmost efficiency.](https://kando.menu/)

Kando 对 Windows、Mac、Linux 平台均支持,安装可见[官方文档](https://kando.menu/intro/),很简单(懒得写了)。

### 配置和使用

![Kando.png](/blog-assets/kando/Kando.png)

对于 Kando 来说,几乎无需做什么初始化的配置,上手即用,只需要随着使用不断完善自己的导航库。

默认的菜单启动快捷键是 `Ctrl + Space`,我这里改为了 `Shift + Space`(因为 `Ctrl + Space` 会切换输入法的中英文,而 `Shift` 作修饰符时长按并不会切换中英文)。

可作为导航的项种类相当丰富,包括:
- 子菜单
- 快捷方式
- 网站
- 文件夹
- 命令运行
- 模拟按键
- 等等

具体就建议自行探索啦。

### 图标自定义

在完善个人的导航库时,可以直接拖动某个快捷方式、文件夹到设置页面来快速填充,然而会遇到需要自行添加图标的情况(默认提供的图标库较少),这里给出我的方法:

1. **创建图标库文件夹**

   首先找到 Kando 的目录 `...\AppData\Roaming\kando\`,然后在 `icon-themes\` 下新建属于自己的图片库文件夹,例如 `...\AppData\Roaming\kando\icon-themes\huizhi`

2. **添加图标**

   需要自行添加的图标可直接添加到该文件夹下,选择图标时即可找到该图标库进行选择。

3. **图标获取**

   - 常见的图标可以到 [iconfont-阿里巴巴矢量图标库](https://www.iconfont.cn/) 上直接搜索,建议下载 SVG 格式
   - 搜不到的话可以直接上对应软件/网站的官网上找图标直接另存在本地

## 其他

- 使用一段时间后,发现这个软件在开机自启时是比较慢的,一般在开机之后还要等一会
- 以及,没有类似于"窗口黑名单"的东西,即对于某些窗口禁用快捷启动的配置,只能手动去暂时禁用所有快捷方式(因为我玩 MC 时有时会不小心触发 Kando 的菜单启动……)
- 好看,炫酷是真的哈哈哈


