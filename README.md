# 🏛️ Agent Advisors

<p align="center">
  <strong>A curated suite of unified, deep-module AI agent advisors.</strong><br>
  Ending fragmented prompt clutter and context window bloat via holistic domain synthesis and three-level progressive disclosure.
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
  - [The Fragmentation Problem](#the-fragmentation-problem)
  - [The Deep-Module Synthesis](#the-deep-module-synthesis)
- [Architecture: Three-Level Progressive Disclosure](#-architecture-three-level-progressive-disclosure)
- [The Advisors Catalog](#-the-advisors-catalog)
- [Quick Start & Installation](#-quick-start--installation)
  - [1. Claude Code](#1-claude-code-anthropic-cli)
  - [2. Cursor](#2-cursor)
  - [3. OpenAI Codex](#3-openai-codex--cli)
  - [4. Google Antigravity / Gemini CLI](#4-google-antigravity--gemini-cli)
  - [5. Centralized Multi-Agent Management via cc-switch](#5-centralized-multi-agent-management-via-cc-switch-secondary-recommendation)
- [How It Works in Action](#-how-it-works-in-action)
- [Repository Structure](#-repository-structure)
- [Creating Custom Advisors](#-creating-custom-advisors)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 Why Agent Advisors?

### The Fragmentation Problem
As AI coding agents become default pair-programming companions, developers typically accumulate dozens of individual rules, prompt snippets, and micro-skills. In practice, this **fragmented setup** causes three severe bottlenecks:

1. **Disconnected Engineering Vision**: Software construction is an interconnected whole—routine naming, error defense, refactoring, and layered architecture are not isolated tasks. Splitting them into dozens of separate micro-skills forces the developer to manually coordinate which skill to call at each stage.
2. **Context Window Bloat**: Registering dozens of individual skills floods the system prompt with verbose descriptions on every turn, diluting the agent's attention and consuming valuable reasoning tokens.
3. **Execution Friction & Undertriggering**: When presented with an overwhelming menu of overlapping micro-skills, agents suffer from decision friction—often undertriggering or failing to load the relevant guidance entirely.

### The Deep-Module Synthesis
Inspired by John Ousterhout’s *A Philosophy of Software Design* and the classic **Facade Pattern**, `agent-advisors` consolidates domain wisdom into **high-leverage, deep-module Advisors**:

> **Instead of registering dozens of fragmented micro-rules, synthesize entire engineering disciplines into cohesive Advisors that encapsulate deep knowledge behind a clean, zero-friction interface.**

---

## 📐 Architecture: Three-Level Progressive Disclosure

Every advisor in this repository strictly adheres to a three-level loading model:

```
Level 1: Metadata (Always In Context) ── Ultra-light (~30 Tokens)
   │     • Injected into system prompts as an intent-rich trigger.
   │     • Zero context bloat; stays completely dormant until relevant tasks arise.
   ▼
Level 2: Unified Brain & Decision Matrix (SKILL.md) ── Loaded on Trigger (~120 Lines)
   │     • Scenario decision matrix, engineering trade-offs, and nano rulesets.
   │     • Resolves 90% of architectural and technical decisions in a single round-trip.
   ▼
Level 3: Deep Reference Repositories (references/) ── Deep Dive On-Demand
         • Comprehensive canonical texts and complete handbooks kept completely private.
         • Prevents global skill namespace pollution while preserving full depth.
```

---

## 📚 The Advisors Catalog

| Advisor | Domain | Status | Key Highlights |
| :--- | :--- | :---: | :--- |
| **[`software-design-advisor`](skills/software-design-advisor/)** | **Software Architecture & Construction** | 🟢 **Active** | A comprehensive engineering advisor synthesizing **14 foundational classics** (*Code Complete, Philosophy of Software Design, Refactoring, Clean Architecture, DDD, PoEAA, DDIA, Release It!*). Covers routine construction, seam-driven refactoring, and domain boundaries. |
| **[`advisor-creator`](skills/advisor-creator/)** | **Meta-Engineering & Synthesis Engine** | 🟢 **Active** | Built-in meta-advisor engine that provides a 5-step pipeline to synthesize scattered domain handbooks, prompt rules, or standards into new, standardized deep-module advisors. |

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

When you prompt your agent with a task like:
> *"Help me refactor this legacy order processing service. The logic is tangled, but I cannot break existing consumers."*

1. **Automatic Activation**: The agent's skill runner detects architectural/refactoring intent and activates `software-design-advisor`.
2. **Holistic Guidance**: The advisor guides the agent across multiple classic disciplines:
   - Apply Michael Feathers' seam technique (*Working Effectively with Legacy Code*) to inject characterization tests before touching logic.
   - Separate refactoring from behavior changes (*Two Hats Principle* by Martin Fowler).
   - Consolidate fragmented classes into deep modules (*Philosophy of Software Design*), eliminating verbose pass-through wrappers.
   - Guard external input boundaries (*Code Complete*).
3. **Structured Output**: The agent delivers code cleanly partitioned into:
   - Engineering Tradeoffs & Rationale
   - Test-protected Implementation
   - Pre-Delivery Checklist Verification

---

## 📁 Repository Structure

```text
agent-advisors/
├── .github/                       # GitHub workflow and community configurations
├── skills/                        # Standard Skill Catalog Root
│   ├── software-design-advisor/   # Comprehensive Software Architecture Advisor
│   │   ├── SKILL.md               # Machine-executable advisor interface
│   │   └── references/            # Bundled deep reference repositories (14 classics)
│   └── advisor-creator/           # Meta-Advisor Synthesis Engine
│       ├── SKILL.md               # 5-step pipeline for synthesizing new advisors
│       └── references/            # Advisor scaffolding template
├── CONTRIBUTING.md                # Advisor engineering specification & guidelines
├── LICENSE                        # MIT License
├── README.md                      # International Documentation (English)
└── README_ZH.md                   # Chinese Documentation (简体中文)
```

---

## 🛠️ Creating Custom Advisors

If you have proprietary domain standards, security baselines, or internal architecture guidelines, use the included **`advisor-creator`** meta-skill to synthesize your own domain advisor:

```text
User: "Activate advisor-creator to help me consolidate our team's API guidelines and OWASP rules into an api-security-advisor."
```

The engine will guide you through domain mapping, trade-off analysis, nano-rule distillation, and progressive disclosure scaffolding.

---

## 🤝 Contributing

We welcome community contributions! Please read our **[Contribution Guidelines](CONTRIBUTING.md)** before opening a Pull Request.

Key requirements for all advisors:
- **Single Facade**: One technical domain, one comprehensive advisor.
- **Progressive Disclosure**: `SKILL.md` under 150 lines; place comprehensive treaties in `references/`.
- **Explain the Why**: Back engineering rules with causal rationales and explicit trade-offs.
- **Canonical English Execution**: `SKILL.md` must be written in high-precision, rationale-backed English for deterministic machine execution across all LLM backends.

---

## 📄 License

This repository is licensed under the [MIT License](LICENSE) © 2026 [cqzeng](https://github.com/cqzeng).
