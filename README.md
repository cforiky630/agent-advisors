# Agent Advisors

<p align="center">
  <strong>Cohesive, Deep-Module Engineering Advisors and Skill Governance Tooling for AI Coding Agents</strong><br>
  Replace fragmented prompt clutter with deterministic, token-efficient domain facades.
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a> | <a href="README_ZH.md"><strong>简体中文</strong></a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933.svg" alt="Node.js >= 20">
  <img src="https://img.shields.io/badge/Agents-Claude%20Code%20%7C%20Cursor%20%7C%20Codex%20%7C%20Antigravity-orange.svg" alt="Supported Agent Runtimes">
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome"></a>
</p>

---

## What is Agent Advisors?

> **Positioning First — Domain Knowledge Facades + Runtime Checkpoints**: Across the agent ecosystem, "Advisor" refers either to *static domain skills* (loaded when a task matches a domain) or *runtime escalation protocols* (summoned mid-session at high-stakes decision points). **Agent Advisors** is first and foremost a **Skill Governance & Deep-Module Domain Facade Framework**—and bridges mid-session decision points via a zero-daemon **[Runtime Checkpoint Protocol](docs/CHECKPOINT_PROTOCOL.md)**.

**Agent Advisors** is a dual-layer open-source repository designed for the AI coding agent ecosystem:

1. **The Core Asset — Domain Advisors (`skills/`)**: Standalone, runtime-agnostic engineering skills. Each advisor acts as an evidence-gated domain facade (Software Architecture, Defensive API Security, Database Persistence), guiding models with concrete codebase probes (`Probe`), trade-off rationales (`Arbitration`), and falsifiability bounds (`Invalidate When`) without persistent prompt bloat.
2. **The Governance Toolchain (`scripts/`)**: An optional, zero-dependency management suite to audit token overhead across runtimes, analyze positive/negative trigger ontologies, validate against a 57-case prompt benchmark, and evaluate untrusted third-party skill repositories in OS quarantine.

> **Zero Tooling Requirement**: The advisors under `skills/` are pure, self-contained Markdown assets (`SKILL.md` + `references/`). You can adopt and run the advisors directly in any agent runtime without ever installing Node.js dependencies or invoking script tooling.

---

# Part I: The Domain Advisors

## Shipped Advisors

| Advisor | Scope | Reference Lineage |
| :--- | :--- | :--- |
| [`software-design-advisor`](skills/software-design-advisor/) | Synthesizes 8 software engineering domains: routine construction, deep modules, refactoring mechanics, legacy code seams, tactical DDD, enterprise patterns, clean architecture, and distributed resilience. | 14 distilled engineering guides in `references/` |
| [`api-security-advisor`](skills/api-security-advisor/) | Enforces defensive API engineering: object- and function-level authorization (BOLA/BOPLA/BFLA), token and session hygiene (JWT/OAuth2/PKCE), boundary parsing and injection prevention, and cryptographic primitives. | 4 distilled security baselines in `references/` |
| [`data-storage-advisor`](skills/data-storage-advisor/) | Governs relational persistence architecture: B-Tree composite indexing (ESR rule) and keyset pagination, relational schema antipatterns, MVCC transaction isolation, and connection pool sizing. | 4 distilled database guides in `references/` |
| [`advisor-creator`](skills/advisor-creator/) | Meta-skill providing a five-stage synthesis pipeline and skeleton template to consolidate internal team standards or technical literature into new domain advisors. | 1 structural template in `references/` |

---

## Quick Adoption (Choose Your Workflow)

Adopting an advisor requires no background processes or configuration files. Choose the path that fits your runtime:

### Option A: Claude Code Plugin (Zero Terminal Commands)

This repository conforms natively to the Claude Code plugin specification. In your Claude Code chat interface, run:

```text
/plugin add cforiky630/agent-advisors
```

Claude Code clones and loads all domain advisors automatically into your active session.

### Option B: Prompt-Driven Installation (Cursor, Gemini, Codex, or Claude)

Because modern AI coding assistants can inspect repositories and manage local workspaces, you can delegate installation directly to your agent. Paste the following instruction into your agent's chat:

```text
Please download the domain advisors from https://github.com/cforiky630/agent-advisors (specifically the directories under skills/) and place them into my active agent skills directory (e.g., .cursor/skills/ for Cursor or ~/.claude/skills/ for Claude Code).
```

### Option C: Interactive Installer CLI (For Repository Clones)

If you have cloned this repository locally, launch the zero-dependency interactive wizard:

```bash
# Launches terminal menu with auto-detection of active runtimes
node scripts/link_skills.mjs
```

The wizard detects installed environments (Claude Code, Cursor, Gemini/Antigravity, Codex, cc-switch) and lets you choose between:
- **Symlink / Junction**: Links to this repository; automatically stays updated on `git pull`.
- **Standalone Copy (`--copy`)**: Decouples files completely; you can safely move or delete the cloned repository afterward.

