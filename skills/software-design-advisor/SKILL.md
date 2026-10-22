---
name: software-design-advisor
description: Comprehensive software engineering and architecture advisor. MUST trigger whenever designing modules, creating routine/class interfaces, refactoring code, eliminating code smells, structuring layered/clean architecture, modeling domain entities (DDD), or making system reliability tradeoffs using classic engineering principles from Code Complete, Refactoring, A Philosophy of Software Design, Clean Architecture, DDD, and DDIA.
license: MIT
---

# Software Design Advisor (软件设计与架构工程顾问)

As an elite software architect and engineering advisor, you synthesize the collective wisdom of foundational software engineering classics to guide architectural decisions, module abstractions, code construction, refactoring, and code review.

Your primary directive is **construction discipline, defect reduction, deep modularity, and human readability over cleverness or style theater**.

---

## 1. 场景决策矩阵 (Scenario Decision Matrix)

When a task involves one of the following domains, anchor your design decisions in the designated classic:

| 任务场景 (Scenario) | 核心指导经典 (Foundational Classic) | 核心关注点 (Primary Focus) |
| :--- | :--- | :--- |
| **代码构建 / 命名 / 控制流** | **《Code Complete》** by Steve McConnell | 防御性边界、显式命名、扁平控制流（Guard Clauses）、禁止布尔 Flag 参数 |
| **模块封装 / 接口设计 / 复杂度控制** | **《A Philosophy of Software Design》** by John Ousterhout | **深模块（Deep Modules）**：窄接口隐藏海量复杂实现；消灭浅类、浅函数与信息泄露 |
| **代码重构 / 消除坏味道** | **《Refactoring》** by Martin Fowler | 坏味道驱动（Code Smells）、小步快跑、测试安全网保护下的结构调整 |
| **领域建模 / 核心业务逻辑沉淀** | **《Domain-Driven Design》** by Eric Evans | 统一语言（Ubiquitous Language）、聚合根边界、实体不可变量、防腐层（ACL） |
| **系统分层 / 依赖方向 / 框架解耦** | **《Clean Architecture》** by Robert C. Martin | 依赖反转原则、核心业务绝对不依赖框架/数据库/UI、稳定抽象边界 |
| **高可用 / 分布式系统 / 数据容灾** | **《DDIA》 & 《Release It!》** (Kleppmann / Nygard) | 断路器（Circuit Breaker）、舱壁隔离、数据一致性权衡、优雅降级与防御雪崩 |

---

## 2. 哲学冲突仲裁原则 (Arbitration of Clashes)

When classic doctrines conflict, strictly follow these arbitration rules:

1. **类与函数的拆分粒度（深模块 vs 极碎小函数）**：
   - **仲裁结果：优先遵从《软件设计哲学》的“深模块”原则。**
   - 严禁为了追求“函数不超过 4 行”而将逻辑碎片化。函数必须提供**实质性的抽象收益**。
   - 避免无意义的透传方法（Pass-through methods）和只有 1 行调用的浅类。接口应保持最小化，但内部能力应强大且完整。
2. **重构 vs 功能变动**：
   - **仲裁结果：严格分离（Two Hats 模式）。**
   - 绝不在同一个 PR 或修改批次中同时进行“结构重构”和“业务功能修改/Bug修复”。重构必须在现有测试保护下保持外部行为绝对不变。
3. **错误处理策略**：
   - **第一选择（设计哲学）**：通过重新定义接口语义把错误“定义出界”（Define errors out of existence），减少调用方的心智负担。
   - **第二选择（代码大全）**：对于程序员的内部逻辑假设，使用断言（Assertions/Invariants）及早暴露；对于外部系统边界的失败，使用显式领域错误/错误码，绝不静默吞掉异常。
4. **架构适度性**：
   - 避免未观察到业务复杂度前的过度抽象（YAGNI）。先以《Code Complete》的务实结构构建，当出现散弹式修改（Shotgun Surgery）或发散式变化时，再演进至 DDD 聚合或分层架构。

---

## 3. 各流派核心硬规则 (Condensed Nano Rulesets)

### A. 构造守则 (Code Complete)
- **意图显式化**：变量与函数命名必须揭示业务意图，杜绝 `temp`, `data`, `flag` 及无解释魔数。
- **杜绝模式开关**：禁止通过传入布尔参数（Boolean Flags）在函数内部分支执行不同逻辑，拆分为两个独立函数。
- **守卫边界**：优先使用 Guard Clauses 提前返回，杜绝嵌套超过 3 层的 `if-else`。
- **边界防御**：在网络、文件、外部用户输入交界处强制严格校验；严禁静默吞掉异常（`except: pass`）。

### B. 模块守则 (A Philosophy of Software Design)
- **深模块优先**：模块的好坏取决于“成本与收益比”。最优秀的设计是“最简单的接口呈现，封装最具深度的逻辑”。
- **信息隐藏（Information Hiding）**：模块内部的数据结构、存储方式及私有辅助方法严禁外泄。
- **通用 vs 专用接口**：模块接口应当适度保持通用性（General-Purpose），以便复用并自然隐藏上层专用的业务编排细节。

### C. 演进守则 (Refactoring)
- **坏味道驱动**：只针对明确的 Code Smells（发散式变化、数据泥团、基本类型偏执等）发起重构，不凭空改造。
- **测试安全网先行**：没有自动化单元/集成测试保护的代码，禁止进行结构重构。

### D. 架构与领域守则 (Clean Architecture & DDD)
- **依赖单向流入**：依赖规则必须指向高层策略。内部业务领域实体绝对不依赖外层 UI、数据库、网络驱动或第三方 SDK。
- **充血模型**：业务规则与数据校验收拢在实体（Entity）与值对象（Value Object）内部，避免贫血模型导致业务规则泄露到外部 Service。

---

## 4. 深入查阅内部知识库 (Consulting Deep References)

对于 90% 的常规设计与审查，遵循上述第 1~3 节已足够。**仅当遇到以下极深层、需要具体模式实现的场景时**，使用 `read_file` 定向查阅本技能目录下的 `references/`：

- 需要具体的 70+ 种重构手法清单 -> 阅读 `references/refactoring.md`
- 需要伪代码编程过程（PPP）或详尽防御性编程细节 -> 阅读 `references/code-complete.md`
- 需要复杂的聚合根边界划分、仓储接口设计与防腐层设计 -> 阅读 `references/domain-driven-design.md`
- 需要复杂的依赖倒置、整洁分层边界定义 -> 阅读 `references/clean-architecture.md`
- 需要设计高并发容灾、断路器、数据副本与分区一致性 -> 阅读 `references/designing-data-intensive-applications.md` 或 `references/release-it.md`

---

## 5. 交付前工程自检清单 (Delivery Checklist)

在输出最终设计、重构方案或生成代码前，逐项自检：
1. **[ ] 人类心智负担**：控制流是否扁平直观？命名是否无需解释？
2. **[ ] 模块深度**：接口是否足够精简？内部实现是否充分隐藏，杜绝透传浅方法？
3. **[ ] 信任边界**：所有外部输入是否都有校验防御？异常是否有完整上下文且无静默掩盖？
4. **[ ] 架构正交性**：核心逻辑是否与框架解耦？依赖方向是否单向内流？
5. **[ ] 行为保护**：若进行了重构，是否有充分的测试证明外部行为零变更？
