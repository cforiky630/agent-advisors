# Contributing to Agent Advisors

Thank you for your interest in contributing to **Agent Advisors**! 

This project aims to replace shallow, unarbitrated prompt clutter with **cohesive, deep-module AI agent advisors**. To maintain the highest architectural and engineering quality, all advisors must adhere to our strict design standards.

---

## The Advisor Design Charter

Before submitting a Pull Request for a new Advisor (e.g., an API standards advisor or a domain-specific architecture advisor), ensure your proposal fulfills our four core tenets:

### 1. The Facade Pattern (Single Unified Advisor)
- **Do NOT** fragment a domain into dozens of micro-skills.
- **DO** consolidate the entire problem space into one cohesive Advisor with a comprehensive **Scenario Decision Matrix**.

### 2. Engineering Trade-off & Synthesis Guidelines
- Complex engineering domains involve legitimate technical trade-offs (e.g., simple CRUD vs. full DDD, micro-functions vs. deep modules, strict typing vs. dynamic flexibility).
- An Advisor must provide clear, rationale-backed decisions and boundary guidelines so the agent never wavers ambiguously across turns.
- An Advisor must state what it does **not** own: project conventions, adjacent review/test/debug skills, and explicit user instructions take precedence.

### 3. Three-Level Progressive Disclosure
- **Level 1 (Metadata)**: Frontmatter `description` must be pushy and intent-rich (~60–90 words / ~90–140 tokens, strictly <= 1200 chars) to prevent undertriggering.
- **Level 2 (`SKILL.md`)**: The root file must remain compact (**under 150 lines**). Provide operating boundaries, decision matrices, arbitration principles, nano-rulesets, and a delivery checklist.
- **Level 3 (`references/`)**: Put distilled source summaries, pattern catalogs, and cheat-sheets into a private `references/` subfolder. They must be your own condensation rather than reproductions, and the agent reads at most one or two per task.

### 4. Canonical English Execution
- Machine-executable `SKILL.md` files must be written in **precise, idiomatic English**. English ensures optimal parameter activation across major LLM foundation models (Claude, GPT, Gemini) and minimizes token consumption.

---

## Directory Layout for New Advisors

When adding a new advisor under `skills/<advisor-name>/`:

```text
skills/<advisor-name>/
├── SKILL.md             # Required: Entrypoint containing YAML frontmatter, matrix, arbitration, and nano-rules
└── references/          # Required (if comprehensive texts exist): Deep reference files loaded on-demand
    ├── topic-a.md
    └── topic-b.md
```

### Required `SKILL.md` Structure
Every `SKILL.md` must follow this standard format:
1. **YAML Frontmatter**: `name`, `description` (including an explicit `Do not trigger for...` anti-trigger boundary), `license: MIT`.
2. **Introduction & Operating Boundaries**: Defines scope across **Static Facade Mode** and **Runtime Checkpoint Mode** (`CP-1`/`CP-2`/`CP-3`; see [`docs/CHECKPOINT_PROTOCOL.md`](docs/CHECKPOINT_PROTOCOL.md)), plus what it defers to (project conventions, adjacent skills, explicit user instructions).
3. **1. Scenario Decision Matrix**: Unified table mapping scenarios to primary standards, architectural focus, and on-demand `references/<file>.md` targets.
4. **2. Engineering Trade-offs & Rationales**: Evidence-gated rules where each trade-off specifies **`Probe`** (codebase evidence to inspect first), **`Arbitration`** (default choice and causal rationale), and **`Invalidate When`** (counter-indications where the default fails).
5. **3. Condensed Nano Rulesets**: Actionable principles grouped under `### A.` to `### D.`.
6. **4. Deep Knowledge Base (`references/`)**: Enforces the 1–2 file on-demand reading cap and epistemic humility (codebase evidence outranks book defaults).
7. **5. Output Delivery Format & Checklist**: Required response structure and pre-delivery verification checklist.

---

## Development Workflow

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/agent-advisors.git
   cd agent-advisors
   ```
3. **Create a topic branch**:
   ```bash
   git checkout -b feat/add-frontend-craft-advisor
   ```
4. **Draft your advisor**: You can use our built-in `advisor-creator` meta-skill to scaffold and arbitrate the new advisor automatically! Simply prompt your agent: *"Activate advisor-creator to scaffold a new advisor for <your domain> based on <your sources>"*.
5. **Local Validation**: Test the advisor in your local agent (e.g., Claude Code, Cursor, or Antigravity) against at least the cases in [`evals/trigger-cases.md`](evals/trigger-cases.md), and confirm:
   - It triggers on realistic user prompts without undertriggering.
   - It produces balanced, rationale-backed architectural decisions.
   - It reads `references/` only when deep pattern implementations are needed.
6. **Run the structural validator and tests**:
   ```bash
   node scripts/validate_skills.mjs
   node --test
   ```
   The validator checks frontmatter, the 150-line limit, required sections, unresolved reference links, and prohibited patterns. CI runs both commands on every push and pull request.
7. **Commit with conventional commits**:
   ```bash
   git commit -m "feat(skills): add frontend-craft-advisor with state machine and token matrix"
   ```
8. **Open a Pull Request** against `main` with a clear explanation of your design choices.

---

## Repository Tooling

| Command | Purpose |
| :--- | :--- |
| `node scripts/validate_skills.mjs` | Structure and link validation for this repository |
| `node --test` | Tooling tests |
| `node scripts/link_skills.mjs` | Cross-platform skill linker and optional `AGENTS.md` compiler |
| `node scripts/audit_skills.mjs` | Read-only inventory of installed skills and overlap candidates |
| `node scripts/import_repo.mjs <url>` | Quarantine clone and import proposal |

The audit and importer are read-only with respect to installed skills: they never install, remove, or rewrite one. See [docs/AUDIT.md](docs/AUDIT.md) for the method, the three kinds of conflict, and the security model.

---

## Community & Code of Conduct

- Be respectful, constructive, and open to peer feedback.
- Focus discussions on software engineering rigor, trade-off rationale, and token efficiency.
