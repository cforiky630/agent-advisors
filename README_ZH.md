# Agent Advisors（智能体领域顾问库与技能治理工具箱）

<p align="center">
  <strong>面向 AI 编程智能体的高内聚、深模块工程领域顾问（Domain Advisors）与技能治理工具集</strong><br>
  以确定性、低 Token 开销的领域门面，终结提示词堆砌、教条漂移与技能争抢。
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a> | <a href="README_ZH.md"><strong>简体中文</strong></a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933.svg" alt="Node.js >= 20">
  <img src="https://img.shields.io/badge/支持客户端-Claude%20Code%20%7C%20Cursor%20%7C%20Codex%20%7C%20Antigravity-orange.svg" alt="Supported Agent Runtimes">
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome"></a>
</p>

---

## 核心定位

> **首行选型边界 —— 静态领域门面 + 运行时断点裁决协议**：当前生态中的“Advisor”分为两类——一类是在任务匹配时按需加载的**领域知识门面**（旨在消除工程判断随机性、压降常驻上下文税），另一类是在长会话关键决策时刻动态介入的**运行时咨询协议**。**Agent Advisors** 以**零依赖技能治理与深模块领域门面**为核心底座，并通过无需外部守护进程的 **[运行时断点裁决协议（Checkpoint Protocol）](docs/CHECKPOINT_PROTOCOL.md)** 补齐长会话动态决策介入能力。

**Agent Advisors** 采用清晰的双层解耦架构设计：

1. **核心产品 —— 领域顾问库（`skills/`）**：独立于任何脚本或运行时的纯净工程技能资产。每个顾问扮演单一领域的证据门控门面（软件架构设计、防御性 API 安全、数据持久化架构），通过**代码库前置探针（`Probe`）**、**冲突仲裁因果律（`Arbitration`）**与**可证伪失效边界（`Invalidate When`）**，为大模型提供跨会话可复用、可检验的工程决策指导。
2. **辅助设施 —— 技能治理与开发工具链（`scripts/`）**：一套零外部依赖的静态治理工具，支持多运行时常驻 Token 预算审计、**正/负向触发本体分离与正交豁免分析**、**48 项静态触发检查与 9 项人工让渡场景**，以及外部不可信技能仓库的临时目录隔离导入。

> **免工具运行说明**：`skills/` 目录下的所有顾问均为完全自闭环的 Markdown 规范文件（`SKILL.md` + `references/`）。普通用户可以直接在任何智能体环境中使用这些顾问，**无需安装 Node.js 依赖，也无需运行任何本地脚本**。

---

# 第一部分：领域顾问技能库（Skills）

## 现已发布的领域顾问

| 顾问名称 | 覆盖工程领域 | 深度参考资料来源 |
| :--- | :--- | :--- |
| [`software-design-advisor`](skills/software-design-advisor/) | 综合 8 大软件工程经典体系：子程序构造、深模块设计、重构实施手法、遗留代码接缝、战术 DDD 边界、企业应用架构模式、整洁架构分层与分布式韧性。 | `references/` 下 14 份高密度工程指南 |
| [`api-security-advisor`](skills/api-security-advisor/) | 实施防御性 API 工程与安全基线：对象级/功能级越权防御（BOLA/BOPLA/BFLA）、令牌与会话规范（JWT/OAuth2/PKCE）、输入边界校验与防注入、密码学原语卫生。 | `references/` 下 4 份应用安全基线指南 |
| [`data-storage-advisor`](skills/data-storage-advisor/) | 掌舵关系型持久化与并发架构：B-Tree 复合索引（ESR 黄金法则）与游标分页、Schema 反模式规避、MVCC 事务隔离与死锁防御、连接池容量法则。 | `references/` 下 4 份数据库架构指南 |
| [`advisor-creator`](skills/advisor-creator/) | 顾问合成元技能：提供五阶段标准化流水线与脚手架模板，用于将团队内部的技术规范（ADR）、开发标准或专业文献合成为结构严密的领域顾问。 | `references/` 下 1 份标准顾问模板 |

---

## 极简安装指南（按需选择）

使用顾问不需要后台守护进程或繁琐配置，请根据您使用的客户端选择最顺手的方式：

### 方式一：Claude Code 官方插件（无需终端操作）

