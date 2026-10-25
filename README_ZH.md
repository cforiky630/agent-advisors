# 🏛️ Agent Advisors（智能体专家顾问库）

<p align="center">
  <strong>每个工程领域一个说话算数的顾问，外加一套审计与扩展技能的工具。</strong><br>
  少一点提示词堆积，少一点技能互相抢活，多一点稳定的工程判断。
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

## 这是什么？

Agent Advisors 是一组给 AI 编程助手用的 **skill（技能）**，外加几个管理技能的小工具。

一个 skill 就是一个带 `SKILL.md` 的文件夹。模型每一轮都能看到它的名字和描述，只有任务对得上时才读正文。这样既能给模型一个稳定的立场，又不用每轮都塞一大段指令。

本仓库包含三个 skill 和三个工具：

| 内容 | 是什么 | 用来干什么 |
| :--- | :--- | :--- |
| [`software-design-advisor`](skills/software-design-advisor/) | 一个 skill + 14 份提炼笔记 | 让设计、重构、遗留代码、架构、DDD、容错类决策保持一致 |
| [`api-security-advisor`](skills/api-security-advisor/) | 一个 skill + 4 份安全基线笔记 | 防御水平越权（BOLA/IDOR）、SSRF、注入、密码学与令牌缺陷 |
| [`advisor-creator`](skills/advisor-creator/) | 元技能 | 把团队散落各处的规范合成一个新顾问 |
| [`audit_skills.mjs`](scripts/audit_skills.mjs) | 只读命令行工具 | 盘点装了哪些技能、每轮花多少上下文、谁在抢同一类任务 |
| [`import_repo.mjs`](scripts/import_repo.mjs) | 隔离导入工具 | 评估别的仓库里的技能，但绝不直接安装 |
| [`validate_skills.mjs`](scripts/validate_skills.mjs) | 结构校验工具 | 检查技能格式是否规范；CI 也会跑 |

**只用顾问的话，完全不需要这些工具。** 工具是给已经装了很多技能、或者想安全吸收外部技能的人用的。

---

## 60 秒上手

### 1. 安装顾问（Claude Code）

```bash
# macOS / Linux
mkdir -p ~/.claude/skills
ln -s "$(pwd)/skills/software-design-advisor" ~/.claude/skills/software-design-advisor
```

```powershell
# Windows（PowerShell，以管理员身份运行）
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

其他客户端见[安装](#安装)。

### 2. 问一个它擅长的问题

```
帮我重构这个老订单服务。逻辑很缠绕，但不能破坏既有调用方。
```

```
给支付模块设计接口，调用方不应该关心底层用的是哪个网关。
```

```
这个 CRUD 服务有必要上完整 DDD 吗？
```

不需要任何配置。任务对得上，模型就会加载它，给出理由和代码。

### 3. 可选：看看你还装了什么

```bash
node scripts/audit_skills.mjs
```

报告会写到 `.advisor-audit/audit-report.md`。当你装了很多技能、开始感觉模型“选择困难”时，就该跑一次。

---

## 顾问到底给了你什么

它不提供新知识——书里的内容模型本来就知道。它提供的是一套**稳定的默认立场**，让回答不会今天说“全部拆成小函数”、明天又说“要深模块”。

比如让它处理一个缠绕的遗留服务，它会推动模型：

1. 先找接缝、补特征测试，再动逻辑；
2. 把重构和行为变更分开（Fowler 的“两顶帽子”）；
3. 把透传包装收成更深的模块；
4. 在边界校验输入，而不是在领域核心里到处防御。

它也明确写了什么时候让位：项目既有约定、测试、用户明确指令优先；专门的审查/测试/调试技能负责自己的流程。见 [SKILL.md](skills/software-design-advisor/SKILL.md)。

---

## 怎么工作：三层

```
第 1 层  名字 + 描述            常驻上下文，约 120–140 token
   │
   ▼  任务匹配
第 2 层  SKILL.md               命中时加载，约 100 行
   │
   ▼  需要具体模式
