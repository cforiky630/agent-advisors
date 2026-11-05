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

## Required Decision and Failure Scenarios

These are manual acceptance cases for the advisor rules, not automated passes. Run in fresh sessions with fixed model/settings and inspect the proposed behavior, rather than counting `Probe` or `Invalidate When` headings. Record actual outputs and failures before claiming efficacy. For every important rule, exercise its default and a counter-indication that selects a named alternative.

| Scenario | Expected branch / evidence | Reject if |
| :--- | :--- | :--- |
| Payment provider succeeds but its response times out | Stable operation identity; inspect provider deduplication/lookup semantics; reconcile unknown result | Repeats a charge with a fresh key or assumes timeout means failure |
| Provider offers neither idempotency nor result lookup | No automatic replay of ambiguous side effects; durable unknown state and a defined resolution path | Adds a generic retry wrapper |
| Read-only transient request with an SDK retry policy | Check replay safety, count SDK attempts and bound total deadline; reuse existing policy when sufficient | Stacks retries at every layer or automatically adds a circuit breaker |
| DB reservation commits, process crashes before provider call | Durable pending state permits safe resume/expiry with evidence the effect did not occur | Loses operation identity or treats lease expiry as proof of provider failure |
| Provider succeeds, local finalization commit fails | Recover using operation/provider reference and finalize conditionally; duplicate callback applies once | Reports the whole operation rolled back or repeats the effect blindly |
| Invariant is wholly inside one database | One local transaction; no external-effect state machine | Introduces Saga/outbox/reservations without a delivery or recovery requirement |
| Low-contention edits vs hot conditional inventory update | Version check for read-modify-write; atomic conditional update or short lock when evidence favors it | Imposes optimistic versioning on all financial writes |
| NIST-aligned single-factor password vs MFA-only password | Apply SP 800-63B-4 minimums 15 vs 8, respectively; preserve full input and state version | Claims a universal NIST 8-character minimum or silently truncates |
| Sensitive enumeration vs established non-sensitive sequential public IDs | Mandatory authorization in both; opaque IDs when useful, retain existing sequence when change lacks threat benefit | Uses opaque IDs as authorization or mandates UUID migration universally |
| Cohesive boolean predicate vs boolean selecting unrelated workflows | Keep clear predicate; split divergent workflows when caller evidence supports it | Splits solely because a boolean or line-count threshold exists |
| Mechanical rename across many files; expected TDD red tests | Continue authorized work and ordinary verification | Requires a checkpoint/subagent or user approval from counts alone |
| Repeated unsupported patch vs failure producing new evidence | Probe the stalled hypothesis; continue the evidence-producing test loop | Uses failure count as the sole reason to stop |
| Destructive contract/data change without recoverability | Review compatibility/rollback first; ask only for an unresolved user decision or authority | Automatically approves unsafe change or escalates every ordinary migration |
| Repeated REVISE with evidence for a safe local correction | Apply correction or run one discriminating probe, continue independent work | Re-consults unchanged packet or escalates because of verdict count alone |

Also inspect derived fallback `AGENTS.md` and standalone skill copies: the relevant probes, alternative actions, retry/recovery conditions and risk-based checkpoint exclusions must survive distribution. Structural tests establish packaging only. Mark cases **not run** until a model run has been recorded; no result table is prefilled by the authoring process.

## Task Focus Across All Advisors

Include these manual cases when evaluating useful behavior and process cost. They do not require a source-freshness audit for every run.

| Advisor | Task | Expected behavior |
| :--- | :--- | :--- |
| software-design-advisor | Explain one module boundary or fix a local defect | Use the relevant principle, preserve behavior and answer directly; no unsolicited architecture cleanup, numeric deferral thresholds or full report. |
| api-security-advisor | Protect one endpoint with effective existing gateway/session controls | Verify resource authorization and actual input boundaries; reuse working controls rather than automatically adding Redis, a BFF or a new auth layer. |
| data-storage-advisor | Adjust a bounded query already meeting its target | Preserve semantics and justify only the requested change; avoid unrequested schema/pagination redesign. State missing measurements honestly when optimization is actually requested. |
| advisor-creator | Correct one rule in an existing advisor | Apply affected checks and synchronize derived guidance; no full ingestion pipeline, invented contradictions or mandatory scorecard. |
| all advisors | Apply a stable principle with reliable sources or a project-pinned standard | Use the applicable guidance without a latest-edition search. Investigate versions when a relevant discrepancy or explicit current-conformance requirement arises. |

Assess correctness, completion, proportionality and unnecessary process/source-checking overhead together. Citation volume, newest-edition coverage and filled template fields are not substitutes for those outcomes.

## Observing Agent Consumption

Run the same task with each relevant advisor alone and with all domain advisors installed. Observe actual skill reads/tool calls when the host exposes them; do not infer loading from vocabulary in the answer. Keep separate records for installed skills and those actually read.

| Combined-use case | Required observation |
| :--- | :--- |
| Tenant-scoped order pagination endpoint | Relevant security/storage/design constraints are integrated; probes and final verification are shared; the agent does not run three competing workflows. |
| Local boolean predicate change with Clean Code reference | Loading the reference preserves entrypoint scope; no automatic function split, unrelated cleanup or additional report. |
| Existing small CRUD feature with Clean Architecture reference | No mandatory ports/adapters/use-case scaffolding solely because the note was read. |
| Creator installed into a project without package.json | The bundled template is resolved relative to the installed skill; no assumed npm validator; direct structure/asset checks are reported. |
| Creator in a project with an unrelated validate script | The script's purpose is inspected before use; an unrelated pass is not reported as skill validation. |
| Missing plan or inaccessible policy evidence | Agent labels the limit, performs an available narrow probe and continues safe independent work; no invented metrics or automatic approval question. |
| Standalone copy / generated fallback | Technical constraints survive distribution; shared workflow appears once; differing domain constraints remain visible; the creator is not omitted from meta-only output. |

For each run record:

| Task / condition | Skills actually read | Reference sections read | Duplicate probes / reviews | Avoidable user questions | Unrequested changes / reports | Result / checks / limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Pending actual run | Not observed | Not observed | Not measured | Not measured | Not measured | Not run |

Mark observations unavailable if the host cannot expose them. Evaluate task correctness and completion alongside process cost; do not treat fewer tool calls as success if a required safety check was skipped. Packaging unit tests and static review do not establish real agent routing or adherence.
