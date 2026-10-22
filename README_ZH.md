# 🏛️ Agent Advisors (智能体专家顾问库)

<p align="center">
  <strong>高聚合、深模块的 AI Agent 专家顾问智囊套件。</strong><br>
  借助门面模式（Facade）与三级渐进式披露，终结零散规则碎片与系统提示词膨胀。
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
  - [“碎片化浅技能”带来的实际困境](#碎片化浅技能带来的实际困境)
  - [深模块统合范式（Deep-Module Synthesis）](#深模块统合范式deep-module-synthesis)
- [核心架构：三级渐进式披露](#-核心架构三级渐进式披露)
- [顾问阵容目录](#-顾问阵容目录)
- [快速开始与安装指南](#-快速开始与安装指南)
  - [1. Claude Code (Anthropic 官方 CLI)](#1-claude-code-anthropic-官方-cli)
  - [2. Cursor (主流 AI 编辑器)](#2-cursor-主流-ai-编辑器)
  - [3. OpenAI Codex / CLI](#3-openai-codex--cli)
  - [4. Google Antigravity / Gemini CLI](#4-google-antigravity--gemini-cli)
  - [5. 进阶多端统一管理：cc-switch (次推荐效率方案)](#5-进阶多端统一管理cc-switch-次推荐效率方案)
- [实战工作流示例](#-实战工作流示例)
- [仓库标准规范结构](#-仓库标准规范结构)
- [自制专属领域顾问](#-自制专属领域顾问)
- [参与贡献](#-参与贡献)
- [开源协议](#-开源协议)

---

## 💡 为什么需要 Agent Advisors？

### “碎片化浅技能”带来的实际困境
随着 AI 编程助手成为开发者的核心协作伙伴，开发者往往会在本地安装大量零散的 Prompt 片段、规则文件和微型技能（Micro-skills）。在实际生产中，这种**割裂的碎片化配置**带来了三大明显瓶颈：

1. **工程视野割裂**：软件构建是一个有机整体——变量命名、防御性边界、代码重构、遗留代码治理与架构分层并不是孤立互不相干的环节。如果将它们生硬拆散为十几份微型技能，开发者就必须在每个阶段手动挑选和调度对应的技能，极其繁琐。
2. **上下文污染与 Token 浪费**：在系统里同时挂载十几个独立技能，每一轮对话都会把冗长的名字和描述注入系统提示词，不仅挤占宝贵的推理窗口，还会造成模型注意力被严重稀释。
3. **调用摩擦与漏触发**：当候选技能列表过于细碎且存在概念重叠时，Agent 极易陷入决策摩擦，出现偷懒、乱选或完全不触发相应规范的现象。

### 深模块统合范式（Deep-Module Synthesis）
受 John Ousterhout 教授名著《软件设计哲学》（*A Philosophy of Software Design*）与经典**门面模式（Facade Pattern）**的启发，`agent-advisors` 重塑了 Agent 技能的组织形态：

> **告别散落堆砌的零碎微规则。将整个大型工程领域的精髓，高度融汇为一个兼具深度与高杠杆的“专业顾问（Advisor）”——对外暴露极简纯粹的统一接口，对内提供融会贯通的全景工程视野。**

---

## 📐 核心架构：三级渐进式披露

本仓库的每一个顾问都严格遵循三级加载架构：

```
Level 1: 元数据层 (Metadata) ── 高意图唤醒 (约 120-140 Token)
   │     • 作为带有微推力的高意图触发器注入系统提示词。
   │     • 平时完全静默，零上下文负担，仅在任务相关时精确唤醒。
   ▼
Level 2: 统一决策矩阵与核心规则 (SKILL.md) ── 触发时加载 (约 120 行)
   │     • 包含场景决策矩阵、工程权衡考量与 Nano 核心硬规则。
   │     • 单次往返直达全局视野，解决 90% 的日常架构与工程决策。
   ▼
Level 3: 深度参考知识库 (references/) ── 内部按需定向深潜
         • 存放经过提炼的经典工程规约与模式参考，对外完全隐蔽。
         • 既彻底杜绝全局技能列表被污染，又保留了无限的深度知识储备。
```

---

## 📚 顾问阵容目录

| 顾问名称 (Advisor) | 统摄技术领域 | 状态 | 核心亮点 |
| :--- | :--- | :---: | :--- |
| **[`software-design-advisor`](skills/software-design-advisor/)** | **软件设计与架构工程** | 🟢 **已上线** | 融会贯通 **8 大核心工程领域**的经典文献（包括《代码大全》《深模块设计哲学》《重构》《整洁架构》《DDD》《PoEAA》《DDIA》《Release It!》与 Refactoring.Guru 权威索引）。统筹函数构造、坏味道消除、遗留系统接缝治理与架构分层。 |
| **[`advisor-creator`](skills/advisor-creator/)** | **元工程与领域技能合成引擎** | 🟢 **已上线** | 内置的元顾问孵化引擎，提供标准 5 步流水线，用于将散乱的领域规范、行业标准或私有代码规约，全自动提炼生成为标准的深模块顾问。 |

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
如果你在多个客户端（Claude Code、Codex、Antigravity、OpenCode）之间高频切换，可使用 [cc-switch](https://github.com/farion1231/cc-switch) 统一分发：
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
2. **多维工程协同**：顾问引导 Agent 综合运用多部经典智慧：
   - 运用 Michael Feathers《修改代码的艺术》的“接缝技术”，在修改前植入特征测试锁定既有行为；
   - 遵循 Martin Fowler《重构》的“两顶帽子原则”，将结构调整与功能变动绝对解耦；
   - 运用《软件设计哲学》消除透传浅类，将碎片化逻辑收敛为高内聚深模块；
   - 运用《代码大全》在外部输入边界做好防御性校验。
3. **结构化交付**：Agent 产出结构严谨的方案：
   - 架构选型与权衡依据（Tradeoffs & Rationale）
   - 测试安全网保护下的代码实现
   - 六维交付自检清单核验

---

## 📁 仓库标准规范结构

```text
agent-advisors/
├── .github/                       # GitHub 工作流与社区配置文件
├── skills/                        # 标准技能总目录
│   ├── software-design-advisor/   # 软件架构综合顾问
│   │   ├── SKILL.md               # 机器可执行纯英接口
│   │   └── references/            # 内部深度知识书架 (14 部经典)
│   └── advisor-creator/           # 元顾问合成引擎
│       ├── SKILL.md               # 5 步流水线规约
│       └── references/            # 顾问生成母版脚手架
├── CONTRIBUTING.md                # 顾问工程规范与贡献公约
├── LICENSE                        # MIT 开源协议
├── README.md                      # 国际英文主文档
└── README_ZH.md                   # 简体中文主文档
```

---

## 🛠️ 自制专属领域顾问

如果你有自己团队特有的架构规范、安全合规基线或私有领域标准，可直接调用内置的 **`advisor-creator`** 元技能来生成专属顾问：

```text
用户：“调用 advisor-creator，把我们团队的 API 设计规范与安全开发指南，合成为一个 api-standards-advisor。”
```

引擎将自动引导你完成领域映射、权衡分析、Nano 规则蒸馏与渐进式披露脚手架的构建。

---

## 🤝 参与贡献

欢迎社区共同贡献高质量的领域顾问！在提交 Pull Request 前，请先阅读 **[贡献指南 (CONTRIBUTING.md)](CONTRIBUTING.md)**。

所有顾问的核心质量要求：
- **单一门面**：一个技术大领域只打造一个复合型顾问，拒绝散碎微规则；
- **渐进式披露**：`SKILL.md` 正文控制在 150 行以内的 Nano 规约；深度典籍存入 `references/`；
- **因果阐释（Explain the Why）**：用工程权衡与因果关系说明约束，杜绝死板的空洞命令；
- **标准英文机器执行**：`SKILL.md` 统一采用精准地道的纯正英文编写，确保各大模型在机器执行时具备最高精度与零歧义。

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源 © 2026 [cqzeng](https://github.com/cqzeng)。
