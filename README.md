# 🏛️ Agent Advisors

<p align="center">
  <strong>A curated suite of unified, deep-module AI agent advisors.</strong><br>
  Ending prompt bloat and ideological skill clashes via the Facade pattern and three-level progressive disclosure.
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a> | <a href="README_ZH.md"><strong>简体中文</strong></a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Agents-Claude%20Code%20%7C%20Cursor%20%7C%20Codex%20%7C%20Antigravity-orange.svg" alt="Supported Agents">
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome"></a>
</p>

---

## Table of Contents

- [Why Agent Advisors?](#-why-agent-advisors)
  - [The "Shallow Skills" Crisis](#the-shallow-skills-crisis)
  - [The Deep-Module Paradigm](#the-deep-module-paradigm)
- [Architecture: Three-Level Progressive Disclosure](#-architecture-three-level-progressive-disclosure)
- [The Advisors Catalog & Roadmap](#-the-advisors-catalog--roadmap)
- [Quick Start & Installation](#-quick-start--installation)
  - [1. Claude Code](#1-claude-code-anthropic-cli)
  - [2. Cursor](#2-cursor)
  - [3. OpenAI Codex](#3-openai-codex--cli)
  - [4. Google Antigravity / Gemini CLI](#4-google-antigravity--gemini-cli)
  - [5. Centralized Management via cc-switch](#5-centralized-multi-agent-management-via-cc-switch-secondary-recommendation)
- [How It Works in Action](#-how-it-works-in-action)
- [Repository Structure](#-repository-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 Why Agent Advisors?

### The "Shallow Skills" Crisis
As AI coding agents become essential pair-programmers, the developer ecosystem has flooded with hundreds of ad-hoc prompt snippets, rules, and micro-skills. However, this **shallow skill accumulation** quickly leads to three systemic failures:

1. **Ideological Clashes & Cognitive Dissonance**: Different books and rules preach contradictory dogmas (e.g., dogmatically demanding 3-line functions vs. advocating cohesive, information-hiding deep modules). Unarbitrated skills cause the agent to waver erratically between conflicting styles across conversational turns.
2. **Context Window Bloat & Attention Dilution**: Loading dozens of granular skill names and descriptions into the system prompt pollutes the top-level reasoning context, crowding out task context and triggering hallucinations.
3. **Execution Friction & Undertriggering**: Long, nested "skill-calling-skill" chains create excessive round-trips. Agents frequently become confused, pick randomly, or lazily skip loading guidance entirely.

### The Deep-Module Paradigm
Inspired by John Ousterhout’s *A Philosophy of Software Design* and the classic **Facade Pattern**, `agent-advisors` reorganizes agent capabilities:

> **Do not scatter dozens of shallow rules. Consolidate entire technical disciplines into cohesive, high-leverage "Advisors" that arbitrate conflicts internally and expose a zero-friction interface to the agent.**

---

## 📐 Architecture: Three-Level Progressive Disclosure

Every advisor in this repository strictly adheres to a three-level loading model:

```
Level 1: Metadata (Always In Context) ── Ultra-light (~30 Tokens)
   │     • Injected into system prompts as an intent-rich, pushy trigger.
   │     • Zero context bloat; stays completely dormant until relevant tasks arise.
   ▼
Level 2: Unified Brain & Arbitration (SKILL.md) ── Loaded on Trigger (~120 Lines)
   │     • Scenario decision matrix, cross-school clash arbitration, and nano rulesets.
   │     • Resolves 90% of architectural and technical decisions in a single round-trip.
   ▼
Level 3: Deep Knowledge Repositories (references/) ── Deep Dive On-Demand
         • Comprehensive canonical texts and complete handbooks kept completely private.
         • Prevents global skill namespace pollution while preserving full depth.
```

---

## 📚 The Advisors Catalog & Roadmap

Each advisor takes complete ownership of a broad engineering domain:

| Advisor | Domain | Status | Key Highlights |
| :--- | :--- | :---: | :--- |
| **[`software-design-advisor`](skills/software-design-advisor/)** | **Software Architecture & Construction** | 🟢 **Active** | Synthesizes **14 foundational classics** (*Code Complete, Philosophy of Software Design, Refactoring, Clean Architecture, DDD, PoEAA, DDIA, Release It!*). Arbitrates granularity, seams, and boundaries. |
| **[`advisor-creator`](skills/advisor-creator/)** | **Meta-Engineering & Skill Synthesis** | 🟢 **Active** | Built-in meta-advisor engine to synthesize fragmented domain handbooks into new, standardized deep-module advisors. |
| **`frontend-craft-advisor`** | **Modern Web & UI Architecture** | 🚧 Planned | Component composition, accessible state machines, design token systems, rendering performance tuning. |
| **`system-reliability-advisor`** | **SRE & Distributed Systems** | 🚧 Planned | Chaos engineering, distributed tracing, circuit breaking, bulkhead partitioning, zero-downtime database cutovers. |
| **`security-guard-advisor`** | **AppSec & Defense-in-Depth** | 🚧 Planned | Threat modeling (STRIDE), supply-chain audit, input hygiene, OWASP Top 10 mitigation. |
| **`database-storage-advisor`** | **Data Modeling & Storage Engine** | 🚧 Planned | Relational index tuning, query plan analysis, cache-aside strategies, distributed consensus and partitioning. |

---

## 🚀 Quick Start & Installation

Install advisors directly into your favorite agent environment (ordered by popularity):

### 1. Claude Code (Anthropic CLI)
Symlink the advisor into Claude Code's skill store:
```bash
# macOS / Linux
mkdir -p ~/.claude/skills
ln -s "$(pwd)/skills/software-design-advisor" ~/.claude/skills/software-design-advisor

# Windows (PowerShell - run as Administrator)
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

### 2. Cursor
Place or symlink the advisor directory into your project's `.cursor/skills/` (or configure via `.cursorrules` / project prompt):
```bash
mkdir -p .cursor/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor .cursor/skills/software-design-advisor
```

### 3. OpenAI Codex / CLI
Add the advisor path to your active skills catalog:
```bash
mkdir -p ~/.codex/skills
ln -s /path/to/agent-advisors/skills/software-design-advisor ~/.codex/skills/software-design-advisor
```

### 4. Google Antigravity / Gemini CLI
Mount the advisor using a directory junction (does not require administrator elevation on Windows):
```powershell
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

### 5. Centralized Multi-Agent Management via `cc-switch` (Secondary Recommendation)
If you switch between multiple agent runtimes (Claude Code, Codex, Antigravity, OpenCode), use [cc-switch](https://github.com) for unified management:
1. Copy or link advisors into the cc-switch storage:
   ```powershell
   Copy-Item -Recurse "skills\software-design-advisor" "$HOME\.cc-switch\skills\"
   ```
2. Enable the advisor in the cc-switch interface to propagate it instantly across all active agents.

---

## 🎬 How It Works in Action

When you provide a prompt like:
> *"Help me refactor this legacy order processing service. The logic is tangled, but I can't break existing consumers."*

1. **Automatic Activation**: The agent's skill runner detects architectural/refactoring intent and activates `software-design-advisor`.
2. **Arbitrated Decision**: The advisor guides the agent to:
   - Apply Michael Feathers' seam technique (*Working Effectively with Legacy Code*) to inject characterization tests before refactoring.
   - Separate refactoring from behavior changes (*Two Hats Principle*).
   - Consolidate shallow classes into deep modules (*Philosophy of Software Design*), eliminating verbose pass-through wrappers.
3. **Structured Output**: The agent delivers code structured cleanly into:
   - Architectural Tradeoff & Rationale
   - Test-protected Implementation
   - Pre-Delivery Checklist Verification

---

## 📁 Repository Structure

This repository follows the standard Agent Skills Catalog Specification:

```text
agent-advisors/
├── .github/                       # GitHub workflow and community configurations
├── skills/                        # Standard Skill Catalog Root
│   └── software-design-advisor/   # The Software Architecture Advisor
│       ├── SKILL.md               # Canonical English machine-executable advisor interface
│       └── references/            # Bundled deep reference repositories (14 classics)
│           ├── code-complete.md
│           ├── a-philosophy-of-software-design.md
│           ├── refactoring.md
│           └── ...
├── CONTRIBUTING.md                # Advisor engineering specification & guidelines
├── LICENSE                        # MIT License
├── README.md                      # International Documentation (English)
└── README_ZH.md                   # Chinese Documentation (简体中文)
```

---

## 🛠️ Contributing

We welcome community contributions! If you wish to propose or build a new Advisor (e.g., `frontend-craft-advisor` or `security-guard-advisor`), please read our **[Contribution Guidelines](CONTRIBUTING.md)** first.

Key requirements for all advisors:
- **Single Facade**: One domain, one comprehensive advisor.
- **Explicit Conflict Arbitration**: Clarify philosophical clashes before listing rules.
- **Progressive Disclosure**: `SKILL.md` under 150 lines; place comprehensive treaties in `references/`.
- **Canonical English Execution**: `SKILL.md` must be written in canonical, rationale-backed English for optimal machine execution across all LLMs.

---

## 📄 License

This repository is licensed under the [MIT License](LICENSE) © 2026 [cqzeng](https://github.com/cqzeng).
