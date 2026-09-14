---
title: 从原理到应用：智能魔方开发接入全景指南
pubDatetime: 2026-07-22T00:00:00+08:00
draft: false
featured: true
tags:
  - 智能魔方
  - 开发
  - 指南
description: 关于智能魔方的开发接入，你想知道的所有
---
> 人工撰写，可放心食用~（约 3800 字，阅读时间约 15 min）

## 背景与前言

过去半年多，我先后尝试在 Web、Android 和 Windows 平台接入智能魔方，并将其应用于智能计时训练、操作映射等场景

本文不含具体的代码和协议，只是简单介绍智能魔方的连接原理、开发资料、技术栈选择、多品牌兼容，以及协议之上的应用方式

> 全文默认指智能三阶，协议相关信息截止到 2026.7

以下是内容大纲，可按需阅读：

- 原理 —— 一次完整连接是怎样发生的
- 资料 —— 从哪里开发接入智能魔方
- 取舍 —— 实际技术栈该如何选择
- 难点 —— 多品牌兼容过程的真正麻烦
- 应用 —— 智能魔方映射类项目的核心
- 实践 —— 个人项目介绍与展望

难免存在纰漏，欢迎指出，一起交流~

## 原理 —— 一次完整连接是怎样发生的

### 基础概念

![BLE 与 GATT 数据模型](/blog-assets/BLE/smartcube-gatt-model.png)

- BLE（**B**luetooth **L**ow **E**nergy），即低功耗蓝牙，在 Bluetooth 4.0 引入，能够在维持相对低的功耗的同时实现通信，也就是智能魔方普遍采用的通信方式
- MAC 地址（**M**edia **A**ccess **C**ontrol Address）：BLE 通信中用于标识和寻址设备的 48 位地址，格式例如：`D0:AB:12:34:56:78`；智能魔方的 MAC 地址通常随出厂固定，部分协议会使用 MAC 地址参与加密参数的生成
- GATT（**G**eneric **ATT**ribute Profile），是 BLE 连接建立后的数据访问框架
  外设，也就是智能魔方，通过 Service 和 Characteristic 组织数据，中心设备（手机/电脑）通过服务发现、读取、写入和订阅通知完成通信；具体字节代表什么，则由智能魔方的厂商协议决定
- **Characteristic** 支持的操作由其属性决定，常见方式包括：
  Read：客户端主动读取数据；Write：客户端向魔方发送指令； Notify：魔方在数据变化时主动通知客户端，例如上报一次转动；Indicate：与 Notify 类似，但需要客户端确认，智能魔方中较少使用。

### 连接过程

![智能魔方连接流程](/blog-assets/BLE/smartcube-connection-flow.png)

1. **扫描和识别**：
   客户端扫描附近的 BLE 广播设备，根据设备名称、Service UUID、Manufacturer Data 等信息，初步判断魔方品牌和协议类型，例如 Moyu32、GAN、QiYi
2. **建立 BLE 连接**：
   用户选择设备后，客户端与智能魔方建立连接，并开始进行 GATT 服务发现，获取魔方提供的 Service 和 Characteristic 结构
3. **确认协议类型**：
   客户端结合广播信息、Service UUID、特征值等信息，确认具体协议版本，从而选择对应的解析实现
4. **完成协议初始化**：
   不同品牌和协议的初始化过程有所差异，通常包括找到收发数据的 Characteristic、启用 Notify，以及在需要时初始化加密参数、发送设备信息或状态请求
5. **同步初始状态**：
   客户端接收 Characteristic 返回的原始数据，经过解密、校验和解析，取得当前魔方状态、电量、转动序号等基础信息
6. **接收后续数据**：
   连接保持期间，智能魔方会通过 Notify 主动上报转动和姿态等实时事件；完整状态、电量等信息也可由客户端主动请求，再由魔方通过 Notify 返回
7. **应用层处理**：
   协议层将不同协议的数据转换为统一的转动和姿态事件，应用层再根据实际场景进行处理，例如智能计时训练、多人对战或操作映射

### 不同品牌智能魔方以及协议的概述

这里主要对三大品牌（**魔域**，**奇艺**，**GAN**）的智能魔方以及协议进行简单介绍：

 **魔域（MoYu）**：
