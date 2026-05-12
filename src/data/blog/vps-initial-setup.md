---
title: '拿到一台 VPS 后的初始化'
pubDatetime: 2026-01-24T18:28:21+08:00
draft: false
featured: false
tags:
  - VPS
  - Linux
  - 运维
description: '记录拿到 VPS 之后的初始化流程、基础工具安装、BBR 开启和常用配置。'
---
> **注：** 本篇记录以 Debian 12 为例且为个人偏好，仅供参考

## 1. 通过 SSH 客户端连接主机

通过 Xshell、Xpipe、Termus 等 SSH 客户端连接上主机。

## 2. 更新 & 基础工具安装

```bash
apt update && apt upgrade -y  # 更新包索引并升级

apt install -y curl wget git vim unzip tar sudo htop btop  # 安装工具（根据需求取舍）
```

## 3. 开启 BBR（减少丢包，加速）

```bash
echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf  # 配置

sysctl -p  # 生效

lsmod | grep bbr  # 验证
```

## 4. 设置虚拟内存

```bash
# 创建 2G swap 文件
dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
# 写入开机自动挂载
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 5. 部署面板（1Panel）

```bash
bash -c "$(curl -sSL https://resource.fit2cloud.com/1panel/package/v2/quick_start.sh)"
# 以 root 身份运行
```

## 6. （可选）自定义主机名

即改变 `root@xxx:` 中 `@` 后的内容 `xxx`。

```bash
# 语法: hostnamectl set-hostname <新名字>
hostnamectl set-hostname huizhi-vps

vim /etc/hosts
# 进入后修改 127.0.1.1 对应的名称为自定义的主机名（与上方保持一致）
# 插入模式下输出 ':wq' 保存并退出

exec bash  # 修改后刷新
```


