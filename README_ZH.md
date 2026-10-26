# Agent Advisors（AI 编程智能体领域顾问与技能治理工具链）

<p align="center">
  <strong>面向 AI 编程智能体的深模块工程领域顾问（Domain Advisors）与技能治理工具集</strong><br>
  以高内聚的领域门面替代碎片化提示词规则，实现低上下文开销与一致的工程架构决策。
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a> | <a href="README_ZH.md"><strong>简体中文</strong></a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933.svg" alt="Node.js >= 20">
  <img src="https://img.shields.io/badge/支持运行时-Claude%20Code%20%7C%20Cursor%20%7C%20Codex%20%7C%20Antigravity-orange.svg" alt="Supported Agent Runtimes">
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome"></a>
</p>

---

## 项目概述

**Agent Advisors** 是一套面向主流 AI 编程智能体运行时（Claude Code、Cursor、Codex CLI、Google Antigravity / Gemini CLI）的**结构化工程领域顾问库（Domain Advisors）**与**零依赖技能治理 CLI 工具链**。

在实际工程应用中，随着智能体挂载的细粒度技能（Micro-Skills）不断累加，通常会引发三类系统性问题：
1. **常驻上下文开销膨胀（Context Tax）**：每个已安装技能的 Frontmatter 描述都会在每一轮对话中常驻系统提示词，持续消耗上下文预算。
2. **触发面重叠与路由歧义（Trigger Collisions）**：多个技能的描述针对同类开发任务声明触发条件，导致模型路由不确定。
3. **工程教条冲突与决策漂移（Doctrinal Drift）**：缺乏明确的权衡准则时，智能体容易在相互冲突的工程范式之间摇摆（例如“拆分为极小函数”与“构建深模块”，或对简单 CRUD 盲目套用重型战术 DDD）。

本项目通过**门面模式（单一工程领域对应唯一权威顾问）**与**三级渐进式披露架构（Three-Level Progressive Disclosure）**解决上述问题，并提供静态审计与隔离导入工具，协助开发者对本地技能集进行量化治理。

### 核心组件

| 组件 | 类别 | 覆盖范围与核心职责 |
| :--- | :--- | :--- |
| [`software-design-advisor`](skills/software-design-advisor/) | 领域顾问 | 综合 8 大软件工程核心领域与 14 份高密度参考指南：涵盖子程序构造、深模块设计、重构、遗留代码接缝、领域驱动设计（DDD）、企业应用架构模式、整洁架构与分布式容错韧性。 |
| [`api-security-advisor`](skills/api-security-advisor/) | 领域顾问 | 覆盖 4 大应用安全与防御性 API 设计基线：对象级与功能级鉴权（BOLA/BOPLA/BFLA）、令牌与会话安全（JWT/OAuth2/PKCE）、边界解析与注入防御、密码学原语与时序安全。 |
| [`data-storage-advisor`](skills/data-storage-advisor/) | 领域顾问 | 覆盖 4 大数据持久化架构方向：B-Tree 复合索引（ESR 准则）与游标分页、关系型 Schema 反模式规避、MVCC 事务隔离与并发锁控制、连接池容量计算与读写分离一致性。 |
| [`advisor-creator`](skills/advisor-creator/) | 元技能 | 提供五阶段合成流水线与标准结构模板，用于将团队内部技术规范或领域文献合成为符合校验规范的领域顾问。 |
| [`link_skills.mjs`](scripts/link_skills.mjs) | 分发挂载 CLI | 跨平台符号链接与 Windows Junction 挂载工具，支持多运行时一键分发及 `AGENTS.md` 通用回退文件生成。 |
| [`audit_skills.mjs`](scripts/audit_skills.mjs) | 治理工具 CLI | 只读静态分析工具：盘点多运行时已安装技能、估算每轮描述 Token 预算、检测结构缺陷，并计算触发描述重叠度。 |
| [`import_repo.mjs`](scripts/import_repo.mjs) | 隔离导入 CLI | 将外部 Git 仓库克隆至系统临时隔离区，执行开源协议检测与可执行文件拦截，结合本地锁文件对比生成合入评估报告。 |
| [`validate_skills.mjs`](scripts/validate_skills.mjs) | 质量门禁 CLI | 校验 Frontmatter 元数据规范、正文行数上限（`<= 150` 行）、必填章节结构、双向引用完整性与文档相对链接有效性。 |

