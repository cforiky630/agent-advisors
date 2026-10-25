# 🏛️ Agent Advisors

<p align="center">
  <strong>One opinionated advisor per engineering domain — plus the tooling to audit and extend your agent's skill set.</strong><br>
  Less prompt clutter, fewer overlapping skills, more consistent engineering decisions.
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

## What is this?

Agent Advisors is a collection of **skills** for AI coding agents, plus small tools for managing them.

A skill is a folder with a `SKILL.md` file. The agent always sees the skill's name and description; it reads the body only when the task matches. That makes a skill a cheap way to give an agent a stable point of view without loading a wall of instructions on every turn.

This repository ships three skills and three tools:

| Piece | What it is | What it is for |
| :--- | :--- | :--- |
| [`software-design-advisor`](skills/software-design-advisor/) | One skill + 14 distilled reference notes | Consistent decisions on design, refactoring, legacy code, architecture, DDD, and resilience |
| [`api-security-advisor`](skills/api-security-advisor/) | One skill + 4 distilled security baselines | Defend against BOLA/IDOR, SSRF, injection, and cryptographic/token vulnerabilities |
| [`advisor-creator`](skills/advisor-creator/) | A meta-skill | Turn your team's scattered standards into a new advisor |
| [`audit_skills.mjs`](scripts/audit_skills.mjs) | A read-only command-line tool | See what is installed, what it costs per turn, and which skills compete for the same tasks |
| [`import_repo.mjs`](scripts/import_repo.mjs) | A quarantine importer | Evaluate skills from another repository without installing them |
| [`validate_skills.mjs`](scripts/validate_skills.mjs) | A structural checker | Keep skills well-formed; CI runs it too |

**You can use the advisor without any of the tooling.** The tools are for people who already have many skills installed, or who want to adopt skills from elsewhere without losing control of their agent.

---

## Quick start (60 seconds)

### 1. Install the advisor (Claude Code)

```bash
# macOS / Linux
mkdir -p ~/.claude/skills
ln -s "$(pwd)/skills/software-design-advisor" ~/.claude/skills/software-design-advisor
```

```powershell
# Windows (PowerShell, run as Administrator)
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\skills\software-design-advisor" -Target (Resolve-Path "skills\software-design-advisor")
```

