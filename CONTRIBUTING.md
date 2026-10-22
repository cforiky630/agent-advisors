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

### 3. Three-Level Progressive Disclosure
- **Level 1 (Metadata)**: Frontmatter `description` must be pushy and intent-rich (~30 words) to prevent undertriggering.
- **Level 2 (`SKILL.md`)**: The root file must remain compact (**under 150 lines**). Provide decision matrices, arbitration principles, nano-rulesets, and a delivery checklist.
- **Level 3 (`references/`)**: Put exhaustive treatises, pattern catalogs, or canonical texts into a private `references/` subfolder. The agent only reads these on deep, specialized tasks.

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
1. **YAML Frontmatter**: `name`, `description`, `license: MIT`.
2. **Introduction**: 1–2 sentences defining the advisor's scope and core directive.
3. **1. Scenario Decision Matrix**: Table mapping user scenarios to specific methodologies or classics.
4. **2. Engineering Trade-offs & Rationales**: Clear guidance on typical domain trade-offs with causal rationales.
5. **3. Condensed Nano Rulesets**: Bullet points of non-negotiable principles.
6. **4. Deep Knowledge Base Pointer**: Exact listing of what lives in `references/` and when to read them.
7. **5. Output Delivery Format & Checklist**: Required response structure and pre-delivery checklist.

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
5. **Local Validation**: Test the advisor in your local agent (e.g., Claude Code, Cursor, or Antigravity) to ensure:
   - It triggers on realistic user prompts without undertriggering.
   - It produces balanced, rationale-backed architectural decisions.
   - It reads `references/` only when deep pattern implementations are needed.
6. **Commit with conventional commits**:
   ```bash
   git commit -m "feat(skills): add frontend-craft-advisor with state machine and token matrix"
   ```
7. **Open a Pull Request** against `main` with a clear explanation of your design choices.

---

## Community & Code of Conduct

- Be respectful, constructive, and open to peer feedback.
- Focus discussions on software engineering rigor, trade-off rationale, and token efficiency.
