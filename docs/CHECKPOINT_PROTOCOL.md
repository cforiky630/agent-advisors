# Dual-Mode Advisor Architecture & Runtime Checkpoint Protocol

Agent ecosystems use the word **"Advisor"** for two fundamentally different mechanisms:

1. **Mode A — Static Domain Facade (Task-Start Routing)**: Loaded when a user prompt matches a domain (architecture, API security, data storage). Reduces engineering randomness with minimal context tax via Three-Level Progressive Disclosure.
2. **Mode B — Runtime Checkpoint Protocol (Mid-Session Escalation)**: Invoked at high-stakes decision points during long sessions (e.g., turn 80) to break context pollution, thrashing loops, and unexamined architectural pivots.

**Agent Advisors** supports both modes with **zero external dependencies or background daemons**.

---

## Why Static Facades Alone Are Not Enough

Loading `SKILL.md` at the beginning of a session solves **context cost**, not **mid-session context degradation**. By turn 80 of a debugging or refactoring session:
- Early instructions are diluted by compiler errors, stack traces, and failed attempts.
- **The Self-Referential Consultation Paradox**: A model that is already tunnel-visioned on a flawed tactical patch rarely realizes it "feels uncertain" enough to ask for help.

To solve this without an external orchestration server, Mode B replaces subjective self-reflection (*"consult when unsure"*) with **objective state predicates** and **context-stripped subagent isolation**.

---

## 1. Three Deterministic Checkpoint Triggers

Do not rely on subjective confidence to trigger a consultation. Pause execution and run a Checkpoint whenever any of these three objective conditions holds:

| Trigger ID | Objective State Predicate | Concrete Examples |
| :--- | :--- | :--- |
| **`CP-1: Irreversible Boundary`** | The change alters a persistent or external contract that is expensive to roll back. | Adding/altering a database migration, changing public API request/response schemas, modifying auth/session middleware, or changing cryptographic primitives. |
| **`CP-2: Thrashing Loop`** | $\ge 2$ consecutive failed attempts, test regressions, or edit-revert cycles on the same module. | Fixing a bug in `OrderService` breaks `PaymentTest`, and fixing `PaymentTest` re-breaks `OrderService`; or an index change fails to eliminate a full scan twice. |
| **`CP-3: Proportionality Jump`** | A proposed change steps up the Proportionality Ladder beyond flat local code. | Introducing a new abstraction layer, adding a third-party dependency, wrapping network I/O in a transaction, or touching $> 3$ files for one conceptual fix. |

---

## 2. The Context-Stripped Consultation Packet ($\le 200$ Tokens)

When `CP-1`, `CP-2`, or `CP-3` fires, **never forward the noisy conversation transcript**. Construct a fresh, self-contained **Consultation Packet** containing only four verifiable fields:

```markdown
### [ADVISOR CHECKPOINT PACKET]
- **Trigger**: CP-1 | CP-2 | CP-3 (<one-line reason>)
- **Target Advisor**: software-design-advisor | api-security-advisor | data-storage-advisor
- **Repo Probe Evidence**: <concrete facts inspected in the codebase: e.g., existing test seams, EXPLAIN row counts, active auth middleware, or failure diff>
- **Proposed Design**: <1-3 bullets describing the planned change and files touched>
- **Simpler Alternative Rejected**: <why a flatter standard-library or single-file fix was ruled out>
```

---

## 3. Execution Across Agent Runtimes

### Path 1: Isolated Subagent Consultation (Recommended)
When running in **Claude Code** (`Task` tool), **Cursor** (Subagents), **Antigravity / Gemini** (`invoke_subagent`), or **Codex**:
1. Spawn a **read-only subagent** with a clean context window.
2. Instruct the subagent to read **only** `skills/<target-advisor>/SKILL.md` (and at most 1 Level-3 file in `references/` if required by Section 1) plus the **Consultation Packet**.
3. The subagent evaluates the packet against the advisor's **Evidence-Gated Trade-offs** and **Falsifiability Bounds (`Invalidate When`)** and returns a structured verdict.

### Path 2: Inline Checkpoint Gate (Single-Agent Fallback)
When subagents are unavailable, emit the Consultation Packet and Verdict explicitly in the reasoning/output stream before applying file edits.

---

## 4. Verdict Contract & Anti-Loop Budget

Every checkpoint returns a deterministic verdict in under 150 tokens:

```markdown
### [CHECKPOINT VERDICT]
- **Verdict**: APPROVE | REVISE | ESCALATE_TO_USER
- **Violated Invariant / Counter-Indication**: <None, or the exact trade-off / Invalidate-When condition triggered>
- **Required Adjustment**: <Concrete structural change required before proceeding>
- **Deferral Threshold**: <What scale/threat metric must be reached before adopting the heavier pattern>
```

### Consultation Budget & Termination Rules
- **Maximum 2 Checkpoints per task.**
- If a design receives `REVISE` once, apply the adjustment and proceed.
- If the revised design triggers a second `REVISE` or `CP-2` persists after the adjustment, immediately emit `ESCALATE_TO_USER` with the two competing trade-offs and stop mutating files. Never enter an unbounded advisor-worker loop.