本仓库原生兼容 Claude Code Plugin 规范。直接在 Claude Code 的聊天对话框中输入：

```text
/plugin add cforiky630/agent-advisors
```

Claude Code 将自动克隆并载入全部领域顾问，即装即用。

### 方式二：提示词自举安装（适用于 Cursor、Gemini、Codex 或任何智能体）

现代 AI 编程助手本身具备读取网络和管理工作区文件的能力。复制以下指令，直接发送给您的 AI 编程助手：

```text
请读取 GitHub 仓库 https://github.com/cforiky630/agent-advisors 中的 skills/ 目录，将其中的领域顾问（software-design-advisor、api-security-advisor、data-storage-advisor）下载并安装到我当前客户端的技能目录中（例如 Cursor 项目级目录 .cursor/skills/ 或系统技能库 ~/.claude/skills/）。
```

### 方式三：交互式向导（适用于已克隆本仓库的开发者）

若您已将本仓库克隆至本地，可直接运行零依赖交互式向导：

```bash
# 启动终端交互向导，自动检测本机安装的客户端
node scripts/link_skills.mjs
```

交互式向导会自动识别本机已有的客户端环境（Claude Code、Cursor、Gemini/Antigravity、Codex、cc-switch），并提供两种灵活模式：
- **软链 / 目录联接（Symlink / Junction）**：链接至当前仓库，后续 `git pull` 自动同步更新。
- **独立纯复制（`--copy`）**：将文件完全拷贝至目标客户端，之后可安全移动或删除本仓库，完全解绑。

<details>
<summary>命令行参数与静默调用示例（CI / 自动化）</summary>

```bash
# 挂载全部领域顾问至 Claude Code
node scripts/link_skills.mjs --client claude

# 挂载至指定 Cursor 项目目录
node scripts/link_skills.mjs --client cursor --project /path/to/your/project

# 纯复制模式（与当前 git 仓库解绑）
node scripts/link_skills.mjs --client gemini --copy

# 查看全局挂载健康状态
node scripts/link_skills.mjs --status

# 可逆卸载（仅清理软链，绝不误删物理文件）
node scripts/link_skills.mjs --unlink
```

</details>

---

## 核心设计哲学

### 1. 三级渐进式披露与仓库证据门控（Evidence-Gated Disclosure）

已安装技能的描述会在每一轮对话中持续占用系统上下文。Agent Advisors 在压降常驻开销的同时，将工程决策锚定在**可验证的代码库事实而非盲从教条**之上：

```text
第 1 层：正/负向触发本体（Frontmatter）    ~90–140 tokens   每轮常驻，声明正向触发与显式 Do not trigger for 边界
   │
   ▼  当用户任务命中正向领域意图时按需载入
第 2 层：证据门控门面（SKILL.md）          <= 150 行        合一路由表、代码库探针（Probe）与证伪边界（Invalidate When）
   │
   ▼  仅在需要深入具体模式细节时按需读取
第 3 层：可证伪参考库（references/*.md）   先读 1–2 篇   高密度总结 + 显式反指征（When This Default Fails）
```

- **第 1 层（`name` + `description`）**：显式配对正向触发范围与负向反触发声明（`Do not trigger for...`），帮助表达领域边界，实际触发仍取决于宿主。
- **第 2 层（`SKILL.md`）**：消除双重路由冗余（在第 1 节直接映射 `references/*.md`），释放预算用于第 2 节的**证据门控权衡仲裁**：
  - **`Probe`（前置探针）**：做决定前必须先在代码库中核查的具体证据（如现有单测接缝、`EXPLAIN` 执行计划、鉴权中间件状态）；
  - **`Arbitration`（取舍依据）**：默认分支及其工程因果律；
  - **`Invalidate When`（证伪边界）**：明确列出该默认准则何时失效并必须反转。
- **第 3 层（`references/*.md`）**：包含显式的 `When This Default Fails (Counter-Indications)` 反指征章节，并完成跨顾问一致性对齐（如对齐 API 安全的防枚举 ID 与数据存储的 B-Tree 聚簇局部性，结合公开 ID 威胁、既有 API 契约及实测索引开销选型）。