按时间顺序，协议分为三个版本：
- MHC（2021）：是最早的“威龙 AI ”所使用的协议（那时的 APP 叫魔力之心）
- AiCube（2023）：魔域 AI，第二代智能（无调试系统），实际上使用的协议与 GAN Gen2 一致，同时也推出了新的 APP —— WCU CUBE
- MoYu32（2024）：威龙 V10 AI 及后来的所有智能魔方使用的协议，沿用至今

> 目前在售的基本只有 MoYu32 系列

**奇艺（QiYi）**：
仅一套协议，适用于   QYSC （奇艺智能）以及 Tornado V4（风 AI），后者相比前者多了陀螺仪的上报

**GAN**：
分为四个版本：Gen1、Gen2、Gen3、Gen4
协议与部分魔方型号的对应关系：
- Gen1：GAN356i
- Gen2：GAN Mini ui FreePlay、GAN12 ui FreePlay、GAN12 ui、GAN356 i Carry S、GAN356 i Carry、GAN356 i 3、Monster Go 3Ai（含陀螺仪）
- Gen3：GAN356 i Carry 2
- Gen4：GAN12 ui Maglev、GAN14 ui FreePlay、GAN i4（含陀螺仪）

> 来自 [afedotov/gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth)，其中提到的 “GAN14 ui FreePlay” 存疑 —— 我并未查询到任何有关 GAN 14ui FreePlay 的发售信息

从时间线推测，Gen4 应该是较新的一代产品所使用的协议

## 资料 —— 从哪里开发接入智能魔方

### 推荐的参考资料

