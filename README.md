# Agent Advisors

<p align="center">
  <strong>Cohesive, Deep-Module Engineering Advisors and Skill Governance Tooling for AI Coding Agents</strong><br>
  Consolidating fragmented prompt rules into deterministic, token-efficient domain facades.
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a> | <a href="README_ZH.md"><strong>简体中文</strong></a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933.svg" alt="Node.js >= 20">
  <img src="https://img.shields.io/badge/Runtimes-Claude%20Code%20%7C%20Cursor%20%7C%20Codex%20%7C%20Antigravity-orange.svg" alt="Supported Agent Runtimes">
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome"></a>
</p>

---

## Overview

**Agent Advisors** provides production-grade **Domain Advisors** (implemented as agent `SKILL.md` packages) and a **zero-dependency governance CLI** for AI coding runtimes including Claude Code, Cursor, Codex CLI, and Google Antigravity / Gemini CLI.

In typical agent configurations, accumulating dozens of granular micro-skills leads to three systemic problems:
1. **Persistent Context Tax**: Every installed skill's frontmatter description is loaded into the system prompt on every turn.
2. **Trigger Surface Collisions**: Overlapping skill descriptions compete for identical user prompts, producing non-deterministic routing.
3. **Unarbitrated Doctrinal Drift**: Without explicit trade-off rules, an agent oscillates between conflicting engineering dogmas (e.g., splitting code into micro-functions vs. designing deep modules, or applying full tactical DDD to simple CRUD endpoints).

Agent Advisors resolves these issues by applying the **Facade Pattern** (one authoritative advisor per engineering domain) and **Three-Level Progressive Disclosure**, paired with static analysis tools to audit installed skill sets and evaluate external repositories in quarantine.

### Components

| Component | Category | Scope & Capabilities |
| :--- | :--- | :--- |
| [`software-design-advisor`](skills/software-design-advisor/) | Domain Advisor | Synthesizes 8 software engineering domains across 14 reference guides: routine construction, deep modules, refactoring, legacy code seams, DDD, enterprise application patterns, clean architecture, and distributed resilience. |
| [`api-security-advisor`](skills/api-security-advisor/) | Domain Advisor | Enforces defensive API engineering across 4 security baselines: object-level authorization (BOLA/BOPLA/BFLA), token and session hygiene (JWT/OAuth2/PKCE), boundary validation and injection prevention, and cryptographic primitives. |
| [`data-storage-advisor`](skills/data-storage-advisor/) | Domain Advisor | Governs persistence architecture across 4 reference guides: B-Tree composite indexing (ESR rule) and keyset pagination, relational schema antipatterns, MVCC transaction isolation and concurrency locking, and connection pool sizing. |
| [`advisor-creator`](skills/advisor-creator/) | Meta-Skill | Five-stage synthesis pipeline and structural template for consolidating internal team standards or technical literature into a compliant domain advisor. |
| [`audit_skills.mjs`](scripts/audit_skills.mjs) | Governance CLI | Read-only static analyzer that inventories installed skills across runtimes, estimates per-turn token budgets, flags structural errors, and computes trigger overlap scores. |
| [`import_repo.mjs`](scripts/import_repo.mjs) | Quarantine CLI | Clones external Git repositories into an isolated temporary directory, inspects licenses and executable surfaces, compares candidates against the local lockfile, and emits an adoption proposal. |
| [`validate_skills.mjs`](scripts/validate_skills.mjs) | Quality Gate CLI | Enforces frontmatter schema compliance, line budgets (`<= 150` lines), required advisor sections, bidirectional reference integrity, and documentation link validity. |

---

## Architecture & Design Principles

### 1. Three-Level Progressive Disclosure

Each advisor is structured to minimize baseline context consumption while preserving access to deep implementation patterns when required:

```text
Level 1: Metadata (YAML Frontmatter)     ~90–140 tokens   Loaded persistently on every turn for routing
   │
   ▼  Activated when prompt matches domain intent
Level 2: Facade Gateway (SKILL.md)       <= 150 lines     Scenario matrix, trade-off arbitration, nano-rules
   │
   ▼  Loaded selectively for pattern-level implementation
Level 3: Distilled References            1–2 files max    Targeted domain guides in references/*.md
```

