# 🏛️ Agent Advisors (智能体专家顾问库)

<p align="center">
  <strong>高聚合、深模块的 AI Agent 专家顾问智囊套件。</strong><br>
  借助门面模式（Facade）与三级渐进式披露，终结提示词膨胀与规则流派互搏。
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a> | <a href="README_ZH.md"><strong>简体中文</strong></a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/支持客户端-Claude%20Code%20%7C%20Cursor%20%7C%20Codex%20%7C%20Antigravity-orange.svg" alt="Supported Agents">
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-欢迎提交-brightgreen.svg" alt="PRs Welcome"></a>
</p>

---

## 目录导航

- [为什么需要 Agent Advisors？](#-为什么需要-agent-advisors)
  - [“浅技能”积累的系统性危机](#浅技能积累的系统性危机)
  - [深模块范式（Deep-Module Paradigm）](#深模块范式deep-module-paradigm)
- [核心架构：三级渐进式披露](#-核心架构三级渐进式披露)
- [顾问阵容与演进路线图](#-顾问阵容与演进路线图)
- [快速开始与安装指南](#-快速开始与安装指南)
  - [1. Claude Code (Anthropic 官方 CLI)](#1-claude-code-anthropic-官方-cli)
  - [2. Cursor (主流 AI 编辑器)](#2-cursor-主流-ai-编辑器)
  - [3. OpenAI Codex / CLI](#3-openai-codex--cli)
  - [4. Google Antigravity / Gemini CLI](#4-google-antigravity--gemini-cli)
  - [5. 进阶多端统一管理：cc-switch (次推荐效率方案)](#5-进阶多端统一管理cc-switch-次推荐效率方案)
- [实战工作流示例](#-实战工作流示例)
- [仓库标准规范结构](#-仓库标准规范结构)
- [参与贡献](#-参与贡献)
- [开源协议](#-开源协议)

---

## 💡 为什么需要 Agent Advisors？

### “浅技能”积累的系统性危机
随着 AI 编程助手成为开发者的核心协作工具，社区中涌现了成百上千个零碎的 Prompt 规则与微型技能（Skills）。然而，这种**浅技能堆砌模式**迅速暴露了三大系统性硬伤：

1. **流派打架与认知分裂**：不同的书籍与规则教条互斥（例如极端要求“函数不能超过 3 行”的教条与追求“高内聚、信息隐藏的深模块”理念互相撕裂）。未经仲裁的技能会导致 Agent 在多轮对话中风格随机漂移。
2. **上下文污染与注意力稀释**：几十个分散的技能名称和描述被硬塞进系统 Prompt，严重挤占推理窗口，并极易诱发模型幻觉。
3. **执行阻抗与偷懒漏触发**：长调用链与重叠的技能选项让 Agent 陷入“选择瘫痪”，频繁偷懒甚至完全漏掉该遵守的规范。

### 深模块范式（Deep-Module Paradigm）
受 John Ousterhout 教授名著《软件设计哲学》（*A Philosophy of Software Design*）与经典**门面模式（Facade Pattern）**的启发，`agent-advisors` 重构了 Agent 技能的组织范式：

> **不要散落几十个浅薄的微型规则。将一个重大的技术领域系统性地凝练为一个高杠杆的“专业顾问（Advisor）”——对内自我仲裁分歧，对外向 Agent 暴露零摩擦的纯粹接口。**

---

## 📐 核心架构：三级渐进式披露

本仓库的每一个顾问都严格遵循三级加载架构：

```
Level 1: 元数据层 (Metadata) ── 极度轻量 (约 30 Token)
   │     • 作为带有微推力的高意图触发器注入系统提示词。
   │     • 平时完全静默，零上下文负担，仅在任务相关时精确唤醒。
   ▼
Level 2: 统一仲裁与决策矩阵 (SKILL.md) ── 触发时加载 (约 120 行)
   │     • 包含场景决策矩阵、流派冲突仲裁准则与 Nano 核心硬规则。
   │     • 单次往返直达全局视野，解决 90% 的日常架构与工程决策。
   ▼
Level 3: 深度知识书架 (references/) ── 内部按需定向深潜
         • 存放各大经典原著与权威手册的完整规约，对外完全隐蔽。
         • 既彻底杜绝全局技能列表被污染，又保留了无限的深度知识储备。
```

---

## 📚 顾问阵容与演进路线图

每个顾问独立全权接管并服务于一个完整的大型技术工程领域：

| 顾问名称 (Advisor) | 统摄技术领域 | 状态 | 核心亮点 |
| :--- | :--- | :---: | :--- |
| **[`software-design-advisor`](skills/software-design-advisor/)** | **软件设计与架构工程** | 🟢 **已上线** | 融汇并仲裁 **14 部传世工程经典**（《代码大全》《深模块设计哲学》《重构》《整洁架构》《DDD》《PoEAA》《DDIA》《Release It!》等）。统筹函数粒度、遗留代码接缝与分层边界。 |
| **`frontend-craft-advisor`** | **现代前端与 UI 架构** | 🚧 规划中 | 组件复合范式、无障碍状态机、Design Token 体系、渲染性能极限调优。 |
| **`system-reliability-advisor`** | **分布式系统与 SRE 韧性** | 🚧 规划中 | 混沌工程、分布式追踪、熔断限流舱壁隔离、零停机架构演进。 |
| **`security-guard-advisor`** | **应用安全与纵深防御** | 🚧 规划中 | STRIDE 威胁建模、供应链依赖审计、输入净化与 OWASP Top 10 针对性加固。 |
| **`database-storage-advisor`** | **数据建模与存储引擎** | 🚧 规划中 | 关系索引优化、执行计划剖析、Cache-Aside 策略、分布式一致性与分区分表。 |

---

## 🚀 快速开始与安装指南

根据你主力使用的 Agent 工具选择安装方式（按社区流行度排序）：

### 1. Claude Code (Anthropic 官方 CLI)
将所需顾问软链接到 Claude Code 的技能目录中：
```bash
# macOS / Linux:
mkdir -p ~/.claude/skills
ln -s "$(pwd)/skills/software-design-advisor" ~/.claude/skills/software-design-advisor

# Windows (PowerShell - 请以管理员身份运行):
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

### 2. Cursor (主流 AI 编辑器)
将顾问目录放入或软链接到项目的 `.cursor/skills/`（或在 `.cursorrules` 中配置）：
```bash
mkdir -p .cursor/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor .cursor/skills/software-design-advisor
```

### 3. OpenAI Codex / CLI
将顾问路径添加至 Codex 的工作区说明或注册到活跃技能目录：
```bash
mkdir -p ~/.codex/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor ~/.codex/skills/software-design-advisor
```

### 4. Google Antigravity / Gemini CLI
使用目录联接挂载到 Gemini 配置目录（Windows 下无需管理员提权）：
```powershell
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

### 5. 进阶多端统一管理：`cc-switch` (次推荐效率方案)
如果你在多个客户端（Claude Code、Codex、Antigravity、OpenCode）之间高频切换，可使用 [cc-switch](https://github.com) 统一分发：
1. 复制或软链顾问到 cc-switch 的中心技能库：
   ```powershell
   Copy-Item -Recurse "skills\software-design-advisor" "$HOME\.cc-switch\skills\"
   ```
2. 打开 cc-switch 界面直接勾选启用，它将自动建立符号链接分发给所有激活的 Agent。

---

## 🎬 实战工作流示例

当你输入类似以下指令时：
> *“帮我重构这个老旧的订单结算服务。逻辑很缠绕，但我不能破坏既有业务调用。”*

1. **自动唤醒**：Agent 侦测到重构与架构意图，自动激活 `software-design-advisor`。
2. **仲裁决策**：顾问引导 Agent：
   - 采用 Michael Feathers《修改代码的艺术》的“接缝技术”，在改动前植入特征测试锁定既有行为；
   - 严格遵循《重构》的“两顶帽子原则”，将结构调整与功能变动绝对解耦；
   - 运用《软件设计哲学》消除透传浅类，将碎片化逻辑收敛为高内聚深模块。
3. **结构化交付**：Agent 产出结构严谨的方案：
   - 架构选型与权衡依据（Rationale）
   - 测试安全网保护下的代码实现
   - 六维交付自检清单核验

---

## 📁 仓库标准规范结构

本仓库严格遵循 Agent 技能标准规范（Agent Skills Catalog Specification）：

```text
agent-advisors/
├── .github/                       # GitHub 工作流与社区配置文件
├── skills/                        # 标准技能总目录
│   └── software-design-advisor/   # 软件架构顾问
│       ├── SKILL.md               # 纯正机器可执行纯英接口
│       └── references/            # 私有内部深度知识书架 (14 部经典)
│           ├── code-complete.md
│           ├── a-philosophy-of-software-design.md
│           ├── refactoring.md
│           └── ...
├── CONTRIBUTING.md                # 顾问工程规范与贡献公约
├── LICENSE                        # MIT 开源协议
├── README.md                      # 国际英文主文档
└── README_ZH.md                   # 简体中文主文档
```

---

## 🛠️ 参与贡献

欢迎社区共同打造更多领域的专业顾问！如果你想提议或构建新的 Advisor（如 `frontend-craft-advisor` 或 `security-guard-advisor`），请先阅读 **[贡献指南 (CONTRIBUTING.md)](CONTRIBUTING.md)**。

所有顾问的核心质量红线：
- **单一门面**：一个技术大领域只打造一个复合型顾问，杜绝碎片化；
- **显式冲突仲裁**：必须在列出规则前解决该领域不同学派的矛盾；
- **渐进式披露**：`SKILL.md` 正文控制在 150 行以内的 Nano 规约；深度典籍存入 `references/`；
- **标准英文机器执行**：`SKILL.md` 统一采用精准地道的纯正英文编写，确保各大模型在机器执行时具备最高精度与零歧义。

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源 © 2026 [cqzeng](https://github.com/cqzeng)。
