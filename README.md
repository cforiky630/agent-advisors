# 🏛️ Agent Advisors

<p align="center">
  <strong>A curated suite of unified, deep-module AI agent advisors.</strong><br>
  <strong>高聚合、深模块的 AI Agent 专家顾问智囊套件。</strong>
</p>

<p align="center">
  <a href="#english"><img src="https://img.shields.io/badge/Language-English-blue.svg" alt="English"></a>
  <a href="#chinese"><img src="https://img.shields.io/badge/语言-中文简体-red.svg" alt="Chinese"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Agents-Claude%20Code%20%7C%20Cursor%20%7C%20Codex%20%7C%20Antigravity-orange.svg" alt="Supported Agents">
</p>

---

<a name="english"></a>
## English

### 💡 Why Agent Advisors?

As AI coding agents become the default development companion, developers increasingly import dozens of fragmented rules and community skills. However, this **"Shallow Skills" paradigm** rapidly leads to three critical failure modes:

1. **Philosophy Clashes & Cognitive Dissonance**: Different rules preach conflicting dogma (e.g., dogmatic 3-line functions vs. cohesive deep modules), causing the agent to vacillate wildly between inconsistent styles.
2. **Context Window Bloat**: Cramming dozens of individual skill names and descriptions into the system prompt dilutes attention and eats up precious reasoning tokens.
3. **Execution Friction & Undertriggering**: Fragile, nested skill-chains cause models to either get confused, pick randomly, or lazily skip loading rules altogether.

**`agent-advisors` re-architects agent capabilities using Software Engineering's Facade Pattern and Three-Level Progressive Disclosure.**  
Instead of hundreds of fragile micro-skills, we consolidate major technical problem spaces into **cohesive, domain-specific Advisors** that arbitrate conflicts internally and expose a zero-friction interface.

---

### 📐 The Deep-Module Architecture

Each advisor in this repository is built as a **Deep Module** (simple interface, profound implementation):

```
Level 1: Metadata (Always In Context) ── Ultra-light (~30 Tokens)
   │     • Injected into system prompts as an intent-rich, pushy trigger.
   │     • Zero context bloat; stays completely dormant until needed.
   ▼
Level 2: Unified Brain & Arbitration (SKILL.md) ── Loaded on Trigger (~150 Lines)
   │     • Scenario decision matrix, cross-school clash arbitration, and nano rulesets.
   │     • Solves 90% of architectural and technical decisions in a single round-trip.
   ▼
Level 3: Deep Knowledge Repositories (references/) ── Deep Dive On-Demand
         • Comprehensive canonical texts and complete handbooks kept completely private.
         • Prevents global skill namespace pollution while preserving full depth.
```

---

### 📚 The Advisors Catalog & Roadmap

Each advisor takes full ownership of an entire technical discipline:

| Advisor | Domain | Status | Key Highlights |
| :--- | :--- | :---: | :--- |
| **[`software-design-advisor`](skills/software-design-advisor/)** | **Software Architecture & Construction** |  Active | Synthesizes **14 foundational classics** (*Code Complete, Deep Modules, Refactoring, Clean Architecture, DDD, PoEAA, DDIA, Release It!*). Arbitrates granularity, seams, and boundaries. |
| **`frontend-craft-advisor`** | **Modern Web & UI Architecture** | 🚧 Planned | Component composition, accessible state machines, design token systems, performance rendering optimization. |
| **`system-reliability-advisor`** | **SRE & Distributed Systems** | 🚧 Planned | Chaos engineering, distributed tracing, circuit breaking, bulkhead partitioning, zero-downtime migrations. |
| **`security-guard-advisor`** | **AppSec & Defense-in-Depth** | 🚧 Planned | Threat modeling (STRIDE), supply-chain audit, input hygiene, OWASP Top 10 mitigation. |
| **`database-storage-advisor`** | **Data Modeling & Storage Engine** | 🚧 Planned | Relational index tuning, query plan analysis, cache-aside strategies, distributed consensus and partitioning. |

---

### 🚀 Installation Guide

Choose the method matching your primary agent workflow (ordered by popularity):