- **Level 1 (`name` + `description`)**: Represents the only fixed per-turn cost. Descriptions are engineered with explicit trigger and anti-trigger boundaries.
- **Level 2 (`SKILL.md`)**: Contains the **Scenario Decision Matrix**, **Engineering Trade-offs & Arbitration**, **Condensed Nano Rulesets**, **Deep Knowledge Base Index**, and **Output Delivery Checklist**. Standard architectural and implementation tasks are resolved at this level.
- **Level 3 (`references/*.md`)**: Independently authored, high-density engineering condensations. Each `SKILL.md` instructs the agent to load at most 1–2 relevant reference files per task and never preload the directory.

### 2. Deterministic Precedence & Operating Boundaries

Foundation models already possess parametric knowledge of classic engineering texts; what they lack is a **stable architectural stance**. Every advisor establishes explicit operating boundaries:
- **Project Conventions First**: Existing repository architecture, linter configurations, test suites, and explicit user instructions strictly outrank advisor defaults.
- **Workflow Deferral**: Advisors govern design and implementation decisions; they explicitly defer to dedicated code-review, test-runner, or debugging workflows when invoked.
- **Causal Trade-off Arbitration**: Instead of unconditional dogma, advisors define concrete conditions under which one pattern supersedes another (e.g., when Transaction Script is preferred over a Domain Model).

### 3. Zero-Token Provenance Separation

Bibliographic attributions, ISBN-13 identifiers, RFC/NIST/OWASP standard mappings, and copyright notices are maintained in [`docs/provenance/`](docs/provenance/README.md) rather than inside `skills/`. This separation ensures zero runtime token overhead and keeps symlinked skill directories strictly limited to runtime execution assets.

---

## Quick Start

### 1. Link Domain Advisors

Install a single advisor or link all domain advisors into your runtime's skill directory:

```bash
# macOS / Linux (Claude Code)
mkdir -p ~/.claude/skills
for advisor in software-design-advisor api-security-advisor data-storage-advisor; do
  ln -s "$(pwd)/skills/$advisor" ~/.claude/skills/$advisor
done
```

```powershell
# Windows PowerShell (Claude Code — uses Directory Junctions)
New-Item -ItemType Directory -Path "$HOME\.claude\skills" -Force | Out-Null
Get-ChildItem skills -Directory | Where-Object { $_.Name -ne "advisor-creator" } | ForEach-Object {
  New-Item -ItemType Junction -Path "$HOME\.claude\skills\$($_.Name)" -Target $_.FullName -Force
}
```

### 2. Example Prompts

Once linked, the runtime automatically activates the appropriate advisor when a prompt matches its domain:

- **Software Design & Legacy Refactoring (`software-design-advisor`)**:
  > *"Refactor this legacy order processing service to decouple payment gateway integrations without breaking existing callers."*
- **API Security & Authorization (`api-security-advisor`)**:
  > *"Implement an endpoint to retrieve invoice details by ID and enforce defenses against horizontal privilege escalation (BOLA/IDOR) and SSRF."*
- **Database Indexing & Concurrency (`data-storage-advisor`)**:
  > *"This pagination query degrades at `OFFSET 100000`. Refactor it to keyset pagination and design the supporting composite B-Tree index."*

### 3. Audit Installed Skills (Optional)

```bash
npm run audit
```

Generates a cross-runtime inventory and overlap analysis at `.advisor-audit/audit-report.md` alongside a deterministic lockfile at `.advisor-audit/skills.lock.json`.

---

## Multi-Runtime Installation

### Claude Code

```bash
mkdir -p ~/.claude/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor ~/.claude/skills/software-design-advisor
```

### Cursor

Link advisors into the project-scoped `.cursor/skills/` directory:

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

### Centralized Distribution via `cc-switch`

