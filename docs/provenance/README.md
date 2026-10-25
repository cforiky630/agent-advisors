# Advisor Provenance & Source Registry

This directory contains formal bibliographic attribution, source lineage, copyright notices, and publication details for every advisor in this repository.

## Design Principle

To keep AI skill installation directories as lightweight as possible:
1. **`skills/<advisor>/`** contains strictly AI runtime assets: `SKILL.md` (Level 1 & 2 directives) and `references/*.md` (Level 3 on-demand engineering notes).
2. **`docs/provenance/<advisor>.md`** mirrors each advisor's provenance for human reviewers, open-source compliance auditors, and contributors.

This physical separation ensures:
- **Zero runtime token waste**: AI agents loading the skill do not encounter or parse human bibliographic entries.
- **Zero symlink bloat**: When skills are symlinked to user environments (`~/.claude/skills/`, `.cursor/skills/`, etc.), only executable runtime assets are linked.

## Registry

- [`software-design-advisor.md`](software-design-advisor.md): 14 foundational classics & catalogs covering architecture, refactoring, legacy code, and resilience.
- [`advisor-creator.md`](advisor-creator.md): Meta-skill lineage (GoF Facade, Progressive Disclosure, Deep Modules).