#### 1. Claude Code (Anthropic CLI)
Symlink the desired advisor directly into Claude Code's skills directory:
```bash
mkdir -p ~/.claude/skills
# On macOS / Linux:
ln -s "$(pwd)/skills/software-design-advisor" ~/.claude/skills/software-design-advisor

# On Windows (PowerShell - run as Administrator):
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

#### 2. Cursor
Place or symlink the advisor directory into your project's `.cursor/skills/` (or configure via `.cursorrules` / project rules):
```bash
mkdir -p .cursor/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor .cursor/skills/software-design-advisor
```

#### 3. OpenAI Codex / CLI
Add the advisor path to your Codex workspace instructions or register it under your active skills catalog:
```bash
mkdir -p ~/.codex/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor ~/.codex/skills/software-design-advisor
```

#### 4. Google Antigravity / Gemini CLI
Link into your Gemini configuration directory:
```powershell
# Windows PowerShell (Junction - does NOT require elevation):
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

#### 5. Power Users: Multi-Agent Management with `cc-switch` (Secondary Recommendation)
If you manage multiple agents simultaneously (Claude Code, Codex, Antigravity, OpenCode), use [cc-switch](https://github.com) for centralized distribution:
1. Copy or link advisors into the cc-switch central skills store:
   ```powershell
   Copy-Item -Recurse "skills\software-design-advisor" "$HOME\.cc-switch\skills\"
   ```
2. Open cc-switch GUI, toggle on the advisor, and it will be dispatched seamlessly across all your active agents.

---

### 🛠️ Contributing New Advisors

We welcome contributions! Any new advisor must adhere to our deep-module charter:
1. **Single Unified Facade**: Never fragment a domain into dozens of micro-skills. Build one cohesive advisor with a clear decision matrix.
2. **Explicit Arbitration**: Explicitly arbitrate ideological conflicts between different schools of thought.
3. **Progressive Disclosure**: Keep `SKILL.md` under 200 lines of nano-rules; store deep treatises in `references/`.
4. **Bilingual Delivery**: Provide both canonical English (`SKILL.md` for deterministic machine execution) and Chinese companion (`SKILL_ZH.md` for human exploration).

---

<a name="chinese"></a>
## 中文说明

### 💡 为什么需要 Agent Advisors？

随着 AI 编程助手成为开发者的日常标配，社区涌现了大量零散规则与技能。然而，这种**“碎片化浅技能（Shallow Skills）”**范式迅速暴露了三大硬伤：

1. **流派打架与认知分裂**：各方规则教条互斥（例如极端要求“函数不能超过 3 行”的教条与追求“高内聚深模块”的设计互掐），导致 Agent 前后生成的代码风格割裂。
2. **上下文污染（Context Bloat）**：几十个分散的技能名称和描述塞进系统提示词，不仅挤占宝贵的推理窗口，还会造成模型注意力严重稀释。
3. **执行阻抗与偷懒漏触发**：长调用链或过多重叠选项会让 Agent 陷入“选择瘫痪”，频繁偷懒甚至完全漏掉该调用的规范。

**`agent-advisors` 采用经典软件工程的“门面模式（Facade）”与“三级渐进式披露（Progressive Disclosure）”重塑了这一体验。**  
我们告别了散乱浅薄的微型 Prompt，而是将每一个重大技术领域系统性地凝练为**独当一面的领域“专业顾问（Advisor）”**——内部自我仲裁分歧，对外提供无摩擦的统一接口。

---

### 📐 核心架构：深模块与三级渐进式披露

本仓库的每一个顾问都遵循严格的 **深模块（Deep Module）** 工程哲学（极简的外表，极深的内涵）：

```
Level 1: 元数据层 (Metadata) ── 极度轻量 (约 30 Token)
   │     • 注入系统提示词，平时完全静默，零上下文负担。
   │     • 仅在触发特定领域的复杂任务时被精确唤醒。
   ▼
Level 2: 统一仲裁与决策矩阵 (SKILL.md) ── 触发时加载 (约 150 行)
   │     • 给出场景选型矩阵、流派冲突仲裁准则与 Nano 核心硬规则。
   │     • 一次往返直达全局视野，解决 90% 的日常架构与工程决策。
   ▼
Level 3: 深度知识书架 (references/) ── 内部按需定向深潜
         • 存放各大经典原著与权威手册的完整规约，对外完全隐蔽。
         • 既彻底杜绝全局技能列表被污染，又保留了无限的深度知识储备。
```

---

### 📚 顾问目录与演进路线图

每一个 Advisor 全权接管并服务于一个独立的技术大领域：

| 顾问名称 (Advisor) | 统摄技术领域 | 状态 | 核心亮点 |
| :--- | :--- | :---: | :--- |
| **[`software-design-advisor`](skills/software-design-advisor/)** | **软件设计与架构工程** |  已上线 | 融汇并裁决 **14 部传世工程经典**（《代码大全》《深模块设计哲学》《重构》《整洁架构》《DDD》《PoEAA》《DDIA》《Release It!》等）。统筹代码粒度、接缝治理与架构边界。 |
| **`frontend-craft-advisor`** | **现代前端与 UI 架构** | 🚧 规划中 | 组件复合范式、无障碍状态机、Design Token 体系、渲染性能极限调优。 |
| **`system-reliability-advisor`** | **分布式系统与 SRE 韧性** | 🚧 规划中 | 混沌工程、分布式追踪、熔断限流舱壁隔离、零停机架构演进。 |
| **`security-guard-advisor`** | **应用安全与纵深防御** | 🚧 规划中 | STRIDE 威胁建模、供应链依赖审计、输入净化与 OWASP Top 10 针对性加固。 |
| **`database-storage-advisor`** | **数据建模与存储引擎** | 🚧 规划中 | 关系索引优化、执行计划剖析、Cache-Aside 策略、分布式一致性与分区分表。 |

---

### 🚀 安装与使用指南

根据你主力使用的 Agent 工具选择安装方式（按社区热门流行度排序）：

#### 1. Claude Code (Anthropic 官方 CLI)
直接将所需顾问软链接到 Claude Code 的技能目录中：
```bash
mkdir -p ~/.claude/skills
# macOS / Linux:
ln -s "$(pwd)/skills/software-design-advisor" ~/.claude/skills/software-design-advisor

# Windows (PowerShell - 管理员权限):
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

#### 2. Cursor (主流 AI 编辑器)
将顾问目录放入或软链接到项目的 `.cursor/skills/`（或在 `.cursorrules` 中配置）：
```bash
mkdir -p .cursor/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor .cursor/skills/software-design-advisor
```

#### 3. OpenAI Codex / CLI
将顾问路径添加至 Codex 的工作区说明或注册到活跃技能目录：
```bash
mkdir -p ~/.codex/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor ~/.codex/skills/software-design-advisor
```

#### 4. Google Antigravity / Gemini CLI
使用目录联接挂载到 Gemini 配置目录（Windows 下无需提权）：
```powershell
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

#### 5. 进阶多端统一管理：`cc-switch`（次推荐效率方案）
如果你日常在多个客户端（Claude Code、Codex、Antigravity、OpenCode）之间高频切换，可使用 [cc-switch](https://github.com) 集中分发：
1. 复制或软链顾问到 cc-switch 的技能库：
   ```powershell
   Copy-Item -Recurse "skills\software-design-advisor" "$HOME\.cc-switch\skills\"
   ```
2. 打开 cc-switch 界面直接勾选启用，它将自动建立符号链接分发给所有激活的 Agent。

---

### 🛠️ 参与贡献新顾问

欢迎提交新的领域顾问！每个新 Advisor 必须严格遵循深模块公约：
1. **单一统一门面**：严禁在一个领域拆散为几十个琐碎小技能。必须打造一个包含清晰决策矩阵的复合顾问。
2. **显式冲突仲裁**：必须在文档中明确解决该领域不同流派之间的理论矛盾。
3. **渐进式披露控制**：`SKILL.md` 正文控制在 200 行以内的 Nano 规约；完整学术专著存入 `references/`。
4. **双语规范交付**：同时提供纯正地道英文版（`SKILL.md`，保障机器执行的最高精度）和中文参考版（`SKILL_ZH.md`，方便人类阅读与维护）。

---

## 📄 License

MIT License © 2026 [cqzeng](https://github.com/cqzeng)