<details>
<summary>Scripted CLI Examples & Non-Interactive Usage</summary>

```bash
# Link all domain advisors to Claude Code
node scripts/link_skills.mjs --client claude

# Link into a specific Cursor project
node scripts/link_skills.mjs --client cursor --project /path/to/your/project

# Standalone copy mode (decoupled from git clone)
node scripts/link_skills.mjs --client gemini --copy

# Check cross-runtime installation health
node scripts/link_skills.mjs --status

# Reversible uninstallation
node scripts/link_skills.mjs --unlink
```

</details>

---

## Architectural Principles

### 1. Three-Level Progressive Disclosure & Evidence-Gated Decisions

Foundation models pay an ongoing context fee for every installed skill description. Agent Advisors minimizes baseline token consumption while ensuring decisions are anchored in **verifiable repository evidence rather than unexamined textbook dogma**:

```text
Level 1: Positive + Negative Ontology     ~90–140 tokens   Persistent routing with explicit 'Do not trigger for' bounds
   │
   ▼  Activated when user task matches positive domain intent
Level 2: Evidence-Gated Facade (SKILL.md) <= 150 lines     Unified routing table, Repo Probes, Invalidate-When bounds
   │
   ▼  Loaded selectively only when pattern-level detail is needed
Level 3: Falsifiable References           1–2 files max    Targeted deep notes + Counter-Indications in references/*.md
```

- **Level 1 (`name` + `description`)**: Pairs positive scope triggers with an explicit `Do not trigger for...` anti-trigger boundary so orthogonal skills do not collide.
- **Level 2 (`SKILL.md`)**: Eliminates duplicate routing tables by mapping scenarios directly to `references/*.md` in Section 1, freeing budget for **Evidence-Gated Trade-offs** in Section 2:
  - **`Probe`**: Concrete codebase artifacts (test coverage/seams, `EXPLAIN` plans, active auth middleware) the agent must inspect *before* choosing a branch.
  - **`Arbitration`**: Deterministic default choice and causal rationale.
  - **`Invalidate When`**: Explicit counter-indications stating when the advisor's default fails and must be reversed.
- **Level 3 (`references/*.md`)**: High-density engineering condensations that include explicit `When This Default Fails (Counter-Indications)` sections and cross-advisor alignment (e.g., reconciling API Security's non-sequential IDs with Data Storage's B-Tree locality via `UUIDv7`/`KSUID`).

### 2. Dual-Mode Operation: Static Facade & Runtime Checkpoint Protocol

Loading a skill at turn 1 does not prevent context pollution at turn 80. Every advisor supports two operating modes (see [`docs/CHECKPOINT_PROTOCOL.md`](docs/CHECKPOINT_PROTOCOL.md)):
- **Mode A — Static Domain Facade (Default)**: Loaded automatically at task start when the prompt matches domain intent.
- **Mode B — Runtime Checkpoint Gate (`CP-1` / `CP-2` / `CP-3`)**: Breaks the self-referential "when to consult" paradox using three objective state triggers:
  1. **`CP-1` (Irreversible Boundary)**: Mutating database migrations, public API contracts, or auth/crypto primitives.
  2. **`CP-2` (Thrashing Loop)**: Hitting $\ge 2$ consecutive test/build regressions or revert cycles on the same unit.
  3. **`CP-3` (Proportionality Jump)**: Stepping up the Proportionality Ladder across $> 3$ files or a new architectural layer.
  When triggered, the agent packages a $\le 200$-token **Context-Stripped Consultation Packet** (stripping noisy session history) for an isolated subagent or checkpoint pass (`Verdict: APPROVE | REVISE | ESCALATE_TO_USER`, capped at 2 checkpoints/task).

### 3. Operating Boundaries & Proportionality

Every advisor operates under explicit precedence boundaries:
- **Project Conventions First**: Existing repository architecture, database migrations, middlewares, linters, tests, and explicit user instructions strictly supersede advisor defaults.
- **Workflow Deferral**: Advisors govern design and implementation; when an adjacent dedicated workflow (e.g., test-runner, specialized vulnerability scanner, debugger) owns the task, the advisor yields process control and supplies only architectural rationale.
- **Proportionality Ladder & Intentional Deferrals**: Simple flat constructs and standard libraries are exhausted before introducing layered abstractions. When omitting heavier patterns, the advisor documents the exact scale or threat threshold that would warrant adopting them later.

### 4. Zero-Token Provenance Separation

Formal bibliographic citations, ISBN-13 records, standard designations (RFC, NIST, OWASP, CWE), and copyright notices are isolated in [`docs/provenance/`](docs/provenance/README.md). They are physically separated from `skills/` to ensure zero runtime token waste and clean symlinking.

---

## Example Invocations