Other agents are covered in [Installation](#installation).

### 2. Ask something it is meant for

```
Help me refactor this legacy order service. The logic is tangled, and I cannot break existing consumers.
```

```
Design the interface for a payment module; callers should not care which gateway is used.
```

```
Should this CRUD service adopt full DDD?
```

There is nothing to configure. If the skill matches the task, the agent loads it, applies the relevant principles, and returns a short rationale with the code.

### 3. Optional: see what else is installed

```bash
node scripts/audit_skills.mjs
```

It writes a report to `.advisor-audit/audit-report.md`. Use it when you have accumulated many skills and want to know which ones overlap or cost the most context.

---

## What an advisor actually gives you

It is not extra knowledge; models already know the books. It is a **stable default stance**, so answers do not drift between "split everything into tiny functions" and "keep deep modules" from one session to the next.

For example, when asked to untangle a legacy service, the advisor pushes the agent toward:

1. Find seams and add characterization tests before changing behavior.
2. Separate refactoring from behavior changes (Fowler's Two Hats).
3. Collapse pass-through wrappers into deeper modules.
4. Validate input at the boundary, not in the domain core.

It also states where it defers: project conventions, tests, and explicit user instructions win; a dedicated review/test/debug skill owns its workflow. See [SKILL.md](skills/software-design-advisor/SKILL.md).

---

## How it works: three levels

```
Level 1  name + description        always in context, ~120–140 tokens
   │
   ▼  task matches
Level 2  SKILL.md                  loaded on demand, ~100 lines
   │
   ▼  needs pattern-level detail
Level 3  references/*.md           read one or two at a time, never preloaded
```

- **Level 1** is the only fixed cost. It is what lets the agent decide whether to load the skill.
- **Level 2** contains the decision matrix, the trade-off arbitrations, and the delivery checklist. Most tasks end here.
- **Level 3** holds the distilled notes. They are summaries, not the original books, and the skill explicitly tells the agent to read at most one or two per task.

The point is not "more documentation". The point is that an agent can carry a coherent engineering stance without paying for it on every turn.

---

## Installation

### Claude Code

```bash
mkdir -p ~/.claude/skills
ln -s "$(pwd)/skills/software-design-advisor" ~/.claude/skills/software-design-advisor
```

On Windows, use the PowerShell command in the quick start.

### Cursor

Place or symlink the advisor into your project's `.cursor/skills/`:

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

### Manage several agents with cc-switch

If you switch between Claude Code, Codex, Antigravity, and OpenCode, [cc-switch](https://github.com/farion1231/cc-switch) can keep one central copy and distribute it:

```powershell
Copy-Item -Recurse "skills\software-design-advisor" "$HOME\.cc-switch\skills\"
```

Then enable the advisor in the cc-switch interface. Updating the central copy updates every agent that links to it.

---

## Auditing installed skills

A skill cannot see the rest of your install set. The audit tool can:

```bash
node scripts/audit_skills.mjs
```

It reports:

- **What is loaded**, per runtime (Claude Code, Codex, Gemini, Cursor).
- **The fixed cost**: how many description tokens are paid every turn.
- **Structural problems**: missing frontmatter, broken references, name collisions.
- **Overlap candidates**: pairs of skills whose descriptions claim similar triggers.
- **Broad trigger wording**: descriptions that say "whenever" or "anything", a common cause of over-triggering.

Outputs go to `.advisor-audit/`:

- `audit-report.md` — the readable report.
- `skills.lock.json` — an inventory with content hashes, so install changes can be diffed.

A high overlap score means "read these two", not "they conflict". The audit never edits, removes, or installs anything. Method and limits: [docs/AUDIT.md](docs/AUDIT.md).

---

## Importing skills from another repository

```bash
node scripts/import_repo.mjs https://github.com/owner/skills --ref main
```

The importer:

1. Clones the repository into a temporary quarantine directory.
2. Finds `SKILL.md`, `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules/*.mdc`.
3. Records provenance: URL, commit SHA, subdirectory, license, content hashes.
4. Compares candidates with your audit inventory.
5. Writes `.advisor-import/<repo>/proposal.md` with a recommended action for each candidate.

It **never installs anything, never writes into a skill root, and never runs repository code**. Executable files are listed but not copied. Non-permissive or unknown licenses are marked `reference only`.

To adopt a candidate, review the proposal, merge what you want with `advisor-creator`, then install it deliberately.

---

## Creating your own advisor

If you have team-specific standards — API conventions, security baselines, incident rules — `advisor-creator` turns them into a skill:

```
Activate advisor-creator to consolidate our API guidelines and OWASP rules into an api-security-advisor.
```

It walks through domain mapping, conflict arbitration, condensed rules, and scaffolding. The result follows the same structure as `software-design-advisor`, so the audit, validator, and tests work on it too.

---

## Repository structure

```text
agent-advisors/
├── .github/workflows/          # CI: structural validation + tests
├── docs/                       # Audit method and import security model
├── evals/                      # Trigger cases and blind outcome protocol
├── scripts/
│   ├── lib/skill.mjs           # Shared parsing and comparison
│   ├── audit_skills.mjs        # Read-only inventory and overlap report
│   ├── import_repo.mjs         # Quarantine clone and proposal
│   └── validate_skills.mjs     # Structural checks for this repository
├── tests/                      # node --test suites
├── skills/
│   ├── software-design-advisor/
│   │   ├── SKILL.md
│   │   └── references/         # 14 distilled engineering references
│   ├── api-security-advisor/
│   │   ├── SKILL.md
│   │   └── references/         # 4 distilled security baselines
│   └── advisor-creator/
│       ├── SKILL.md
│       └── references/         # Advisor template
├── CONTRIBUTING.md
├── LICENSE
├── package.json                # Scripts only; no dependencies
└── README.md / README_ZH.md
```

---

## FAQ and limits

**Does this make the model know more?**
No. Models already know the source material. The advisor changes the default decisions and keeps them consistent. Its value is judgment, not facts.

**Does it guarantee the skill will trigger?**
No. Skill selection is model-driven. [`evals/trigger-cases.md`](evals/trigger-cases.md) lists cases that should trigger, should stay dormant, and should defer to another workflow.

**Does the audit detect contradictory advice?**
No. It detects structural problems and trigger overlap. Whether two skills actually disagree requires reading them or an LLM arbitration pass. See [docs/AUDIT.md](docs/AUDIT.md).

**Are the references the original books?**
No. They are independently written summaries. Titles and authors belong to their owners; this project is not affiliated with them.

**Does the audit work for every agent?**
Budgets are computed per runtime. Overlap analysis covers Claude Code by default (`--agents all` for every runtime). Plugin discovery currently targets Claude Code's `installed_plugins.json`.

**Will the tooling uninstall or rewrite my skills?**
No. Audit and import are read-only with respect to installed skills. Removal and merging are decisions you make.

---

## Development

Requires Node.js 20+ and nothing else.

```bash
node scripts/validate_skills.mjs
```

```bash
node --test
```

```bash
node scripts/audit_skills.mjs
```

```bash
node scripts/import_repo.mjs <git-url>
```

---

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR. The key rules:

- One domain, one advisor.
- `SKILL.md` under 150 lines; distilled summaries in `references/`.
- State the rationale, the trade-offs, and what the advisor defers to.
- Run the validator and tests; CI repeats both.

---

## License

MIT. See [LICENSE](LICENSE).

### Attribution

Files under `skills/*/references/` are independently written distillations of published books and catalogs. Book titles, authors, and catalog names belong to their respective owners; this project is not affiliated with or endorsed by them, and the summaries are not substitutes for the original works.
