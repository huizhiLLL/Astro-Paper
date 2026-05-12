---
title: 'Base64 隐写笔记'
pubDatetime: 2025-11-11T15:03:08+08:00
draft: false
featured: false
tags:
  - CTF
  - 编码
  - 安全
description: '关于 Base64 隐写的基本原理、编码规律和一个简短的笔记整理。'
---
## 一、Base64 编码基础

对于 Base64 的编码，我是以 **3 对 4** 来看的，等号即空位。

**等号数量规则：**

- 当 `N % 3 = 1` 时，需要 `2` 个等号（`==`）
- 当 `N % 3 = 2` 时，需要 `1` 个等号（`=`）

其中 `N` 为字符数。

## 二、隐写原理

在 [编码扩展 - Hello CTF](https://hello-ctf.com/hc-misc/Encode_extra/#base64_1) 中，举的例子是 "helo word" 中藏一个 "a" 字符。

**原理：** 两个单词缺失的位，分别 drop 了四个二进制位，再分别填上 "a" 的 ASCII 编码的各一半，从而达到隐写。

### 扩展思路

同理，如果是 **4 个单词**，每个单词都有 1 个等号（即 `n_ = 1`），那么所缺失的位数有 `2 × 4 = 8` 位，也可以容纳一个字符的隐写。

## 三、隐写一句话

如果我们想要隐写一句话，例如：

```
I love you.
```

一共有 **8 个字母**（含空格），如果以第二种方式进行隐写，需要 **32 个** `N % 3 = 2` 的单词。

### 生成表面明文

关于这 32 个表面单词，直接 AIGC 吧，这方面 AIGC 总是十分方便的。

```TXT
请为我生成32个英文单词 要求 每个单词的字母数量和3的余数都为2，
并且可以组成一句或者多句逻辑正常的话语。

好的，我们先明确一下规则。
......
We never think it is possible to go in or at my small place after night. 
He would often do whatever he could under water. 
We shall be up suddenly tomorrow early.
```

## 四、自动化思路

接下来需要把他们批量转 Base64 以及预习把需要隐写的字母转为 ASCII。其实想到这里，就已经可以开始写 Python 自动化了，而不是一点一点算，麻烦且没必要。

### 更灵活的实现方式

此时我又想到，所谓的明文未必需要符合我所说的"每个单词的字母数量和 3 的余数都为 2"要求，因为即便其他单词不符合，都可以将缺失的位数连起来，然后 **8 位一分**进行隐写，解隐写也同样，只要是按照顺序而非乱序的藏隐写字符，都是没问题的。

因此，现在梳理思路进行 Python 的编写。（需要注意的是二者需要满足一定的关系）

### 应用场景

这里又分为几种情况：

1. **AI 生成**：需要的明文由 API 通过 AI 获取
2. **随机组合**：需要的明文计算后由词组随机抽取，得到的句子不包含逻辑

## 五、隐写实现流程

### 流程步骤

1. **输入**：需要隐写的字符或者句子（`steString`）；用来展示的明文（`plainText`）。（先以英文为主）
2. **处理**：将 `steString` 通过 ASCII 转为二进制，明文的单词分别转为 Base64
3. **嵌入**：每个单词对应的 Base64 编码，含有等号的组逆向转为 ASCII，再转为二进制，缺失的位一一填上 `steString` 的二进制
4. **输出**：填完之后，再转回去到 Base64 得到密文

---

## 六、Python 代码实现

> _苦逼的边学边写 Python 中……_

```python
import base64
import random

base64_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
# 输入预处理
steString = input("请输入要隐写的字符串：")
ordString = [format(ord(char), '08b') for char in steString]  # 隐写的二进制字符串
letterarray = ["aa","bb","cc","dd","ee","ff","gg","hh","ii","jj","kk","ll","mm","nn","oo","pp","qq","rr","ss","tt","uu","vv","ww","xx","yy","zz"]
plainText = random.choices(letterarray, k=len(ordString)*4)  # 随机选择单词作为明文（均为2个字母）

base64_stringarray = [base64.b64encode(text.encode('utf-8')).decode('utf-8') for text in plainText]  # 明文base64编码
splitString = [
    bin_string[i:i+2]
    for bin_string in ordString
    for i in range(0, 8, 2)
]
# 分割隐写二进制串为2位一组

thirdString = [format(base64_chars.index(letter[2]), '08b') for letter in base64_stringarray]
new1String = [string[0:6] for string in thirdString]
for i in range(len(new1String)):
    new1String[i] = new1String[i] + splitString[i]
new2String = [base64_chars[int(string, 2)] for string in new1String]
split1String = [string[0:2] for string in base64_stringarray]

resultString = "".join([split1String[i] + new2String[i] + "=" for i in range(len(new2String))])
print("隐写后base64编码：")
print(resultString)
```

### 代码说明

如上，明显很史，但姑且也是靠自己一点一点写出来了，哈哈！

很多实现非常基本繁琐，问过感觉也好麻烦。

先这样，后续再优化（函数包装、UI 加入等等）。