- [cstimer](https://github.com/cs0x7f/cstimer)：了解多品牌兼容的整体实现；支持大部分的智能魔方以及智能计时器（暂无陀螺仪适配）
- [bluetooth | cubing.js](https://js.cubing.net/cubing/bluetooth)：cubing.js 蓝牙库，支持大部分智能魔方（MoYu 未支持）以及智能计时器/魔方计时器
- [smartcube-web-bluetooth](https://github.com/poliva/smartcube-web-bluetooth)：适合快速开发 Web POC，可作为库引入，支持大多数智能魔方以及 GAN 智能计时器
- [qiyi_smartcube_protocol](https://codeberg.org/Flying-Toast/qiyi_smartcube_protocol)：适合学习完整逆向分析过程（奇艺智能）
- [lukeburong/weilong-v10-ai-protocol](https://github.com/lukeburong/weilong-v10-ai-protocol)：完整的 V10 AI 协议解析（即 Moyu32 系列）

以上是相对推荐的几个， 还有不少的开源计时器项目涉及到了智能魔方，也有一定的参考价值（感谢开源社区~）

> 参考终究只是参考，具体表现仍然需要通过充分测试来验证

## 取舍 —— 实际技术栈该如何选择

这里主要讨论 Web，Android 和 Windows，以及简单补充 iOS（暂无 mac OS/Linux 开发经验，不作讨论）

![开发平台取舍对比](/blog-assets/BLE/smartcube-platform-tradeoffs.png)

### Web

- 魔方相关**生态丰富**（例如 cubing.js ），方便实现打乱计时、公式处理、状态展示以及部分智能魔方功能
- **开发门槛较低**，发布和更新**方便**，浏览器即可访问，无需额外下载安装
- 受到 Web Bluetooth 的**限制**，无法直接获取设备的 MAC 地址，而部分智能魔方需要 MAC 地址参与解密，从而需要手动获取并填写，连接体验一般
- 可通过 Service Worker 等实现**离线使用**，但需要设计缓存和本地数据管理

### Android（优先推荐）

- Kotlin / Java 可以调用原生 BLE ；Flutter 等跨平台框架也可通过插件调用，因此无需手动填写 MAC 地址，更适合需要**频繁连接智能魔方**的场景
- 作为移动端，更贴合**随手**计时/训练，且可作为**离线**的本地应用
- 开发门槛高于 Web，魔方生态的较多代码需要**移植**实现（反正有 AI）
- 需要经过打包、分发和安装更新流程，**迭代效率低**；作为计时应用时，需要控制开发和发布节奏 —— 频繁更新并不好

如果智能魔方是核心功能，推荐 **Kotlin** + **Jetpack Compose** —— Android 原生 + 现代化 UI 开发  
或者 Kotlin 为主、Java 实现协议核心（即 [RubiKey-Android](https://github.com/huizhiLLL/RubiKey-Android) 所使用的技术栈）

### Windows

特点与 Android 类似，但作为桌面端，有以下几个特点：
- 适合大屏计时/直播、复杂功能界面
- 对**智能魔方更友好**、更现代化的桌面客户端存在一定价值
- 使用场景集中，用户覆盖面小，更适合作为扩展平台

WinUI 3、Tauri 和 Electron 等框架都能够实现 BLE 连接，但实现路径和开发成本存在差异，要补充的两点是：
- **Electron** 内置的蓝牙基于 Web Bluetooth，因此仍然需要手动输入 MAC 地址；也支持通过 Node 原生扩展调用 Windows API，从而实现原生 BLE
- **Tauri** 可以通过 Rust 蓝牙库/插件实现原生 BLE，兼顾 Web UI 开发体验和原生后端能力，应用体积更小，但需要同时处理前端、Rust 与平台能力，整体工程复杂度更高

> WinUI 3 虽然颜值很高，但组件生态、复杂交互能力有限（例如 [SharpTimer](https://github.com/huizhiLLL/SharpTimer)）  
> 对于更完美的桌面级客户端，**Tauri** + **Rust** 是我的理想方案

### iOS

iOS 作为移动端，也有不少用户；  
开发上需要 macOS & Xcode ；上架到 App Store 需要开发者账号，以及材料与审核；  
因此，如果暂无 macOS 设备以及 iOS 开发经验，不建议优先考虑

### 总结

- 以智能魔方的计时训练为关键/主要功能，建议优先 **Android** ，推荐 Kotlin + Jetpack Compose
- 智能魔方作为附加功能，目标是快速上线、多端访问或复用 cubing.js 生态时，**Web** 更合适
- **Windows** 适合作为扩展 —— 采用 Tauri + Rust / C# ，可以实现高颜值、智能魔方友好的桌面客户端，但目标用户规模和开发投入需要评估

## 难点 —— 多品牌兼容过程的真正麻烦

![多品牌兼容性测试覆盖](/blog-assets/BLE/smartcube-compatibility-testing.png)

这里也只讨论三大品牌的兼容，其他品牌（Go，Giiker 等）在国内很少使用：

### 设备准备

在**原理**部分已经初步介绍过三大品牌的协议，如果希望在开发测试阶段对热门的全品牌进行充分适配，那么至少需要 **4~5** 款智能魔方：即 Moyu32，QYSC，Tornado V4，GAN Gen2/Gen4

其中：
- Moyu32 建议准备一款带有陀螺仪的智能魔方；
- Qiyi 虽是一套协议，但两款智能魔方的硬件方案不同，实际表现有差异；
- GAN 智能魔方主要集中在 Gen2/Gen4 也分别建议准备一款具有陀螺仪的设备

如果扩展到智能计时器，三大厂也分别具有，需要额外准备；  
不过智能计时器之间的协议差异我暂未研究，只接入过奇艺智能魔方计时器

### 开发与测试

尽管大部分协议与代码较为成熟，但实际的适配过程中需要考虑边缘情况 —— 不同语言 / 技术栈下的表现有所差异，应当通过多品牌的充分测试来保证稳定性

当前也可通过反馈和日志，选择让拥有对应设备的用户配合测试来进行适配 —— 但效率可想而知

> 我不建议任何未经过充分测试的协议与设备上线

在充分完成本地的多品牌兼容测试之后，也不意味着上线就足够稳 —— 不同型号的设备/系统的表现又会不同 .....容易出现各种神秘的问题，这里不再展开

### 总结

对于多品牌兼容，**测试 > 代码**，测试需要覆盖尽可能全的设备

## 应用 —— 智能魔方映射类项目的核心

对于智能魔方，计时训练 / 专项训练 / 数据分析 往往是主要功能点，但扩展到娱乐部分，映射操作类的项目往往更有意思，更吸引人（也更有流量 bushi）

例如这些映射类项目：
- [「RubiKey」 —— 让智能魔方操控安卓设备](https://www.bilibili.com/video/BV1GUKB61EzF/)
- [什么叫“用智能魔方在 MC 里玩魔方”?](https://www.bilibili.com/video/BV1ZaQmB4EsG/)
- [智能魔方玩地铁跑酷](https://www.bilibili.com/video/BV1uQN86mEHR/)
- [智能魔方+原神=？](https://www.bilibili.com/video/BV1zT411t7Jn/)
- [当智能魔方遇到2048？](https://www.bilibili.com/video/BV1Xtm2BiEPv/)
- [当魔方能控制游戏，也能当游戏手柄](https://www.bilibili.com/video/BV1f4dtYWEh3)

它们的本质/核心都很简单，即前面介绍过的连接过程的应用层处理部分，由一般的计时训练改为外部映射，例如安卓的无障碍服务，Nodejs 的 nut-js，也可以再单独封装 API 来控制智能家具类的硬件 —— 映射层足够自由

![智能魔方映射层架构](/blog-assets/BLE/smartcube-mapping-stack.png)

## 实践 —— 个人项目介绍与展望

### 个人项目介绍

最后夹带私货，简单介绍一下相关的个人项目~

#### [DCTimer-BLE](http://dctimer.huizhi.ink/)

- 基于原版的 DCTimer（Android），兼容原数据导入
- 支持 GAN / 魔域 / 奇艺 智能魔方（包括陀螺仪适配）、奇艺智能计时器、GAN 魔方机器人
- 支持 CFOP / Roux 的解法分段分析
- 适配各种公式专项训练（F2L/OLL/PLL/顶层/CLL/ELL/COLL/EOCP/2GLL/OLLCP/ZZLL/ZBLS/ZBLL、CMLL/LSE/L10P）
- 连接简单，速度很快（2~4s）

已历经两个月，6 个版本的迭代优化，欢迎体验，提出建议~  
软件官网：[DCTimer-BLE —— 支持智能魔方的优化版 DCTimer](https://dctimer.huizhi.ink)  
开源仓库：[huizhiLLL/DCTimer-BLE: 基于 DCTimer，支持智能魔方并改进部分功能](https://github.com/huizhiLLL/DCTimer-BLE)

#### [RubiKey](https://www.bilibili.com/video/BV1GUKB61EzF/)

一个较为简单的映射类项目，即通过无障碍服务让智能魔方操控安卓设备，即可实现智能魔方刷视频、看小说、听音乐、充当游戏手柄（例如地铁跑酷）等操作，同样支持三大品牌智能魔方，欢迎尝试

开源仓库：[huizhiLLL/RubiKey-Android: 智能魔方控制安卓设备](https://github.com/huizhiLLL/RubiKey-Android)  
下载地址：
- [RubiKey-Android | huizhi's OpenList](https://openlist.huizhi.ink/OneDrive/Software/RubiKey-Android)
- [Github Releases · huizhiLLL/RubiKey-Android](https://github.com/huizhiLLL/RubiKey-Android/releases)

> 也是前文已提到的 Kotlin + Java + Jetpack Compose 的技术栈（为了直接复用 DCTimer-BLE 较为成熟的协议层）

### 展望

说是展望，实际上只是个提一嘴的理想需求

即需要一个足够轻量的，多品牌多平台适配的，智能魔方在线对战客户端
不仅解决多品牌下，不同智能魔方无法在线 pk 的需求，也可以解决部分场景下的在线周赛/月赛问题
可以摆脱分品牌 + 腾讯会议等的约束，使用一种非同步实时竞技的在线比赛，同时间段内同打乱异步进行，由于智能魔方，可以自动录入，并高度对接赛事平台

嗯，只是想想，如果真的有人做出一个比较完美的，还是很有价值的......

## 参考资料

- [GATT | Introduction to Bluetooth Low Energy | Adafruit Learning System](https://learn.adafruit.com/introduction-to-bluetooth-low-energy/gatt)
 - [低功耗蓝牙协议(BLE)初探：了解BLE协议的运作原理 - 知乎](https://zhuanlan.zhihu.com/p/658050437)
- [蓝牙BLE: GATT Profile 简介(GATT 与 GAP) - 夜行过客 - 博客园](https://www.cnblogs.com/yongdaimi/p/11507397.html) 
- [gan-web-bluetooth/README.md at main · afedotov/gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth/blob/main/README.md)