### 2. 双模运行机制：静态领域门面 + 运行时断点裁决协议（Checkpoint Protocol）

第 1 轮加载的指南无法阻止第 80 轮的上下文污染。每个顾问同时支持两种运行模式（详见 [`docs/CHECKPOINT_PROTOCOL.md`](docs/CHECKPOINT_PROTOCOL.md)）：
- **模式 A —— 静态领域门面（默认）**：任务初始匹配领域意图时自动挂载。
- **模式 B —— 按风险触发的断点审查（`CP-1` / `CP-2` / `CP-3`）**：在难以撤回的契约、数据或安全变更（CP-1）、没有新证据或进展的反复尝试（CP-2）、引入新的信任、一致性或运行故障边界（CP-3）时检查证据。文件数、机械重命名和预期的测试先失败均不能单独触发断点。默认进行简短自审；仅在已获授权且能提供独立判断时使用子代理。按裁决修正后继续工作，只有缺少用户决策、权限或无法安全消解的重大不确定性时才向用户升级。

断点属于由宿主智能体执行的指令协议，没有自动强制执行的 Hook。每个技能内嵌完整的最小咨询、裁决与终止流程，独立复制后仍可使用。

### 3. 运行边界与按比例适配法则（Proportionality Ladder）

入口先给出 Quick Use 和场景路由。跨领域任务选择主要决策视角，共用证据并合并验证与输出，同一风险只审查一次。参考资料在入口规定的范围内提供技术细节，不能自行要求新增架构层、额外清理或报告。创建器从已安装技能定位模板，并检查目标项目实际提供的验证工具。

每个领域顾问均声明了严格的优先级边界：
- **项目既有规范优先**：代码库现有的架构决策、数据库迁移脚本、中间件、Linter、测试套件及用户的显式指令，优先级严格高于顾问默认准则。
- **专用工作流让渡**：当用户唤起专用的代码审查、测试执行或故障排查工作流时，主动让渡流程控制权，仅提供底层的工程取舍逻辑。
- **按比例适配与显式推迟说明（Intentional Deferrals）**：优先用尽既有模式与标准库能力；当推迟引入重型模式时，明确指出未来触发引入的具体规模或风险阈值。

### 4. 零 Token 溯源物理隔离（Provenance Separation）

所有正式的书目出版信息、ISBN-13 记录、工业技术标准编号（RFC、NIST、OWASP、CWE）与版权声明均独立存放于 [`docs/provenance/`](docs/provenance/README.md) 中，与 `skills/` 运行时目录物理隔离，确保运行时零额外 Token 损耗。

---

## 经典任务示例

安装后，当提示词命中顾问领域时，智能体将自动唤醒专业工程指导：

- **遗留代码重构与接缝建设（`software-design-advisor`）**：
  > *"重构这个交错缠绕的订单处理服务以支持多种支付渠道，要求在改动前建立测试接缝，且不得破坏既有调用方契约。"*
- **防御性 API 鉴权与边界校验（`api-security-advisor`）**：
  > *"编写按 ID 查询账单详情的控制器路由。防范 BOLA/IDOR 水平越权，在 Webhook 回调处防范 SSRF，并在请求入口边界完成强类型校验。"*
- **复杂查询优化与索引设计（`data-storage-advisor`）**：
  > *"该分页查询在深分页时频繁超时，请重构为游标分页（Keyset Pagination），并根据 ESR 原则设计对应的复合 B-Tree 索引。"*

---

# 第二部分：技能治理与工程工具箱（Toolchain）

对于管理多端技能、维护团队统一提示词规范的开发者与架构师，本仓库在 `scripts/` 中提供了一套基于标准库的零依赖静态分析工具集。

```text
scripts/
├── link_skills.mjs           # 交互式向导、跨平台分发器与通用 AGENTS.md 编译器
├── audit_skills.mjs          # 多运行时技能盘点、描述预算评估与触发重叠度分析器
├── import_repo.mjs           # 隔离克隆、开源协议合规扫描与候选提案生成器
├── validate_skills.mjs       # 结构规范、行数预算与链接完整性校验器
└── lib/skill.mjs             # 共享 Frontmatter 解析、Token 估算与重叠度打分核心库
```

### 1. 已安装技能静态审计（`audit_skills.mjs`）

