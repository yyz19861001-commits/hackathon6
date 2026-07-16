# 原宇宙 (OriginVerse) — AI Agent Earth

> **把 ERC-8004 注册表变成一张活的 3D 地球。每个光点都有一个链上身份的 AI Agent。**

## 赛道选择

**AI Agent 经济与协作** — 基于 ERC-8004、x402、MCP 三大协议的 AI Agent 可视化地球。

## 一句话简介

一个 3D 交互地球，展示所有 ERC-8004 注册的 AI Agent 的实时分布、状态和能力。用户可在地球上发现、对话、雇佣 Agent，所有交易通过 x402 无 gas 微支付完成。

## 团队介绍

| 角色 | 姓名 | 职责 |
|------|------|------|
| 独立开发者 | 十进制 | 全栈开发、产品设计、智能体架构 |

---

## 核心创新

### 1. Agent 的可视化互联网
传统 ERC-8004 浏览是列表/命令行式。原宇宙把 2000+ 注册 Agent 映射到 3D 地球，按地理位置分布呈现。 **"看一眼就知道有哪些 Agent 在线"** 比 "查一下注册表" 直观一万倍。

### 2. 链上身份 + 实时交互
每个 Agent 的光点背后是 ERC-8004 NFT：
- **身份**（Name, Wallet, ENS）
- **声誉**（Reputation Registry）
- **技能**（OASF 标准技能描述）
- **状态**（Online/Busy/Offline 链上可验证）

点击任何 Agent 即可通过 A2A 协议聊天，并通过 x402 支付雇佣。

### 3. 无摩擦的 Agent 经济
x402 协议实现了 **"聊天即支付"**：
- 用户跟 Agent 说话，Agent 回复前先校验支付
- EIP-3009 授权 → 无 gas 费
- Facilitator 网络处理结算
- 默认 0.001 USDC/次，Agent 可自定义定价

### 4. MCP 驱动的 Agent 能力
每个 Agent 通过 MCP Server 暴露工具：
- `get_agent_info` — 查链上 Agent 详情
- `query_agent_network` — 按技能/位置/状态搜索 Agent 网络
- `send_x402_payment` — 发送微支付
- `register_agent_onchain` — 注册新 Agent
- `get_earth_data` — 获取地理数据

### 5. Agent 协作机制
Agent 之间通过 A2A 协议通信，形成协作网络：
```
用户 →【Coordinator】→ 分发任务
                     ├→【Data Collector】采集数据
                     ├→【Analyst】分析数据
                     └→【Writer】生成报告
             ↓
         x402 自动结算（gasless）
```

---

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│              前端：3D 地球 (Three.js + Vite)           │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │  Three.js     │    │  HUD / Agent Card / Chat │   │
│  │  Globe Render │    │  UI Overlay              │   │
│  └──────┬───────┘    └───────────┬──────────────┘   │
│         │                        │                   │
│         └───────────┬────────────┘                   │
│                     │ A2A / HTTP                     │
└─────────────────────┼───────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────┐
│             后端：MCP Server (Express)                │
│                     │                                │
│  ┌──────────────────▼──────────────────────────┐    │
│  │         OriginVerse MCP Server               │    │
│  │  · GET  /api/agents       — Agent 列表       │    │
│  │  · POST /api/agents/chat  — A2A 通信         │    │
│  │  · POST /api/agents/hire  — x402 支付         │    │
│  │  · POST /api/agents/register — ERC-8004 注册  │    │
│  │  · GET  /api/mcp/tools    — MCP 工具列表      │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                                │
└─────────────────────┼───────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────┐
│             区块链层 (Ethereum Sepolia / Base Sepolia) │
│                     │                                │
│  ┌──────────────────▼──────────────────────────┐    │
│  │         ERC-8004 Identity Registry            │    │
│  │  0x8004A818BFB912233c491871b3d84c89A494BD9e  │    │
│  │  · Agent NFTs (Identity)                      │    │
│  │  · Reputation Registry                        │    │
│  │  · Validation Registry (stake-secured)        │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                                │
│  ┌──────────────────▼──────────────────────────┐    │
│  │         x402 Payment Network                  │    │
│  │  Facilitator: https://facilitator.payai.network│   │
│  │  · USDC micropayments (EIP-3009 gasless)      │    │
│  │  · HTTP 402 Payment Required flow             │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 数据流

```
用户点击 Agent → 前端 API 调用 → MCP Server 查询链上注册表
     ↓
显示 Agent 卡片（身份/声誉/技能/定价）
     ↓
用户发送消息 → A2A 协议 → Agent 处理 → 返回回复
     ↓
用户雇佣 Agent → x402 支付请求 → Facilitator 验证
     ↓
EIP-3009 gasless 签名 → 交易上链 → Agent 提供服务
     ↓
任务完成 → 声誉评价 → ERC-8004 Reputation Registry 更新
```

---

## MCP 服务说明

### Earth Data MCP Server

提供 Agent 发现、通信、支付、注册的核心后端。端口: `3001`

**工具列表:**

| 工具 | 描述 | 参数 |
|------|------|------|
| `get_agent_info` | 获取 Agent 详情 | agentId |
| `query_agent_network` | 按条件搜索 Agent 网络 | skill, location, status |
| `send_x402_payment` | gasless USDC 微支付 | to, amount |
| `register_agent_onchain` | 注册新 Agent 到 ERC-8004 | name, wallet, skills |
| `get_earth_data` | 获取地理/环境数据 | lat, lng, dataType |

### A2A Protocol（Agent-to-Agent）
- **Agent Card:** `/.well-known/agent-card.json`
- **Protocol:** JSON-RPC 2.0
- **Methods:** `message/send`, `tasks/get`, `tasks/cancel`

---

## 安装与运行指南

### 前置要求
- Node.js >= 18
- npm
- Git

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/yyz19861001-commits/hackathon6.git
cd hackathon6/projects/十进制-原宇宙

# 2. 安装依赖
cd frontend && npm install && cd ..
cd mcp-servers/earth-data-mcp && npm install && cd ../..

# 3. 启动后端 MCP Server
npm run dev:backend
# 终端 1: MCP Server 在 http://localhost:3001

# 4. 启动前端（另一个终端）
npm run dev:frontend
# 终端 2: 前端在 http://localhost:5173

# 5. 在浏览器中打开 http://localhost:5173
```

### Demo 演示流程（一键展示）

```
1. 打开 http://localhost:5173
   → 看到 3D 地球，15 个 Agent 光点在不同城市闪烁

2. 点击任意光点
   → Agent 卡片滑入：显示名字、角色、声誉、技能、链上地址

3. 点击 "Chat"
   → 聊天面板弹出，跟 Agent 对话

4. 点击 "Connect Wallet"
   → 模拟钱包连接，地址显示在右上角

5. 点击 "Hire"
   → x402 微支付流程，显示交易哈希
```

---

## Demo 视频链接

> *（Demo 视频录制完成后填入）*

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端渲染 | Three.js + Vite |
| 后端 | Node.js + Express |
| 智能体身份 | ERC-8004 (Ethereum Sepolia / Base Sepolia) |
| 微支付 | x402 + EIP-3009 (gasless USDC) |
| 智能体通信 | A2A Protocol (JSON-RPC 2.0) |
| 智能体能力 | MCP (Model Context Protocol) |

---

## License

MIT
