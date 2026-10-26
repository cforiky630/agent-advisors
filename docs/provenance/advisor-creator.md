# Sources & Provenance: Advisor Creator

This document records the design lineage, structural methodology, and references for the `advisor-creator` meta-skill.

> **Audience**: Humans, open-source auditors, and maintainers.  
> **Runtime Note**: This file is intentionally omitted from `SKILL.md` routing so that AI agents do not consume context tokens loading it during routine task execution.

---

## Architectural & Methodological Lineage

`advisor-creator` synthesizes principles from established software engineering and AI agent architecture patterns:

1. **The Facade Pattern (GoF Design Patterns)**:
   - *Lineage*: Gamma, Helm, Johnson, Vlissides (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley.
   - *Application*: Replaces a scattered constellation of shallow prompt rules or micro-skills with a single unified, domain-level entrypoint.
2. **Three-Level Progressive Disclosure**:
   - *Lineage*: Human-Computer Interaction (HCI) information architecture pattern adapted for LLM context optimization.
   - *Structure*:
     - Level 1: Frontmatter metadata (~90–140 tokens persistent per turn).
     - Level 2: Core directive `SKILL.md` (≤ 150 lines, loaded only on intent match).
     - Level 3: Distilled references (`references/*.md`, strictly 1–2 files read on demand).
3. **Deep Modules & Information Hiding**:
   - *Lineage*: John Ousterhout (2018/2021). *A Philosophy of Software Design*. Yaknyam Press.
   - *Application*: Ensuring every generated advisor presents a minimal, high-abstraction interface while encapsulating deep operational and architectural rationale.
4. **Agent Skill Specification & Frontmatter Standard**:
   - *Lineage*: Open agent skill standard (Anthropic Claude Code skills, Cursor rules/skills specification).
