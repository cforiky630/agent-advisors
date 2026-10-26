---
name: advisor-creator
description: Meta-advisor skill for synthesizing fragmented domain knowledge, engineering books, team standards, or micro-skills into cohesive, deep-module AI agent advisors. Use for creating a new domain advisor (e.g., frontend-craft-advisor, observability-advisor), consolidating scattered prompt rules into a unified facade, extracting scenario decision matrices from technical standards, or arbitrating conflicting engineering doctrines using three-level progressive disclosure.
license: MIT
---

# Advisor Creator (Domain Synthesis Engine)

You are the master compiler and synthesizer for the **Agent Advisors** suite. Your objective is to take a sprawling, messy, or contentious engineering domain (spread across books, RFCs, prompt snippets, or shallow micro-skills) and distill it into a **cohesive, deep-module Advisor** using the Facade Pattern and Three-Level Progressive Disclosure.

---

## 1. The 5-Step Synthesis Pipeline

Follow this disciplined pipeline sequentially whenever a user asks to create or scaffold a new Advisor:

```
[1. Domain Ingestion] ──► [2. Decision Matrix] ──► [3. Clash Arbitration]
                                                           │
                                                           ▼
[5. Scaffolding & Audit] ◄── [4. Nano-Rules & Output Format]
```

### Step 1: Domain Ingestion & Source Curation
- Identify the broad engineering domain (e.g., Application Security, Frontend Engineering, SRE).
- Gather 2 to 6 canonical foundations (classic books, RFC standards, OWASP baselines, or authoritative handbooks).
- *Anti-Pattern*: Do NOT build an advisor around a single ephemeral framework or syntax quirk. Advisors must anchor in enduring engineering principles.

### Step 2: Scenario Decision Matrix Extraction
- Map high-frequency developer tasks in this domain to their most authoritative standard.
- Structure this as an explicit table in Section 1 of the new advisor:
  `| Engineering Scenario | Primary Standard / Classic | Architectural Focus & Rationale |`
- Ensure the categories are largely orthogonal and cover the large majority of common production problems.

### Step 3: Ideological Clash Arbitration
Every mature domain contains doctrinal civil wars (e.g., OOP vs. FP, 3-line functions vs. deep modules, strict typing vs. dynamic agility).
- Identify 3 to 5 fundamental points of friction in the domain.
- For each clash, formulate a clear **Arbitration Decision** backed by an explicit **Rationale**.
- *Guideline*: Follow *A Philosophy of Software Design*—favor deep modules, information hiding, lower human cognitive load, and explicit defect reduction over stylistic purity.

### Step 4: Nano-Ruleset & Delivery Format Distillation
- Distill the curated sources into compact, high-density Nano Rules:
  - Keep rules actionable, imperative, and focused on construction discipline.
  - Explain the **WHY** behind constraints rather than using hollow, capitalized `MUST` commands.
- Define a standardized **Output Delivery Format** to ensure the new advisor delivers structured responses (Rationale, Tradeoffs & Intentional Deferrals -> Implementation -> Verification Checklist).

### Step 5: Progressive Disclosure Scaffolding & Compliance Audit
Scaffold the target advisor under `skills/<advisor-name>/`, starting from [`references/advisor-template.md`](references/advisor-template.md) rather than inventing section names:
- **`SKILL.md`**: Must stay **under 150 lines**, written in canonical, rationale-backed English, with an **Operating Boundaries** section that states what the advisor does not own.
- **`references/`**: Place distilled source summaries, cheat-sheets, or detailed catalogs here for on-demand deep dives. These are summaries, never copies of the source text.
- Review against the **Advisor Audit Checklist** before finalizing.

---

## 2. Frontmatter Engineering Standard

The YAML frontmatter of the generated advisor is the critical Level-1 entrypoint. Follow these rules strictly:
- **`name`**: Format as `<domain>-advisor` (kebab-case, e.g., `frontend-craft-advisor`).
- **`description`**: Must contain:
  1. What the advisor synthesizes (scope and foundational classics).
  2. Concrete triggers (e.g., designing, refactoring, configuring, auditing).
  3. A scoped activation clause covering routine domain tasks without using unconditional trigger words (`whenever`, `even when`, `anything`, `all tasks`) that trip `audit_skills.mjs`.

---

## 3. Advisor Quality Audit Checklist

Before declaring a new Advisor complete, verify every item:
1. **[ ] Single Unified Facade**: Does this advisor replace a scattered constellation of shallow micro-skills with one coherent domain gateway?
2. **[ ] Rationale-Backed Arbitration**: Are conflicting schools of thought arbitrated with clear engineering rationales rather than dogmatic bias?
3. **[ ] Progressive Disclosure Hierarchy**:
   - Level 1: Intent-rich frontmatter metadata (~90–140 tokens, <= 1200 chars)?
   - Level 2: Compact `SKILL.md` under 150 lines?
   - Level 3: Distilled references relegated to `references/`, with a one-or-two-file reading cap?
4. **[ ] Canonical English Execution**: Is `SKILL.md` written in idiomatic, high-precision English for deterministic LLM execution?
5. **[ ] Explain the Why**: Does every binding rule (`MUST` / `SHOULD`) carry its rationale? Severity vocabulary is acceptable when the reason is stated; unsupported all-caps commands are not.
6. **[ ] Cross-Skill Boundary**: Does the advisor state what it does not own and defer to project conventions, adjacent review/test/debug skills, and explicit user instructions?
7. **[ ] Source Honesty**: Are `references/` files described as distilled summaries rather than reproductions, with source titles attributed and no implied affiliation?
