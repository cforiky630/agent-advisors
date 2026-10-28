# Skill Audit & Import: Method and Limits

This document explains what `scripts/audit_skills.mjs` and `scripts/import_repo.mjs`
actually measure, and what they deliberately refuse to decide.

## Why an inventory comes first

A single advisor can make one domain coherent. It cannot know what else is
installed, which descriptions are competing for the same prompts, or how much
context the whole set costs every turn. Those are properties of the **install
set**, not of any one skill. The audit makes the install set visible and
diffable; only then can pruning or merging be a deliberate decision.

## Discovery model

| Root | Runtime | Counted in budget |
| :--- | :--- | :---: |
| `<cwd>/.claude/skills` | Claude Code (project) | yes |
| `~/.claude/skills` | Claude Code (user) | yes |
| Installed plugins from `~/.claude/plugins/installed_plugins.json` | Claude Code | yes |
| `<cwd>/.cursor/skills` | Cursor | yes, separate budget |
| `~/.codex/skills` | Codex | yes, separate budget |
| `~/.gemini/skills` | Gemini / Antigravity | yes, separate budget |
| `~/.cc-switch/skills` | distribution store | no |

Rules:

- **Marketplace checkouts are not installed skills.** Only `installPath` entries
  in `installed_plugins.json` are scanned.
- **Symlinks and identical copies are deduplicated.** Within a runtime, symlinks
  collapse by real path. Across roots, unique skills are deduplicated by
  `(name, contentHash)` so physical copies (e.g. `cc-switch` to `claude`/`codex`)
  are counted as one logical skill with multiple installed instances, and
  cross-root content drift is flagged as a warning.
- **Budgets are per runtime.** Claude Code, Codex, and Gemini load different
  sets; summing them would overstate what any one agent pays.
- A missing root is reported as skipped, not as an error.

## What is checked

| Check | Level | Why |
| :--- | :--- | :--- |
| Unreadable or missing frontmatter, missing description | error | The loader cannot route it. |
| Broken symlink in a skill root | error | The install point resolves to a missing target. |
| Same name resolving to different content across scopes within one runtime | error | Which copy wins is ambiguous and behavior differs. |
| Identical copies of the same skill name across scopes within one runtime | warn | Redundant install; check which scope the loader prefers. |
| Same name resolving to different `contentHash` across runtimes or stores | warn | Cross-root content drift between installed copies. |
| Same name in a plugin and another scope | warn | Plugin skills are namespaced; check semantic overlap. |
| Missing relative asset across `references/`, `agents/`, `scripts/`, `assets/`, `eval-viewer/`, `templates/`, `examples/`, and `resources/` | warn | The skill points at content or scripts it does not ship. |
| Line count, description length, executable files | info | Authoring preferences or review flags, not correctness. |
| Broad trigger wording (`whenever`, `anything`, `any task`) | info | A common cause of over-triggering. |

The repository's own validator applies stricter rules to `skills/`; installed
third-party skills are only held to correctness here.

## Trigger overlap score & Positive/Negative Ontology

The score uses **descriptions only**, because that is what competes at load time, but explicitly separates **positive trigger clauses** from **negative anti-trigger / deferral clauses** (`splitTriggerSurface`):

- **Positive vs. Negative Surface Separation**: Clauses starting with `Do not trigger for...`, `Don't use for...`, `Never use for...`, `Skip when...`, or `Defer to...` (and Chinese equivalents `不要用于`/`不适用于`) are parsed into `negativeTerms` and `negativeTags` rather than polluting positive `terms` and `tags`. Writing explicit anti-triggers never inflates overlap with the excluded domain.
- **0.6 × Dice coefficient** over bilingual normalized positive description terms (Latin term stemming + CJK character bigrams, stopwords removed).
- **0.4 × Jaccard coefficient** over bilingual positive domain tags, with lexical-support damping when shared terms < 2 or term Dice < 0.18 to prevent single-tag false positives.
- **Orthogonality Discount**: When Skill A's `negativeTerms`/`negativeTags` explicitly exclude Skill B's positive trigger surface (or vice versa), the raw overlap score is discounted by up to 55% (`excludedTerms` / `excludedTags`), rewarding authors who declare clean domain boundaries.
- **Counterfactual Trigger Corpus Validation**: For this repository's own advisors, `scripts/validate_skills.mjs` also evaluates all 57 prompt cases in `evals/*-trigger-cases.md` (`Should activate`, `Should stay dormant`, `Should defer`) via `evaluateTriggerCorpus` to ensure positive prompts activate their owner advisor while dormant prompts remain below the activation ceiling.
- Pairs with the same name are excluded (they are already reported as collisions).
- Default threshold: 0.4; override with `--threshold`.
- Overlap analysis defaults to Claude Code; pass `--agents all` to compare every runtime.

This is a **candidate generator**, not a verdict. Two skills can score high and
still complement each other (a pipeline of writing stages), or score low and
still give contradictory advice. The score only decides what is worth reading.

Embeddings were deliberately not used: they hide why a pair matched, require
infrastructure, and are no better than reading the top candidates.

## Three kinds of conflict

| Layer | Example | Covered by the audit |
| :--- | :--- | :--- |
| Install | Same name in project and user scope; broken symlink; invalid frontmatter | Yes, deterministically |
| Trigger | Three skills all claim "review code" | Candidates only; needs review |
| Doctrine | "Keep functions short" vs "do not split into micro-functions" | No. Requires reading both bodies or an LLM arbitration pass |

Do not describe the audit as detecting doctrinal conflicts. It does not.

## Reading the report

1. Check **problems** first; a missing reference or name collision is actionable.
2. Look at the **budget**. Descriptions are paid every turn, even when dormant.
3. Take the top overlap pairs. For each, open both `SKILL.md` files and ask:
   do they compete for the same prompt, and do they disagree?
4. Decide **keep / merge / remove**. Merging belongs to `advisor-creator`; the
   audit never edits or uninstalls anything.
5. Re-run and commit `skills.lock.json` if you want an install-set history.

The report and lockfile contain absolute local paths, which is why both default
to `.advisor-audit/` and are gitignored.

## Import security model

`import_repo.mjs` treats every repository as untrusted data:

- Clones into an OS temp directory; deletes it unless `--keep-clone`.
- Never writes into a skill root; output lives under `.advisor-import/`.
- Never runs repository code, hooks, or build steps.
- Skips symlinks during discovery so a repository cannot point outside its clone.
- Copies only markdown candidates; executable files are recorded, not copied.
- Records provenance: URL, commit SHA, subdir, fetch time, license, content hash.
- License gate: non-permissive or unknown licenses are marked `reference only`.

What it cannot protect against: a malicious instruction written inside a copied
markdown file. Treat candidate text as data, review it, and only then install it.

## Known limits

- Descriptions vary in quality; a poorly written description hides a skill's real
  triggers, and the score inherits that noise.
- Runtimes may truncate or reformat descriptions; the budget is an estimate.
- The audit does not measure whether a skill improves outcomes. Use
  [`evals/outcome-protocol.md`](../evals/outcome-protocol.md) for that.
- Plugin support currently targets Claude Code's registry format.
