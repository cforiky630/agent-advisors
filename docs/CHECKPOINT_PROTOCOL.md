# Risk-Based Advisor Checkpoint Protocol

Advisors supply task-start domain guidance and optional independent review at material decision boundaries. This is an instruction-level protocol followed by the host agent; no hook or daemon enforces it. Each skill embeds the minimum procedure for standalone distribution.

## 1. Triggers and Non-Triggers

| Trigger | Review when | Insufficient on its own |
| :--- | :--- | :--- |
| **CP-1: Costly reversal** | A proposed change breaks an external contract, risks persistent data loss, or changes a material security guarantee without a verified rollback/compatibility plan. | Editing a migration file, changing an internal signature, or touching an auth test without altering its guarantee. |
| **CP-2: Stalled reasoning** | Attempts repeat without new evidence or measurable progress; another patch would repeat the same unsupported hypothesis. | Two failures, an expected TDD red test, or a failure that produced useful new diagnostic evidence. |
| **CP-3: New failure boundary** | The design introduces a new trust, consistency or operational failure boundary whose invariants and recovery are not yet checked. | More than three files, mechanical renames, or adding a local helper/module. |

Use the lightest useful review. First inspect evidence and the simpler alternative. Routine reversible edits continue under existing tests and project conventions; do not require a separate ceremony for every trigger hint.

## 2. Decision Packet

For a qualifying risk, write a brief self-contained packet:

```markdown
- Trigger: CP-1 | CP-2 | CP-3, with the concrete risk
- Target advisor: relevant domain
- Repo probe evidence: inspected artifacts and observations; explicitly mark unknowns
- Proposed design: action, invariant, reversibility and recovery
- Simpler alternative rejected: the evidence that rules it out
```

Exclude conversation history. Preserve material evidence instead of enforcing a token ceiling that would hide a safety condition. A reviewer may request a specific missing artifact rather than infer unsupported facts.

## 3. Execution

Default to an inline self-review. Use a fresh read-only subagent only when available, authorized and useful for an independent decision. Give it the packet, relevant advisor and narrowly scoped references/evidence. Do not spawn one merely because several files changed. A self-review cannot claim independent context isolation.

## 4. Verdict and Follow-Through

```markdown
- Verdict: APPROVE | REVISE | ESCALATE_TO_USER
- Invariant / counter-indication: the evidence selecting the branch
- Adjustment and verification: concrete action and the check that will resolve uncertainty
- Deferral threshold: evidence that would justify a heavier alternative
```

- APPROVE permits only the scoped proposal; it is not a global correctness guarantee.
- REVISE means apply the adjustment and continue within the user's existing authorization. A repeated REVISE does not automatically require the user.
- Do not repeat consultation on unchanged evidence. Use a discriminating probe or a reversible alternative instead of an advisor loop.
- ESCALATE_TO_USER is reserved for a missing user policy decision, authority, or material uncertainty that cannot be resolved safely from available evidence. State the concrete decision needed; stop only the affected action and continue independent work.
- There is no task-wide two-checkpoint limit: distinct material risks need distinct evidence. Re-consult only for a changed proposal, new risk or new evidence.

## 5. Behavioral Review Cases

Expected decisions: a multi-file mechanical rename continues locally; expected test-first failures continue the testing loop; a repeated unsupported patch triggers a diagnostic probe; a destructive migration without recovery gets a rollback/compatibility review; an external payment retry requires idempotency and crash-recovery evidence. File-count thresholds and verdict counts alone never decide these cases.

These are protocol expectations, not measured model outcomes. Use the manual outcome protocol to evaluate actual adherence and overhead.

## Combining Advisors and References

Use the primary decision to select a leading perspective, then apply relevant constraints from other matched advisors. Reuse probe evidence, review each material risk once and combine verification/output. If advice differs, select the branch using the concrete invariant and applicable project policy; do not run competing advisor workflows.

Entrypoints govern task scope and delivery. Reference notes add technical detail under those rules; a reference checklist does not authorize unrelated cleanup, a fresh report or additional architecture layers. Installed skills keep the protocol self-contained; generated fallback rules factor identical blocks once and retain any advisor-specific differences.
