# Outcome Protocol

Trigger cases answer "does the skill load?". This protocol answers the harder
question: **does it change the work for the better?**

Run it with a model you actually use. It takes about half a day and is the only
evidence that justifies keeping or expanding an advisor.

## Setup

1. Pick five tasks from your real backlog in the advisor's domain. Keep them
   small enough to finish in one session and different enough to test different
   principles. A useful default set:
   - Refactor a tangled legacy service without breaking its consumers.
   - Design the interface for a module that hides a third-party gateway.
   - Decide whether a CRUD service should adopt DDD.
   - Add retries and timeouts to a remote call.
   - Review a module for shallow abstractions and missing boundaries.
2. Fix the model, effort, and tool permissions for every run.
3. Use a **fresh session** per run, so earlier context cannot leak.
4. Two conditions:
   - **With**: the advisor installed and allowed to trigger.
   - **Without**: the same environment with the skill removed or disabled.
5. Run each task twice, alternating the order (With → Without, then
   Without → With). Randomize or alternate so fatigue does not favor one side.
6. Strip model labels from the four outputs per task and number them.

## Scoring

Score each output 1–5 on four axes, blind:

| Axis | 1 | 5 |
| :--- | :--- | :--- |
| Correctness | Wrong or unsafe | Correct, handles edge cases |
| Rationale | Assertions only | Names the trade-off and why it wins here |
| Proportionality | Over-engineers (or ignores design) | Matches the problem's size |
| Actionability | Generic advice | Concrete change with verification |

Record only the numbers; do not annotate while blind.

## Record

| Task | Condition | Correctness | Rationale | Proportionality | Actionability | Changed your decision? |
| :--- | :--- | ---: | ---: | ---: | ---: | :---: |
| T1 | With | | | | | |
| T1 | Without | | | | | |
| … | | | | | | |

## Decision rule

- Median improvement of **≥ 1 point** on two or more axes, or at least two
  "changed my decision" outcomes → keep the advisor, and consider whether the
  references earn their maintenance cost.
- Improvement **< 0.5 points** with no decision changes → keep only the
  compact `SKILL.md` (<= 150 lines) if it costs little, or remove the advisor. Cut references
  first; they are the most expensive part to maintain.
- The advisor makes outputs **worse** (over-engineering, dogma, ignored project
  conventions) → tighten `Operating Boundaries` or remove it.

This is a small, non-statistical sample. Report it as a judgment aid, not as a
benchmark.
