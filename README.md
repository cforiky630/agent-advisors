# 🏛️ Agent Advisors

> **From Fragmented Skills to Unified Advisors.**  
> 告别散乱碎片与规则互搏，为 AI Agent 打造的高聚合、深模块专业顾问团。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Compatible With](https://img.shields.io/badge/Agents-Claude%20Code%20%7C%20Codex%20%7C%20Antigravity%20%7C%20Cursor-orange)](#)

---

## 💡 Why Agent Advisors? (为什么需要它？)

随着 AI Agent 技能（Skills）的普及，开发者通常会从社区引入大量零散的规则与技能。但这种**“碎片化浅技能（Shallow Skills）”**往往带来三大灾难：

1. **规则冲突与精神分裂**：不同流派的书籍与规则互相打架（例如追求极短 3 行函数的流派 vs 追求深模块封装的流派），导致 Agent 前后输出风格割裂；
2. **上下文污染（Context Bloat）**：几十个技能的名字与描述硬塞进系统 Prompt，严重挤占推理窗口，还会导致注意力稀释；
3. **偷懒与漏触发**：长链条、套娃式的技能调用让 Agent 频繁偷懒或在多个同类技能前陷入“选择瘫痪”。

**`agent-advisors` 采用经典软件工程的“门面模式（Facade）”与“三级渐进式披露（Progressive Disclosure）”重塑了这一体验：**
我们将每个大领域（软件设计、系统可靠性、前端架构、安全治理）的海量经典智慧，深度聚合为一个个**独当一面的“专业顾问（Advisor）”**。

---

## 📐 Architecture: Three-Level Progressive Disclosure (三级渐进式披露架构)

每一个 Advisor 都遵循严格的深模块工程标准：

```
Level 1: 元数据层 (Metadata) ── 极度轻量 (几十 Token)
   │     • 永远常驻系统 Prompt，平时完全静默
   │     • 仅在触发特定领域的复杂设计时精准唤醒
   ▼
Level 2: 统一仲裁与决策矩阵 (SKILL.md) ── 触发时加载 (100~200 行)
   │     • 给出场景选型矩阵，统一流派哲学冲突，解决 90% 的日常决策
   │     • 单次调用即可直达全局视野，毫秒级响应
   ▼
Level 3: 深度知识书架 (references/) ── 内部私有深度库 (按需定向深潜)
         • 各大经典著作的完整规范仅作为内部私有参考资料存放
         • 彻底杜绝全局技能列表被污染
```

---

## 📚 The Advisors (顾问阵容)

| 顾问名称 (Skill Name) | 统摄领域 / 经典著作 | 适用核心场景 |
| :--- | :--- | :--- |
| **[`software-design-advisor`](skills/software-design-advisor/)** | 《代码大全》《重构》《软件设计哲学》《整洁架构》《DDD》《DDIA》《Release It!》 | 模块设计、代码重构、架构分层、防御性编程与代码质量审查 |
| *(更多领域顾问规划中...)* | 性能治理、高可用 SRE、前端工程、安全审计等 | 持续演进中 |

---

## 🚀 Installation & Usage (安装与使用)

### 方式 1：通过 cc-switch 管理（推荐）

如果你使用 [cc-switch](https://github.com) 管理多个 Agent 客户端（Claude Code / Codex / Gemini / Antigravity 等）：

1. 将所需技能复制或克隆到 cc-switch 的技能存储目录：
   ```powershell
   # Windows PowerShell
   Copy-Item -Recurse "skills\software-design-advisor" "$HOME\.cc-switch\skills\"
   ```
2. 打开 cc-switch 界面，在技能列表中勾选启用即可，自动无缝分发到各客户端。

### 方式 2：直接符号链接到你的 Agent

#### 适用于 Google Antigravity / Gemini CLI：
```powershell
New-Item -ItemType SymbolicLink -Path "$HOME\.gemini\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

#### 适用于 Claude Code：
```bash
ln -s "$(pwd)/skills/software-design-advisor" ~/.claude/skills/software-design-advisor
```

#### 适用于 OpenAI Codex / 其他客户端：
直接将对应技能文件夹加入客户端的 skills 扫描路径即可。

---

## 🛠️ Contributing New Advisors (如何贡献新的顾问？)

每个新 Advisor 必须严格遵守深模块规范：
1. **单一门面**：对外只暴露一个统一的 `SKILL.md`，禁止在同领域拆散为多个碎浅技能；
2. **哲学仲裁**：必须在文档中明确解决不同思想流派之间的冲突规则；
3. **分层收纳**：全量书籍或大型知识库必须存放在 `references/` 目录下，主文件仅保留精华 Nano 规则与决策树。

---

## 📄 License

MIT License © 2026 [cqzeng](https://github.com/cqzeng)