第 3 层  references/*.md        每次最多读一两份，不预加载
```

- **第 1 层**是唯一固定成本，用来让模型判断“要不要加载”。
- **第 2 层**是决策矩阵、冲突仲裁和交付检查表，大多数任务到这里就够了。
- **第 3 层**是提炼笔记。它们是摘要，不是原书；并且明确要求每次最多读一两份。

重点不是“文档更多”，而是让模型带着一套连贯的工程立场，又不必每轮为它付费。

---

## 安装

### Claude Code

```bash
mkdir -p ~/.claude/skills
ln -s "$(pwd)/skills/software-design-advisor" ~/.claude/skills/software-design-advisor
```

Windows 用上面快速上手里的 PowerShell 命令。

### Cursor

放进或软链到项目的 `.cursor/skills/`：

```bash
mkdir -p .cursor/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor .cursor/skills/software-design-advisor
```

### Codex CLI

```bash
mkdir -p ~/.codex/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor ~/.codex/skills/software-design-advisor
```

### Google Antigravity / Gemini CLI

```powershell
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

### 用 cc-switch 管理多个客户端

如果你在 Claude Code、Codex、Antigravity、OpenCode 之间切换，可以用 [cc-switch](https://github.com/farion1231/cc-switch) 维护一份中心副本：

```powershell
Copy-Item -Recurse "skills\software-design-advisor" "$HOME\.cc-switch\skills\"
```

然后在 cc-switch 界面启用。更新中心副本，所有链接到它的客户端一起更新。

---

## 审计已安装技能

一个 skill 看不到你装的其他东西，审计工具可以：

```bash
node scripts/audit_skills.mjs
```

报告包括：

- **各运行时装了什么**（Claude Code、Codex、Gemini、Cursor）。
- **固定成本**：每轮要付多少描述 token。
- **结构问题**：缺描述、坏引用、同名冲突。
- **重叠候选**：描述里抢同一类任务的技能对。
- **过宽触发词**：动辄“任何”“只要”，最容易误触发的写法。

产物在 `.advisor-audit/`：

- `audit-report.md` —— 可读报告。
- `skills.lock.json` —— 带内容哈希的清单，方便对比安装变化。

重叠分数高只代表“这两份值得读一下”，不代表它们冲突。审计不会修改、删除或安装任何东西。方法与边界见 [docs/AUDIT.md](docs/AUDIT.md)。

---

## 从其他仓库导入技能

```bash
node scripts/import_repo.mjs https://github.com/owner/skills --ref main
```

导入工具会：

1. 把仓库克隆到临时隔离目录；
2. 找出 `SKILL.md`、`AGENTS.md`、`CLAUDE.md`、`.cursor/rules/*.mdc`；
3. 记录来源：URL、commit SHA、子目录、许可证、内容哈希；
4. 和你的审计清单比对；
5. 写出 `.advisor-import/<repo>/proposal.md`，逐个给出建议动作。

它**不安装、不写入技能根目录、不执行仓库代码**。可执行文件只登记、不复制；许可证不明或非宽松许可的候选默认只能作参考。

决定采纳后，先读建议书，再用 `advisor-creator` 合并，最后手动安装。

---

## 造自己的顾问

如果你有团队专属的规范——API 约定、安全基线、事故处理规则——`advisor-creator` 可以把它变成一个技能：

```
调用 advisor-creator，把我们团队的 API 规范与 OWASP 要求合成为一个 api-security-advisor。
```

它会带你走完领域映射、冲突仲裁、规则精简和脚手架。产物结构与 `software-design-advisor` 一致，因此同一套审计、校验和测试都能直接用。

---

## 仓库结构

```text
agent-advisors/
├── .github/workflows/          # CI：结构校验 + 测试
├── docs/                       # 审计方法与导入安全模型
├── evals/                      # 触发用例与盲测协议
├── scripts/
│   ├── lib/skill.mjs           # 共享的解析与比较
│   ├── audit_skills.mjs        # 只读盘点与重叠报告
│   ├── import_repo.mjs         # 隔离克隆与建议书
│   └── validate_skills.mjs     # 本仓库的结构校验
├── tests/                      # node --test 测试
├── skills/
│   ├── software-design-advisor/
│   │   ├── SKILL.md
│   │   └── references/         # 14 份提炼工程参考
│   ├── api-security-advisor/
│   │   ├── SKILL.md
│   │   └── references/         # 4 份应用安全基线参考
│   └── advisor-creator/
│       ├── SKILL.md
│       └── references/         # 顾问模板
├── CONTRIBUTING.md
├── LICENSE
├── package.json                # 只有脚本，零依赖
└── README.md / README_ZH.md
```

---

## 常见问题与边界

**它会让模型多懂一些东西吗？**
不会。模型本来就知道这些书。顾问改变的是默认判断，并让判断保持稳定；它的价值是判断力，不是知识点。

**能保证每次都触发吗？**
不能。是否加载由模型决定。[`evals/trigger-cases.md`](evals/trigger-cases.md) 列出了“该触发”“该静默”“该让位”的用例。

**审计能发现两套规范互相矛盾吗？**
不能。它只能发现结构问题和触发面重叠。是否真的矛盾，需要读正文或让模型做仲裁。见 [docs/AUDIT.md](docs/AUDIT.md)。

**references 是原书内容吗？**
不是。它们是独立写的摘要。书名与作者归各自权利人所有，本项目与其无隶属关系。

**所有客户端都支持审计吗？**
预算按运行时分开展示；重叠分析默认只比较 Claude Code（加 `--agents all` 可比较全部）。插件发现目前只支持 Claude Code 的 `installed_plugins.json`。

**工具会自动卸载或改写我的技能吗？**
不会。审计和导入对已安装技能都是只读的。删不删、合不合并，由你决定。

---

## 开发

只需要 Node.js 20+，没有任何第三方依赖。

```bash
node scripts/validate_skills.mjs
```

```bash
node --test
```

```bash
node scripts/audit_skills.mjs
```

```bash
node scripts/import_repo.mjs <git-url>
```

---

## 参与贡献

提交 PR 前请读 [CONTRIBUTING.md](CONTRIBUTING.md)。核心规则：

- 一个领域只做一个顾问；
- `SKILL.md` 控制在 150 行以内，深度内容放 `references/`；
- 写清理由、权衡，以及这个顾问让位于什么；
- 跑校验和测试，CI 也会重复一遍。

---

## 开源协议

MIT，见 [LICENSE](LICENSE)。

### 版权与出处

`skills/*/references/` 下的文件是对已出版专著与公开目录的独立提炼与改写，并非原文复制。书名、作者与目录名称归各自权利人所有；本项目与这些作者或出版方无隶属或背书关系，这些摘要也不能替代原著。
