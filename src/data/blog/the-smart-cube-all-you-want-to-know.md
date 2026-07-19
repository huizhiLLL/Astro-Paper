---
title: 从原理到应用：智能魔方开发全景指南
pubDatetime: 2026-08-17T12:00:00+08:00
draft: true
featured: true
tags:
  - 智能魔方
  - 开发
  - 指南
description: 关于智能魔方的接入，你想知道的所有
---
> 人工撰写，可放心食用~

## 背景与前言

过去半年多，我先后尝试在 Web、Android 和 Windows 平台接入智能魔方，并将其应用于智能计时适配、操作映射等场景。

本文不详细拆解协议，也不包含大量代码，会从实际开发出发，介绍智能魔方的连接原理、开发资料、技术栈选择、多品牌兼容，以及协议之上的应用方式。（默认指智能三阶）

以下是内容大纲，可按需阅读：

- 原理—— 一次完整连接是怎样发生的
- 资料 —— 从哪里开发智能魔方
- 取舍 —— 实际技术栈该如何选择
- 难点 —— 多品牌兼容过程的真正麻烦
- 应用 —— 智能魔方映射类项目的核心
- 实践 —— 个人项目介绍与一些展望

难免存在纰漏，欢迎指出，一起交流~

## 原理 —— 一次完整连接是怎样发生的

### 基础概念

- BLE（**B**luetooth **L**ow **E**nergy），即低功耗蓝牙，在 Bluetooth 4.0 引入，能够在维持相对低的功耗的同时实现通信，也就是智能魔方普遍采用的通信方式。

- MAC 地址：BLE 通信中用于标识和寻址设备的 48 位地址，格式例如：`D0:AB:12:34:56:78`。智能魔方的 MAC 地址通常随出厂固定，部分协议会使用 MAC 地址参与加密参数的生成。

- GATT（**G**eneric **ATT**ribute Profile），是 BLE 连接建立后的数据访问框架。
  外设，也就是智能魔方，通过 Service 和 Characteristic 组织数据，中心设备（例如手机/电脑）通过服务发现、读取、写入和订阅通知完成通信；具体字节代表什么，则由智能魔方的厂商协议决定。

### 连接过程

1. **扫描和识别**：
   客户端扫描附近的 BLE 广播设备，根据设备名称、Service UUID、Manufacturer Data 等信息，初步判断魔方品牌和协议类型，例如 Moyu32、GAN、QiYi。
2. **建立 BLE 连接**：
   用户选择设备后，客户端与智能魔方建立连接，并开始进行 GATT 服务发现，获取魔方提供的 Service 和 Characteristic 结构
3. **确认协议类型**：
   客户端结合广播信息、服务 UUID、特征值、设备型号或初始化响应，进一步确认具体协议版本，从而选择对应的通信和解析实现。
4. **完成协议初始化**：
   不同品牌和协议的初始化过程有所差异，通常包括找到收发数据的 Characteristic、启用 Notify，以及在需要时初始化加密参数、发送设备信息或状态请求。
5. **同步初始状态**：
   客户端接收 Characteristic 返回的原始数据，经过解密、校验和解析，取得当前魔方状态、电量、转动序号等基础信息。
6. **接收后续数据**：
   连接保持期间，智能魔方会通过 Notify 主动上报转动和姿态等实时事件。完整状态、电量等信息也可能由客户端主动请求，再由魔方通过 Notify 返回。
7. **应用层处理**：
   协议层将不同品牌的数据转换为统一的转动、状态和姿态事件，应用层再根据实际场景进行处理，例如智能计时、训练分析、多人对战或操作映射。

### 不同品牌智能魔方以及协议的发展

这里顺便对三大品牌（**魔域**，**奇艺**，**GAN**）的智能魔方以及协议发展进行介绍：

 **魔域（MoYu）**：
按时间顺序，协议分为三个版本：
- MHC（2021）：是最早的 威龙 AI 所使用的协议（那时的 APP 叫魔力之心）
- AiCube（2023）：魔域AI，第二代智能（无调试系统），实际上使用的协议与 GAN Gen2 一致，同时也推出了新的 APP —— WCU CUBE
- MoYu32（2024）：威龙 V10 AI 及后来的所有智能魔方使用的协议，沿用至今

> 目前在售的基本只有 MoYu32 系列

**奇艺（QiYi）**：
仅一套协议，适用于   QYSC （奇艺智能）以及风 AI（Tornado V4），后者相比前者多了陀螺仪的上报

**GAN**：
分为四个版本：Gen1、Gen2、Gen3、Gen4
协议与部分魔方型号的对应关系：
- Gen1：GAN356i
- Gen2：GAN Mini ui FreePlay、GAN12 ui FreePlay、GAN12 ui、GAN356 i Carry S、GAN356 i Carry、GAN356 i 3、Monster Go 3Ai（含陀螺仪）
- Gen3：GAN356 i Carry 2
- Gen4：GAN12 ui Maglev、GAN14 ui FreePlay、GAN i4（含陀螺仪）