For environments running multiple coding agents simultaneously, [cc-switch](https://github.com/farion1231/cc-switch) can manage a single central store and distribute links across runtimes:

```powershell
Copy-Item -Recurse "skills\software-design-advisor" "$HOME\.cc-switch\skills\"
```

---

## Skill Governance & Quarantine Import

### Auditing Installed Skills (`scripts/audit_skills.mjs`)

An individual skill has no visibility into other installed skills competing for the same prompts. Running `node scripts/audit_skills.mjs` inspects the active environment and reports:

- **Per-Runtime Token Budgets**: Estimated persistent token overhead across Claude Code, Cursor, Codex, and Gemini/Antigravity (excluding passive distribution stores such as `~/.cc-switch/skills`).
- **Structural Diagnostics**: Missing YAML frontmatter, broken `references/` links, broken symlinks, and duplicate skill names resolving to divergent directories.
- **Trigger Overlap Candidates**: Pairs of skills scored by description term similarity ($0.6 \times \text{Dice}$) and domain tag intersection ($0.4 \times \text{Jaccard}$).
- **Over-Broad Trigger Detection**: Descriptions using unconditional phrasing (`whenever`, `anything`, `every time`) that cause false activations.

See [`docs/AUDIT.md`](docs/AUDIT.md) for the discovery model, scoring methodology, and operational boundaries.

### Quarantine Repository Import (`scripts/import_repo.mjs`)

To evaluate third-party skills or rule repositories without risking local environment pollution:

```bash
node scripts/import_repo.mjs https://github.com/owner/repo --ref main
```

The importer enforces a strict security boundary:
1. **Isolated Clone**: Clones into an OS temporary directory with Git hooks, filesystem monitors, and submodules disabled (`core.hooksPath=/dev/null`, `core.fsmonitor=false`, `submodule.recurse=false`).
2. **Symlink & Traversal Rejection**: Skips symbolic links during candidate discovery and validates canonical real paths on `--subdir` targets.
3. **Executable Quarantine**: Copies only markdown candidates (`SKILL.md`, `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*.mdc`, and skill-shaped notes); executable scripts are logged as security flags but never copied or executed.
4. **License & Lockfile Gating**: Inspects repository licenses (`MIT`, `Apache-2.0`, `BSD`, etc.) and marks unknown or copyleft sources as `reference only`. Compares candidates against `.advisor-audit/skills.lock.json` and outputs `.advisor-import/<repo>/proposal.md` and `manifest.json`.

---

## Authoring Custom Advisors

Teams can consolidate internal architecture decision records (ADRs), security baselines, or coding standards into a custom advisor using [`advisor-creator`](skills/advisor-creator/SKILL.md):

```text
Activate advisor-creator to synthesize our internal API standards and OWASP controls into a custom domain advisor.
```

`advisor-creator` guides the agent through domain clustering, scenario matrix construction, ideological trade-off arbitration, nano-rule distillation, and scaffolding from [`advisor-template.md`](skills/advisor-creator/references/advisor-template.md). All generated advisors conform to the structural invariants verified by `scripts/validate_skills.mjs`.

---

## Repository Structure

```text
agent-advisors/
├── .github/
│   ├── ISSUE_TEMPLATE/             # Proposal template for new domain advisors
│   ├── workflows/validate.yml      # CI pipeline: structural validation and test suite
│   └── pull_request_template.md    # PR verification checklist
├── docs/
│   ├── AUDIT.md                    # Audit discovery model, overlap formula, and import security model
│   └── provenance/                 # Bibliographic registry, ISBNs, and standards mappings
│       ├── README.md
│       ├── advisor-creator.md
│       ├── api-security-advisor.md
│       ├── data-storage-advisor.md
│       └── software-design-advisor.md
├── evals/
│   ├── outcome-protocol.md         # Blind A/B evaluation rubric and scoring protocol
│   ├── trigger-cases.md            # Trigger benchmark for software-design-advisor
│   ├── api-security-trigger-cases.md
│   └── data-storage-trigger-cases.md
├── scripts/
│   ├── lib/skill.mjs               # Frontmatter parser, token estimator, and overlap scorer
│   ├── audit_skills.mjs            # Multi-runtime inventory and overlap analyzer
│   ├── import_repo.mjs             # Quarantine git importer and proposal generator
│   └── validate_skills.mjs         # Repository structural and link validator
├── skills/
│   ├── advisor-creator/            # Meta-skill and structural template
│   ├── api-security-advisor/       # Application security & defensive API advisor (4 references)
│   ├── data-storage-advisor/       # Database schema, indexing & concurrency advisor (4 references)
│   └── software-design-advisor/    # Software architecture & design advisor (14 references)
├── tests/                          # Node.js native test runner suites (node --test)
├── CONTRIBUTING.md                 # Advisor Design Charter and contribution workflow
├── LICENSE                         # MIT License
└── package.json                    # Zero-dependency package manifest (Node.js >= 20)
```

---

## Roadmap

| Priority | Deliverable | Category | Technical Scope | Status |
| :---: | :--- | :--- | :--- | :---: |
| **P0** | `scripts/link_skills.mjs` | Tooling | Cross-platform symlink and junction manager for Claude Code, Cursor, Codex, and Gemini/Antigravity | Planned |
| **P1** | `frontend-craft-advisor` | Domain Advisor | Frontend architecture and state governance (W3C WAI-ARIA, headless state isolation, error boundaries, and skeleton states) | Planned |
| **P1** | Test Suite Expansion | Quality Gate | Automated invariant and structural assertions across all shipped domain advisors | In Progress |
| **P2** | `observability-advisor` | Domain Advisor | Production reliability and observability (OpenTelemetry tracing, structured logging, RED/USE metrics, and alert hygiene) | Proposed |

---

## Technical Boundaries & FAQ

**Does an advisor add new factual knowledge to the model?**
No. Foundation models are already pre-trained on standard engineering literature and specifications. An advisor establishes a deterministic architectural stance, explicit trade-off arbitrations, and a verification checklist so engineering decisions remain consistent across sessions.

**Is skill activation deterministic?**
Skill routing is model-driven based on Level-1 metadata. Each advisor is paired with a benchmark in [`evals/`](evals/trigger-cases.md) defining positive activation cases, dormant (anti-trigger) cases, and workflow deferral cases.

**Does `audit_skills.mjs` detect semantic contradictions between two skills' bodies?**
No. The audit tool deterministically detects installation conflicts, structural defects, and Level-1 trigger surface overlap. Identifying doctrinal contradictions between two skill bodies requires human review or LLM-assisted arbitration during consolidation (see [`docs/AUDIT.md`](docs/AUDIT.md)).

**Do the audit or import tools modify installed skills?**
No. Both `audit_skills.mjs` and `import_repo.mjs` are strictly read-only with respect to agent runtime directories.

---

## Development & Verification

Requires **Node.js >= 20** with zero external npm dependencies.

```bash
# Run structural, frontmatter, and link validation
npm run validate

# Execute unit and integration test suites
npm test

# Run local skill inventory and overlap audit
npm run audit

# Evaluate an external repository in quarantine
npm run import -- <git-url>
```

---

## Contributing

Please review [`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting a Pull Request. All contributions must adhere to the Advisor Design Charter:
- Maintain a single cohesive advisor per engineering domain.
- Keep `SKILL.md` at or below 150 lines in canonical English; place deep implementation notes in `references/`.
- Document explicit trade-off rationales and operating boundaries.
- Ensure `npm run validate` and `npm test` pass with zero errors.

---

## License & Attribution

Released under the [MIT License](LICENSE).

### Bibliographic Attribution

Reference documents under `skills/*/references/` are independently authored engineering syntheses and condensations. All book titles, author names, and standard designations remain the property of their respective copyright holders. This project is neither affiliated with nor endorsed by the original publishers or authors, and these reference notes are not substitutes for the original works. Full bibliographic lineage and ISBN records are documented in [`docs/provenance/`](docs/provenance/README.md).