单个技能无法感知宿主环境中其他技能的存在。运行 `npm run audit` 可对本地环境进行只读体检：

```bash
npm run audit
```

- **分运行时 Token 开销评估**：分别计算 Claude Code、Cursor、Codex 与 Gemini/Antigravity 每轮系统提示词的描述常驻开销。
- **跨目录物理副本去重**：自动识别并合并跨运行时的相同物理副本，同时检测同名技能在不同目录下的内容漂移。
- **正/负向触发本体分离与重叠度分析**：通过 `splitTriggerSurface` 自动剥离 `Do not trigger for...` 反触发子句，结合词项相似度（$0.6 \times \text{Dice}$）、领域标签交集（$0.4 \times \text{Jaccard}$）与**正交边界豁免折扣（Orthogonality Discount）**筛选需要人工核查的重叠候选对。
- **静态触发检查（`npm run validate`）**：对 24 项正向与 24 项休眠案例执行词项/领域标签启发式检查；另外 9 项让渡案例明确列为人工运行时评估。静态分数不代表模型实际加载技能或改善输出。
- **冲突能力边界**：脚本确定性检查安装冲突和内容漂移，触发重叠仅作为核查候选；规则含义冲突由 `advisor-creator` 或人工裁决，脚本不自动合并或仲裁。
- **输出产物**：在 `.advisor-audit/audit-report.md` 输出诊断报告，在 `.advisor-audit/skills.lock.json` 输出确定性清单锁文件（详见 [`docs/AUDIT.md`](docs/AUDIT.md)）。

### 2. 外部仓库隔离检查与导入（`import_repo.mjs`）

将外部第三方仓库作为数据，在临时目录中检查；这不是操作系统级进程沙箱：

```bash
node scripts/import_repo.mjs https://github.com/owner/repo --ref main
```

- 将仓库拉取到系统临时隔离目录，强制禁用 Git Hooks、文件系统监控与子模块递归；
- 对 `--subdir` 目标实施严格的符号链接真实路径边界校验；
- 仅提取 Markdown 候选资产（`SKILL.md`、`AGENTS.md`、`CLAUDE.md`、`.cursor/rules/*.mdc`）；可执行脚本仅做安全标记，绝不执行与复制；
- 在 `.advisor-import/<repo>/proposal.md` 输出采纳评估报告。

### 3. 脏规则/ADR 冲突编译与构建专属顾问（`advisor-creator`）

将团队内部杂乱的架构决策记录（`docs/adr/*.md`）、`.cursor/rules/*.mdc` 或 `CLAUDE.md` 编译为证据门控领域顾问：

```text
调用 advisor-creator，扫描我们项目的 docs/adr/ 与 .cursor/rules/，提取其中的冲突规则并编译为一个新的领域顾问。
```

无需用户手动做领域建模，`advisor-creator` 会自动扫描散落规则中的自相矛盾点与无保护的 `ALWAYS`/`NEVER` 绝对化指令，基于 [`advisor-template.md`](skills/advisor-creator/references/advisor-template.md) 注入 `Probe` 与 `Invalidate When` 边界，先交付可用顾问；在较大的采纳决策中，可按需提供**编译成本与决策评分卡（Compilation Cost & Decision Scorecard）**（实测常驻 Token 成本、冲突裁决证据、默认与替代分支场景及尚未验证的效果）。

---

## 本地开发与质量保证

仅依赖 **Node.js >= 20** 原生能力，无需安装任何第三方 npm 依赖包。

```bash
# 执行技能结构、150行限制、必填章节与相对链接完整性校验
npm run validate

# 运行覆盖分发器、审计器、导入器及核心库的原生单元测试套件
npm test
```

---

## 参与贡献与开源协议

提交 Pull Request 前请参阅 [`CONTRIBUTING.md`](CONTRIBUTING.md)。本项目基于 [MIT License](LICENSE) 开源。

### 文献归属与版权说明

`skills/*/references/` 下的文档均为独立撰写的技术摘要与工程原则提炼。所涉专著书名、作者署名及技术标准名称均归各自权利人所有。本项目与原作者或出版机构不存在隶属或背书关系。完整文献映射与 ISBN 记录详见 [`docs/provenance/`](docs/provenance/README.md)。