---

## 核心架构与设计原则

### 1. 三级渐进式披露（Three-Level Progressive Disclosure）

每个领域顾问均严格采用分层加载设计，在保障深度工程模式可达性的同时，将每轮对话的固定上下文开销降至最低：

```text
第 1 层：元数据（YAML Frontmatter）       ~90–140 tokens   每轮对话常驻上下文，用于意图路由判定
   │
   ▼  当用户任务匹配领域意图时按需激活
第 2 层：领域门面（SKILL.md）             <= 150 行        场景决策矩阵、工程权衡仲裁、浓缩微规则与交付清单
   │
   ▼  仅在需要具体实现模式细节时按需读取
第 3 层：高密度参考库（references/*.md）  每次最多 1–2 份   独立提炼的专项工程指南，严禁全量预加载
```

- **第 1 层（`name` + `description`）**：唯一的常驻上下文成本，明确界定激活场景与不触发边界（Anti-triggers）。
- **第 2 层（`SKILL.md`）**：包含**场景决策矩阵**、**工程权衡与冲突仲裁**、**浓缩微规则集**、**深度知识库索引**与**输出交付检查清单**。绝大多数架构设计与编码任务在此层即可完成决策。
- **第 3 层（`references/*.md`）**：独立撰写的工程模式提炼文档。`SKILL.md` 明确约束智能体在单次任务中最多按需读取 1–2 份参考文件，严禁预加载整个目录。

### 2. 确定性优先级与运行边界（Operating Boundaries）

大语言模型本身已具备经典工程著作的参数化知识，其短板在于缺乏**跨会话一致的工程判断立场**。每个领域顾问均明确声明其运行边界：
- **项目既有规范优先**：代码库现有的架构决策、Linter 规则、测试套件及用户的显式指令优先级高于顾问默认准则。
- **专用工作流让渡**：领域顾问专注于架构设计与代码实现决策；当触发专用的代码审查（Code Review）、测试执行或故障排查工作流时，主动让渡流程控制权。
- **因果化权衡仲裁**：拒绝无条件教条，针对典型技术冲突给出明确的适用前提与切换阈值（例如明确何时应采用事务脚本而非富领域模型）。
- **比例原则与显式延迟（Proportionality & Intentional Deferral）**：架构复杂度严格匹配任务规模；针对简单任务避免过度设计，并在交付清单中显式声明有意识延迟或省略的重型模式及其依据。

### 3. 零 Token 文献溯源分离（Provenance Separation）

所有顾问涉及的出版物书目、ISBN-13 编号、RFC/NIST/OWASP 标准映射及版权声明均独立存放在 [`docs/provenance/`](docs/provenance/README.md) 目录下，与 `skills/` 运行时目录物理隔离。该设计确保智能体加载技能时**零额外 Token 损耗**，且通过符号链接分发时仅挂载纯运行时资产。

---

## 快速开始

### 1. 挂载领域顾问

推荐使用跨平台分发工具一键挂载（在 macOS/Linux 下自动创建符号链接，在 Windows 下创建无需管理员权限的目录联接 Junction），或生成单文件 `AGENTS.md` 通用回退指令集：

```bash
# 一键挂载全部领域顾问至 Claude Code（也可直接运行：node scripts/link_skills.mjs --agent claude）
npm run link -- --agent claude

# 挂载至 Google Antigravity / Gemini CLI、Cursor 或 Codex
npm run link -- --agent gemini

# 生成确定性的单文件 AGENTS.md 通用回退文件
npm run link -- --emit-agents AGENTS.md
```

也可通过终端命令手动创建软链或联接：

```bash
# macOS / Linux（Claude Code）
mkdir -p ~/.claude/skills
for advisor in software-design-advisor api-security-advisor data-storage-advisor; do
  ln -s "$(pwd)/skills/$advisor" ~/.claude/skills/$advisor
done
```

