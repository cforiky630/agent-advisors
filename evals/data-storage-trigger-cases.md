# Trigger Cases: Data Storage Advisor

Manual evaluation set for `data-storage-advisor`. Run each prompt in a **fresh session** with only this skill installed, then repeat with the skill removed and compare. A case "triggers" when the `SKILL.md` body enters context — not when the answer merely mentions databases.

CI checks structure only; these cases check behavior. For whether the advisor improves the work rather than merely loading, use [`outcome-protocol.md`](outcome-protocol.md).

---

## Should activate

| # | Prompt | Expected behavior |
| :--- | :--- | :--- |
| 1 | "This query with `LIMIT 20 OFFSET 200000` is timing out on our orders table. How do I fix it?" | Replaces offset with keyset seek pagination using cursor tuples and B-Tree indexing. |
| 2 | "We have a composite index on (tenant_id, created_at, status). Why is the status filter slow?" | Explains range barrier in B-Tree left-prefix rule; recommends reordering to `(tenant_id, status, created_at)`. |
| 3 | "I'm storing user tags as a comma-separated string `react,node,css` in a single column. Is this okay?" | Diagnoses Jaywalking antipattern; guides normalization into an intersection/junction table. |
| 4 | "We're wrapping a Stripe payment API call inside a database transaction to keep it atomic. Review this." | Flags catastrophic connection exhaustion cascade; enforces Three-Phase Pattern (zero network I/O in DB tx). |
| 5 | "Adding `deleted_at` to our users table broke our unique constraint on email. How should we handle soft deletes?" | Proposes partial/conditional unique index (`WHERE deleted_at IS NULL`) to protect active uniqueness. |
| 6 | "How do I prevent double-spending or stock overselling under high concurrency in SQL?" | Implements optimistic concurrency control (version column) or short pessimistic `SELECT ... FOR UPDATE`. |
| 7 | "We're getting frequent MySQL deadlocks when running concurrent batch transfer updates." | Diagnoses circular lock waits; enforces consistent lock ordering (sorting entity IDs in ascending order). |
| 8 | "Why is my ORM making 200 database queries to render a list of 200 orders with their customer names?" | Diagnoses N+1 query problem; refactors to eager join, batch `IN (...)`, or DataLoader pattern. |

---

## Should stay dormant

| # | Prompt | Why not |
| :--- | :--- | :--- |
| 1 | "Center this button horizontally and vertically inside a flex container." | UI styling; zero persistence relevance. |
| 2 | "Write a Python script to calculate the Fibonacci sequence recursively." | Pure algorithmic math. |
| 3 | "Convert this JSON payload into a YAML file." | Data format serialization. |
| 4 | "Why does this React useEffect hook run on every re-render?" | Frontend component lifecycle. |
| 5 | "Configure a Dockerfile to package this Go web service." | Containerization tooling. |
| 6 | "How do I merge two in-memory JavaScript objects deeply?" | Local memory manipulation. |
| 7 | "Explain the difference between interface and type alias in TypeScript." | Language typing semantics. |
| 8 | "Set up an ESLint rule to disallow console.log." | Linter configuration. |

---

## Should defer, not take over

| # | Prompt | Expected behavior |
| :--- | :--- | :--- |
| 1 | "Run our Flyway migration scripts on the staging database." | Migration runner owns the execution; advisor supplies schema design principles if asked how to model. |
| 2 | "Follow our team's existing Prisma schema conventions and generate the client." | Existing repository conventions and ORM configs take precedence. |
| 3 | "Provision a PostgreSQL 16 instance on AWS RDS using Terraform." | Infrastructure-as-code workflow governs cloud provisioning; advisor supplies pool sizing heuristics. |

---

## Recording results

| Case | With skill | Without skill | Verdict |
| :--- | :--- | :--- | :--- |
| e.g. activate #1 | triggered, used keyset seek pagination | suggested adding an index to `OFFSET` | improved |

An advisor that changes no verdict is not earning its context cost; an advisor that activates on the dormant cases is over-triggering and needs a narrower description.