> 来自 [afedotov/gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth)，其中提到的 “GAN14 ui FreePlay” 存疑 —— 我并未查询到任何有关 GAN 14ui FreePlay 的发售信息

从时间线推测，Gen4 应该是较新的一代产品所使用的协议

## 资料 —— 从哪里开发智能魔方

### 生态

从开源、独立开发的视角来看，国内的生态相对较弱
目前支持智能魔方的计时器项目，无论是 Web、Android 还是 iOS，大多均为非中文项目，对国内魔方玩家并不友好，加上社交生态一定程度上的隔离，许多优秀的项目/应用，难以进入国内魔方圈。

### 开发时，建议的参考资料

- [cstimer](https://github.com/cs0x7f/cstimer)：了解多品牌兼容的整体实现；支持大部分的智能魔方以及智能计时器（暂无陀螺仪适配）
- [bluetooth | cubing.js](https://js.cubing.net/cubing/bluetooth)：cubing.js 蓝牙库，支持大部分智能魔方（MoYu 未支持）以及智能计时器/魔方计时器
- [smartcube-web-bluetooth](https://github.com/poliva/smartcube-web-bluetooth)：适合快速开发 Web POC，可作为库引入，支持大多数智能魔方以及 GAN 智能计时器
- [qiyi_smartcube_protocol](https://codeberg.org/Flying-Toast/qiyi_smartcube_protocol)：适合学习完整逆向分析过程（奇艺智能）
- [lukeburong/weilong-v10-ai-protocol](https://github.com/lukeburong/weilong-v10-ai-protocol)：完整的 V10 AI 协议解析（即 Moyu32 系列）

......

## 取舍 —— 实际技术栈该如何选择

关于技术栈的选取：
- Web，代码资料相对多，还有库方便接入。但受到浏览器沙盒的限制（无法直接拿到蓝牙设备的 MAC 地址），蓝牙连接上经常需要手动输入 MAC 地址，对用户不友好
- Windows/Android 原生蓝牙，技术栈丰富，不易找到对应语言/技术栈的成熟实现，需要自己迁移/重写（AI 便利），原生能力能直接拿到 MAC 地址，而无需用户手动输入，更友好（推荐）

## 难点 —— 多品牌兼容过程的真正麻烦

多品牌兼容：
- 测试 > 代码：在 AI 的加持下，将一个语言下的实现重写为另一个实现并不困难，即便参考代码足够成熟，但仍然需要充分测试通过验证（不同技术栈下可能会有不同的表现而造成小bug）
- 设备的准备：想要多品牌兼容，建议拥有/借有对应的蓝牙设备，这并不容易 —— 需要大量的资源
  当然也可以选择不断的让真正有对应设备的用户配合来测试 —— 这往往更加麻烦，但仍然可行

## 应用 —— 智能魔方映射类项目的核心

智能魔方不仅可以用来计时训练，也可以作为一个特殊的交互客户端：
游戏操控，智能家居控制.....

关于应用层：
抛开蓝牙计时训练不说，在例如“智能魔方玩神庙逃亡/地铁跑酷/智能家居”的实现上，本质上均是“协议适配”+“应用层映射操作”
例如安卓端的无障碍服务映射为全局手势来控制游戏，智能家居可通过 ESP32 相关来实现（硬件上自由度也很高 本篇不作展开）

## 实践 —— 个人项目介绍与一些展望

- [DCTimer-BLE](http://dctimer.huizhi.ink/)：原生 Android Java
- [SharpTimer](https://github.com/huizhiLLL/SharpTimer)：WinUI3 + .NET + C#
- [RubiKey](https://github.com/huizhiLLL/RubiKey)：Electron（React + TS）
- [RubiKey-Android](https://github.com/huizhiLLL/RubiKey-Android)：Kotlin + Jetpack Compose Material 3 + Java 协议层
- [Smart-Cube-Games](https://github.com/huizhiLLL/Smart-Cube-Games)：Web（TS）

### 参考资料

- [GATT | Introduction to Bluetooth Low Energy | Adafruit Learning System](https://learn.adafruit.com/introduction-to-bluetooth-low-energy/gatt)
- [低功耗蓝牙协议(BLE)初探：了解BLE协议的运作原理 - 知乎](https://zhuanlan.zhihu.com/p/658050437)
- [蓝牙BLE: GATT Profile 简介(GATT 与 GAP) - 夜行过客 - 博客园](https://www.cnblogs.com/yongdaimi/p/11507397.html) 
- [gan-web-bluetooth/README.md at main · afedotov/gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth/blob/main/README.md)
- 