```powershell
# Windows PowerShell（Claude Code —— 使用目录联接 Junction）
New-Item -ItemType Directory -Path "$HOME\.claude\skills" -Force | Out-Null
Get-ChildItem skills -Directory | Where-Object { $_.Name -ne "advisor-creator" } | ForEach-Object {
  New-Item -ItemType Junction -Path "$HOME\.claude\skills\$($_.Name)" -Target $_.FullName -Force
}
```

### 2. 典型触发任务示例

完成挂载后无需额外配置，当提示词命中对应工程领域时，智能体将自动激活相应顾问并输出带权衡依据的实现方案：

- **软件架构与遗留系统重构（`software-design-advisor`）**：
  > *"重构这个遗留订单服务以解耦底层支付网关实现，要求在改动前建立接缝且不破坏现有调用方契约。"*
- **API 安全与越权防御（`api-security-advisor`）**：
  > *"实现根据订单 ID 获取账单详情的接口，并针对水平越权（BOLA/IDOR）与 SSRF 漏洞执行防御加固。"*
- **数据库索引与高并发优化（`data-storage-advisor`）**：
  > *"该分页查询在 `OFFSET 100000` 时出现严重性能退化，请将其重构为游标分页（Keyset Pagination）并设计对应的复合 B-Tree 索引。"*

### 3. 审计本地已安装技能（可选）

```bash
npm run audit
```

该命令将扫描本机各运行时环境，生成可读审计报告 `.advisor-audit/audit-report.md` 与带内容哈希的清单锁文件 `.advisor-audit/skills.lock.json`。

---

## 多运行时安装指南

### Claude Code

```bash
mkdir -p ~/.claude/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor ~/.claude/skills/software-design-advisor
```

### Cursor

将顾问软链至项目级 `.cursor/skills/` 目录：

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

### 使用 `cc-switch` 统一管理多端技能

