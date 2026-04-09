# ⚡ Magic-IP

> **一款为极致速度而生的深色赛博朋克风 Cloudflare 边缘节点优选工具。**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-29.1.5-brightgreen.svg)](https://www.electronjs.org/)
[![Node](https://img.shields.io/badge/Node-16+-orange.svg)](https://nodejs.org/)

Magic-IP 基于 Node.js 和 Electron 打造，旨在通过并发 TCP Ping 检测，在您的本地网络环境下，智能筛选出延迟最低、连通性最强的 Cloudflare 官方 CDN 节点 IP。

---

## ✨ 核心特性

- 🚀 **超高性能**：采用 Node.js 原生 Socket 异步探测，支持高并发 TCP 测试。
- 🎨 **精美 UI**：深色赛博朋克风格界面，实时动画反馈及数据可视化面板。
- 🔍 **多维过滤**：支持自定义并发数、网段采样频率、延迟阈值以及 **目标机房 (Colo)** 锁定。
- 🖥️ **双模运行**：既可以作为独立桌面应用（Electron），也可以作为轻量化 Web 服务运行。
- 📊 **实时统计**：扫描过程中实时展示当前最优节点及网络波动状态。

---

## 🚀 快速启动

### 1. 环境准备
确保您的计算机已安装 **Node.js (v16 或更高版本)**。

### 2. 安装依赖
克隆或下载本项目至本地，随后在 `magic-ip` 目录下打开终端执行：
```bash
npm install
```

### 3. 选择运行模式

#### 模式 A：桌面应用模式 (推荐)
提供沉浸式无边框窗口体验，适合日常调优使用。
```bash
npm run electron-start
```

#### 模式 B：Web 浏览器模式
启动轻量级后端，通过浏览器访问 UI 界面。
```bash
npm start
```
*启动后请访问：`http://localhost:3000`*

---

## ⚙️ 核心参数详细说明

| 参数名称 | 建议值 | 说明 |
| :--- | :--- | :--- |
| **CONCURRENCY** | `20 - 50` | **探测并发数**。较高的并发能缩短总时长，但可能导致本地路由器假死。 |
| **SPL (Sampling)** | `50 - 200` | **网段抽样数**。从每个官方 CIDR 中抽取的样本量，越大覆盖面越广。 |
| **T_OUT (Timeout)** | `200ms` | **最大延迟阈值**。超过该延迟的节点会被自动剔除。 |
| **TARGET COLO** | `ANY` / `ICN` | **目标机房识别**。如锁定 `ICN` (首尔) 或 `NRT` (东京) 以优化特定线路。 |

> **⚠️ 注意**：`Colo` 识别依赖于 Cloudflare 的 Trace 响应，某些网络环境下可能会产生波动。

---

## 📦 打包发布

如果您需要将此工具分发给非开发人员使用，可以将其编译为独立的 `.exe` 可执行文件：

```bash
npm run build
```

- **编译产物**：打包完成后，可在 `release-app/` 目录下找到 `Magic-IP-win32-x64` 文件夹。
- **运行**：双击运行 `Magic-IP.exe` 即可，无需安装 Node.js 环境。

---

## 📂 目录结构说明

- `lib/`: **[核心脚本]** 包含 IP 扫描逻辑与 Cloudflare 常量数据。
- `public/`: **[静态资源]** 前端页面、样式及交互逻辑。
- `main.js`: Electron 主进程入口。
- `server.js`: Web 服务模式后端入口。
- `.gitignore`: 排除不必要的构建产物及依赖。

---

## ⚖️ 免责声明

本工具仅用于网络技术研究与个人网络连通性优化测试，请在遵守当地法律法规的前提下使用。开发者不对任何因使用本工具导致的封禁或损失负责。

---

© 2026 Magic-IP | Made with ❤️ for Performance.
