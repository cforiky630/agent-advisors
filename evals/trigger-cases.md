# Trigger Cases

Manual evaluation set for `software-design-advisor`. Run each prompt in a **fresh
session** with only this skill installed, then repeat with the skill removed and
compare. A case "triggers" when the `SKILL.md` body enters context — not when the
answer merely mentions architecture.

CI checks structure only; these cases check behavior. For whether the advisor
improves the work rather than merely loading, use
[`outcome-protocol.md`](outcome-protocol.md).

## Should activate

| # | Prompt | Expected behavior |
| :--- | :--- | :--- |
| 1 | "Help me refactor this legacy order service. The logic is tangled and I can't break existing consumers." | Seams + characterization tests before edits; refactoring separated from behavior change. |
| 2 | "Design the interface for a payment module; callers shouldn't care which gateway is used." | Deep module, narrow interface, hidden gateway details. |
| 3 | "Our domain model is anemic and business rules are leaking into service classes." | DDD tactical guidance; invariants back into entities/value objects. |
| 4 | "Is this abstraction too shallow? Review the module boundary." | Interface depth analysis, pass-through elimination. |
| 5 | "Should this CRUD service adopt full DDD?" | Proportionality: no aggregates or event sourcing without real invariants. |
| 6 | "We're adding retries and timeouts to a remote billing call. What failure modes matter?" | Timeouts, circuit breaking, degradation; maps to DDIA/Release It!. |
| 7 | "帮我把这个 3000 行的订单类重构一下，目前没有测试。" | Activation across languages; test-first safety net before restructuring. |
| 8 | "Review this module: naming, error handling, and whether the seams are in the right place." | Design review with rationale, not a style checklist. |

## Should stay dormant

| # | Prompt | Why not |
| :--- | :--- | :--- |
| 1 | "Fix this TypeScript error: Type 'string' is not assignable to type 'number'." | Compiler fix; no design decision. |
| 2 | "Write a migration to add an index on orders.customer_id." | Mechanical change. |
| 3 | "Why is this Jest test flaky?" | Debugging workflow. |
| 4 | "Run the test suite and paste the output." | No reasoning requested. |
| 5 | "Convert this JSON to YAML." | Format conversion. |
| 6 | "Set up a GitHub Actions workflow for this repo." | Tooling setup. |
| 7 | "Explain this Kubernetes CrashLoopBackOff." | Operational troubleshooting. |
| 8 | "这个报错是什么意思？" (with a stack trace) | Error explanation. |

## Should defer, not take over

| # | Prompt | Expected behavior |
| :--- | :--- | :--- |
| 1 | "Use the repo's code-review checklist on my branch." | The review workflow owns the steps; the advisor supplies design reasoning only where relevant. |
| 2 | "Write the tests first, then implement." | The TDD skill owns the loop; the advisor may point out which seams need tests. |
| 3 | "Follow our team's API style guide, and tell me if this module is too shallow." | Style guide wins; depth feedback is still in scope. |

## Recording results

| Case | With skill | Without skill | Verdict |
| :--- | :--- | :--- | :--- |
| e.g. activate #1 | triggered, cited seams | generic advice | improved |

An advisor that changes no verdict is not earning its context cost; an advisor
that activates on the dormant cases is over-triggering and needs a narrower
description.