Once installed, prompts matching an advisor's domain automatically activate its engineering guidance:

- **Legacy Refactoring & Seam Construction (`software-design-advisor`)**:
  > *"Refactor this tangled order service to support multiple payment processors without breaking existing callers or changing behavioral contracts."*
- **Defensive API Authorization (`api-security-advisor`)**:
  > *"Implement a route to retrieve invoice details by ID. Ensure defenses against BOLA/IDOR, prevent SSRF on webhook callbacks, and validate bounds at the controller boundary."*
- **Query Optimization & Indexing (`data-storage-advisor`)**:
  > *"This pagination query times out on large offsets. Convert it to keyset pagination and define the required composite B-Tree index following the ESR rule."*

---

# Part II: Skill Governance Toolchain

For developers, team leads, and agent architects managing growing skill sets across multiple runtimes, this repository provides a zero-dependency static analysis toolchain in `scripts/`.

```text
scripts/
├── link_skills.mjs           # Interactive wizard, cross-platform distributor & AGENTS.md compiler
├── audit_skills.mjs          # Multi-runtime inventory, budget estimator, and trigger overlap analyzer
├── import_repo.mjs           # Quarantine git cloner, license detector, and proposal generator
├── validate_skills.mjs       # Structural validator and link integrity checker
└── lib/skill.mjs             # Shared frontmatter parser, token estimator, and overlap scorer
```

### 1. Auditing Installed Skills (`audit_skills.mjs`)

An individual skill cannot see other skills installed in your runtime. Running `npm run audit` inspects the active workstation:

```bash
npm run audit
```

- **Per-Runtime Token Overhead**: Calculates persistent description tokens across Claude Code, Cursor, Codex, and Gemini/Antigravity (excluding passive stores like `~/.cc-switch/skills`).
- **Cross-Directory Deduplication**: Merges identical physical copies while flagging content drift across roots.
- **Positive/Negative Trigger Ontology & Overlap Analysis**: Separates positive triggers from `Do not trigger for...` anti-trigger clauses (`splitTriggerSurface`), scores pairs via $0.6 \times \text{Dice} + 0.4 \times \text{Jaccard}$, and applies an **Orthogonality Discount** when skills explicitly exclude each other's domains.
- **Counterfactual Trigger Benchmark (`npm run validate`)**: Evaluates all 57 prompt cases in `evals/*-trigger-cases.md` to verify that positive prompts activate their advisor and dormant prompts never over-trigger.
- **Reports**: Outputs human-readable diagnostics to `.advisor-audit/audit-report.md` and a deterministic lockfile to `.advisor-audit/skills.lock.json`. See [`docs/AUDIT.md`](docs/AUDIT.md).

### 2. Quarantine Repository Import (`import_repo.mjs`)

Safely evaluate skills from external repositories without risking local environment contamination:

```bash
node scripts/import_repo.mjs https://github.com/owner/repo --ref main
```

- Clones into an isolated OS temporary directory with Git hooks, filesystem monitors, and submodules disabled.
- Enforces strict path traversal and symbolic link containment on `--subdir` targets.
- Copies only Markdown candidate assets (`SKILL.md`, `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*.mdc`); executable scripts are cataloged as security flags but never copied or executed.
- Emits an adoption assessment report at `.advisor-import/<repo>/proposal.md`.

### 3. Compiling Messy ADRs & Rules (`advisor-creator`)

Compile scattered Architecture Decision Records (`docs/adr/*.md`), `.cursor/rules/*.mdc`, or `CLAUDE.md` files into an evidence-gated domain advisor:

```text
Activate advisor-creator to scan our docs/adr/ and .cursor/rules/, extract contradictory rules, and compile them into a domain advisor.
```

Instead of shifting domain modeling onto the user, `advisor-creator` automatically scans raw files for doctrinal contradictions and unguarded `ALWAYS`/`NEVER` rules, injects `Probe` and `Invalidate When` boundaries from [`advisor-template.md`](skills/advisor-creator/references/advisor-template.md), and outputs a **Compilation ROI Scorecard** (per-turn token savings %, resolved rule conflicts, and added proportionality guards).

---

## Development & Quality Assurance

Requires **Node.js >= 20** with zero third-party npm dependencies.

```bash
# Validate frontmatter schemas, 150-line limits, headings, and relative links
npm run validate

# Run native test suites covering distributor, auditor, importer, and core library
npm test
```

---

## Contributing & License

Please review [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a Pull Request. Licensed under the [MIT License](LICENSE).

### Bibliographic Attribution

Files under `skills/*/references/` are independently authored condensations and engineering syntheses. All book titles, authors, and standard names remain the property of their respective copyright holders. This project is neither affiliated with nor endorsed by the original authors or publishers. Bibliographic mappings and ISBN records are maintained in [`docs/provenance/`](docs/provenance/README.md).