若同时使用 Claude Code、Codex、Antigravity 等多个客户端，可通过 [cc-switch](https://github.com/farion1231/cc-switch) 维护中心化技能副本并统一分发：

```powershell
Copy-Item -Recurse "skills\software-design-advisor" "$HOME\.cc-switch\skills\"
```

---

## 技能审计与外部仓库隔离导入

### 已安装技能静态审计（`scripts/audit_skills.mjs`）

单个技能无法感知宿主环境中其他技能的存在。运行 `node scripts/audit_skills.mjs` 可对全局技能集执行只读诊断：

- **分运行时 Token 预算统计**：分别计算 Claude Code、Cursor、Codex 与 Gemini/Antigravity 每轮常驻描述的 Token 开销（自动排除 `~/.cc-switch/skills` 等静态分发存储目录）。
- **跨目录副本去重与内容漂移检测**：基于 `(name, contentHash)` 自动合并跨运行时与分发存储目录（如 `cc-switch` 同步至 `claude`/`codex`）的相同物理副本，并针对同名不同哈希的跨目录内容漂移及单运行时作用域冲突发出告警。
- **结构完整性与全目录相对资产断链检测**：检测缺失的 YAML Frontmatter、损坏的符号链接，以及 `references/`、`agents/`、`scripts/`、`assets/`、`eval-viewer/`、`templates/`、`examples/`、`resources/` 等全目录相对资产断链。
- **中英双语触发重叠度计算**：基于中英双语描述分词（拉丁词干提取 + 中文双字 Bigram，$0.6 \times \text{Dice}$）与双语领域标签交集（$0.4 \times \text{Jaccard}$，结合词汇支撑度阻尼抑制单标签误报）识别潜在竞争同一提示词的技能对。
- **宽泛触发词预警**：标记描述中使用 `whenever`、`anything`、`every time` 等无条件宽泛措辞的技能，降低误激活率。

详细发现规则与计算模型请参阅 [`docs/AUDIT.md`](docs/AUDIT.md)。

### 外部仓库隔离导入（`scripts/import_repo.mjs`）

在评估第三方技能仓库时，`import_repo.mjs` 提供严格的沙箱隔离评估流程：

```bash
node scripts/import_repo.mjs https://github.com/owner/repo --ref main
```

核心安全边界：
1. **安全受限克隆**：克隆至系统临时目录，强制禁用 Git Hooks、文件系统监控与子模块递归（`core.hooksPath=/dev/null`、`core.fsmonitor=false`、`submodule.recurse=false`）。
2. **符号链接与路径穿越拦截**：扫描过程自动跳过符号链接，并对 `--subdir` 参数执行真实路径（`realpath`）边界校验，防止目录穿越读取宿主文件。
3. **可执行文件隔离**：仅提取 Markdown 候选文件（`SKILL.md`、`AGENTS.md`、`CLAUDE.md`、`.cursor/rules/*.mdc` 等）；仓库内的可执行脚本仅记录安全告警，绝不复制或执行。
4. **开源协议门禁与锁文件比对**：自动识别开源许可证（`MIT`、`Apache-2.0`、`BSD` 等），将协议不明或传染性协议标记为 `reference only`（仅作参考），并结合 `.advisor-audit/skills.lock.json` 在 `.advisor-import/<repo>/proposal.md` 中输出合入建议。

---

## 构建自定义领域顾问

团队可借助元技能 [`advisor-creator`](skills/advisor-creator/SKILL.md) 将内部架构决策记录（ADR）、安全基线或编码规范整合为标准领域顾问：

```text
Activate advisor-creator to synthesize our internal API standards and OWASP controls into a custom domain advisor.
```

`advisor-creator` 将引导智能体依次完成领域聚类、场景决策矩阵构建、技术冲突仲裁、微规则提炼，并基于标准模板 [`advisor-template.md`](skills/advisor-creator/references/advisor-template.md) 生成脚手架，产物可直接通过本仓库的校验与审计工具链。

---

## 仓库目录结构

```text
agent-advisors/
├── .github/
│   ├── ISSUE_TEMPLATE/             # 新领域顾问提案 Issue 模板
│   ├── workflows/validate.yml      # CI 流水线：结构校验与自动化测试
│   └── pull_request_template.md    # Pull Request 质量核查清单
├── docs/
│   ├── AUDIT.md                    # 技能审计发现模型、重叠度算法与隔离导入安全模型
│   └── provenance/                 # 文献溯源注册表、ISBN 记录与标准映射
│       ├── README.md
│       ├── advisor-creator.md
│       ├── api-security-advisor.md
│       ├── data-storage-advisor.md
│       └── software-design-advisor.md
├── evals/
│   ├── outcome-protocol.md         # 盲测 A/B 评估协议与四维评分量表
│   ├── trigger-cases.md            # software-design-advisor 触发评测基准
│   ├── api-security-trigger-cases.md
│   └── data-storage-trigger-cases.md
├── scripts/
│   ├── lib/skill.mjs               # Frontmatter 解析、Token 估算与重叠度计算核心库
│   ├── audit_skills.mjs            # 多运行时技能盘点与重叠分析工具
│   ├── import_repo.mjs             # 隔离克隆与外部技能评估报告生成工具
│   ├── link_skills.mjs             # 跨平台符号链接/Junction 挂载与 AGENTS.md 生成工具
│   └── validate_skills.mjs         # 仓库结构不变量与链接完整性校验器
├── skills/
│   ├── advisor-creator/            # 领域顾问合成元技能与标准模板
│   ├── api-security-advisor/       # 应用安全与防御性 API 设计顾问（含 4 份参考指南）
│   ├── data-storage-advisor/       # 数据存储、索引与并发架构顾问（含 4 份参考指南）
│   └── software-design-advisor/    # 软件设计与架构工程顾问（含 14 份参考指南）
├── tests/                          # 基于 Node.js 原生测试运行器的单元测试套件
├── CONTRIBUTING.md                 # 顾问设计宪章（Advisor Design Charter）与贡献指南
├── LICENSE                         # MIT 开源许可证
└── package.json                    # 零外部依赖工程配置（要求 Node.js >= 20）
```

---

## 演进路线图（Roadmap）

| 优先级 | 交付项 | 类别 | 核心技术范围与工程价值 | 状态 |
| :---: | :--- | :--- | :--- | :---: |
| **P0** | `scripts/link_skills.mjs` | 工具链 | 零依赖跨平台符号链接与 Junction 分发管理工具，支持 Claude Code、Cursor、Codex 与 Gemini/Antigravity | 已完成 |
| **P1** | `frontend-craft-advisor` | 领域顾问 | 现代前端架构与状态治理顾问（涵盖 W3C WAI-ARIA 无障碍规范、无头状态逻辑抽离、错误边界与骨架屏降级） | 规划中 |
| **P1** | 自动化测试套件扩充 | 质量门禁 | 覆盖全部领域顾问与脚本边界条件的自动化结构断言与安全回归测试 | 进行中 |
| **P2** | `observability-advisor` | 领域顾问 | 生产环境可观测性与可靠性顾问（涵盖 OpenTelemetry 链路追踪、结构化日志、RED/USE 指标体系与告警治理） | 提案阶段 |

---

## 技术边界与常见问题（FAQ）

**领域顾问是否向模型注入了新的事实性知识？**
不是。主流基础模型在预训练阶段已掌握相关工程著作与技术标准。领域顾问的核心价值在于确立**稳定且自洽的工程决策立场**、明确的权衡仲裁准则以及结构化交付清单，避免不同会话间出现架构风格漂移。

**能否保证技能在所有目标场景下 100% 触发？**
技能路由由宿主模型依据第 1 层元数据自主判定。本仓库在 [`evals/`](evals/trigger-cases.md) 下为各领域顾问配备了标准触发评测集（涵盖正向激活、静默防误触与专用工作流让渡三类用例），用于持续验证触发准确性。

**`audit_skills.mjs` 能否自动检测两个技能正文之间的观点冲突？**
不能。静态审计工具用于确定性地识别安装冲突、结构缺陷与第 1 层触发面重叠。判断两份技能正文在工程理念上是否矛盾，需要结合人工审阅或借助大模型执行合并仲裁（详见 [`docs/AUDIT.md`](docs/AUDIT.md)）。

**审计与导入工具是否会修改或删除现有的已安装技能？**
不会。`audit_skills.mjs` 与 `import_repo.mjs` 对宿主智能体的技能安装目录严格保持只读，所有评估产物均输出至项目本地的 `.advisor-audit/` 与 `.advisor-import/` 目录。

---

## 本地开发与校验

本项目仅依赖 **Node.js >= 20** 标准库，无需安装任何第三方 npm 依赖包。

```bash
# 执行技能结构、Frontmatter 规范与文档相对链接校验
npm run validate

# 运行单元与集成测试套件
npm test

# 执行本地已安装技能盘点与触发重叠度审计
npm run audit

# 查看各运行时领域顾问挂载状态
npm run link -- --status

# 在临时隔离区评估外部 Git 仓库中的候选技能
npm run import -- <git-url>
```

---

## 参与贡献

在提交 Pull Request 前，请仔细阅读 [`CONTRIBUTING.md`](CONTRIBUTING.md)。所有贡献需遵循以下核心准则：
- **单一领域单一门面**：每个工程领域仅维护一个高内聚的领域顾问，避免拆分为碎片化微技能。
- **严守体积与语言规范**：`SKILL.md` 必须使用标准英文撰写且严格控制在 150 行以内；深度实现模式放入 `references/`。
- **明确权衡与运行边界**：清晰阐述技术取舍的因果依据，并声明在何种条件下向项目既有规范或专用工作流让渡。
- **通过质量门禁**：提交前确保 `npm run validate` 与 `npm test` 全部通过。

---

## 开源许可与文献归属

本项目基于 [MIT License](LICENSE) 开源。

### 文献溯源与版权说明

`skills/*/references/` 目录下的所有文档均为独立撰写的工程原则提炼与技术摘要，绝非原著文本复制。所涉书籍名称、作者署名及标准编号均归各自权利人所有；本项目与相关出版机构或原著作者不存在隶属或背书关系，上述参考笔记亦不能替代原著阅读。完整的文献出处、ISBN-13 记录及标准映射关系请查阅 [`docs/provenance/`](docs/provenance/README.md)。
