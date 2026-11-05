# Engineering Reference: Transactions, Isolation Levels & Concurrency Control

> Usage: Apply only the technical guidance relevant to the current decision. The parent `SKILL.md` controls scope, workflow, priorities and delivery; this reference does not require extra cleanup, architecture layers, tool calls or a separate report. Treat design preferences as defaults with counter-indications, while preserving actual safety/correctness invariants.


## Purpose

This reference establishes heuristics for transaction boundaries, concurrency anomalies, and deadlock prevention based on *Designing Data-Intensive Applications* (DDIA) and modern MVCC relational engines.

---

## 1. Short Transactions and Recoverable External Effects

Keep ordinary business transactions free of slow external calls; one database transaction cannot roll back a remote charge or email. First decide whether an external effect exists. For a DB-only invariant, use one local transaction.

### External-Effect Workflow
1. **Reserve durably**: In a short transaction, validate the invariant and persist an operation ID, request fingerprint, pending state and any reservation. Commit before calling the provider. Use a unique constraint to deduplicate concurrent submissions.
2. **Call outside the transaction**: Send the same stable idempotency key for every attempt at this operation. Verify provider key retention, scope and payload-matching semantics. Count SDK retries and fit all attempts within an end-to-end deadline.
3. **Finalize conditionally**: Record the provider result/reference and transition pending to succeeded/failed with a conditional update or version check. Duplicate callbacks must not apply the effect twice.
4. **Recover ambiguity**: A timeout or crash may occur after the provider succeeds. Preserve an unknown/pending state, query the provider by operation reference or await a verified callback, and reconcile before retrying or releasing a reservation. Never create a new operation key merely because the previous response was lost.
5. **Bound pending work**: Define ownership/leases, retry limits, reservation expiry and a reconciliation job. A lease expiry alone does not prove that an external action failed. Compensation is a separate business operation that can fail and needs its own idempotency and observability.

### Failure Cases to Verify

| Boundary | Required behavior |
| :--- | :--- |
| Crash after reservation, before call | Resume from durable pending state or safely expire a confirmed unexecuted reservation. |
| Provider succeeds, response lost | Query/reconcile or retry with the same supported idempotency key; do not charge again with a new key. |
| Provider succeeds, final DB commit fails | Recover from provider reference and operation state; finalize once. |
| Concurrent retries/callbacks | Unique operation identity and conditional state transitions apply the result once. |

### When This Default Fails (Counter-Indications)
- **No external side effect**: Use one local ACID transaction rather than introducing a multi-phase state machine.
- **No safe deduplication or result lookup**: Do not automatically retry an ambiguous non-idempotent call. Preserve unknown state and use a defined reconciliation/operator path.
- **Strong cross-system atomicity required**: A split workflow offers no global ACID guarantee. Verify a supported coordination mechanism or revisit the business contract before proceeding; do not claim a Saga is automatically equivalent.
- **Reliable publication needed**: A same-database transactional outbox can atomically store the business update and publication intent. It obeys short-transaction guidance; its relay/consumer still needs duplicate handling and recovery. Adopt it only when that delivery requirement exists.

---

## 2. Transaction Isolation Levels & Concurrency Anomalies

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Write Skew / Serialization Anomaly |
| :--- | :---: | :---: | :---: | :---: |
| **Read Uncommitted** | Possible | Possible | Possible | Possible |
| **Read Committed** | **Prevented** | Possible | Possible | Possible |
| **Repeatable Read** (snapshot reads; engine-specific) | **Prevented** | **Prevented** | **Prevented** (MVCC) | Possible (Write Skew) |
| **Serializable** (implementation varies) | **Prevented** | **Prevented** | **Prevented** | **Prevented** |

Isolation names alone do not define every engine behavior. PostgreSQL maps Read Uncommitted to Read Committed and prevents phantoms at Repeatable Read; MySQL snapshot reads and locking/current reads differ. Verify the deployed engine and read mode before applying this summary.

### Write Skew (The Doctors on Call Problem)
- Occurs when two concurrent transactions read overlapping data, make a decision based on that data, and write to disjoint rows that together violate an invariant (e.g., at least one doctor must remain on call; two doctors simultaneously query `count > 1` and both successfully check out).
- **Remedy**:
  - Elevate isolation level to `SERIALIZABLE` (Postgres SSI), or
  - Explicitly lock the shared scope using `SELECT ... FOR UPDATE` or an explicit lock table.

---

## 3. Concurrency Control: Optimistic vs. Pessimistic

### Optimistic Concurrency Control (OCC - Version Column)
- **Best For**: High read-to-write ratios, low contention, long user think times.
- **Implementation**: Add an integer `version` or timestamp column:
  ```sql
  UPDATE inventory
  SET stock = stock - :quantity, version = version + 1
  WHERE id = :id AND version = :expected_version AND stock >= :quantity;
  ```
  - Inspect the affected rows count. If `0`, another transaction modified the row; abort or retry.

### Pessimistic Locking (`SELECT ... FOR UPDATE`)
- **Best For**: High write contention, critical financial balances, zero tolerance for retry loops.
- **Implementation**: Lock the target row within a short transaction:
  ```sql
  BEGIN;
  SELECT balance FROM accounts WHERE id = :account_id FOR UPDATE;
  -- Immediate balance check and update:
  UPDATE accounts SET balance = balance - :amount WHERE id = :account_id;
  COMMIT;
  ```
- **When This Default Fails (Counter-Indications)**:
  - **OCC Retry Storms on Hot Rows**: Optimistic locking (`WHERE version = :expected`) degrades catastrophically on hot flash-sale inventory or shared tenant counters where 50 concurrent workers collide on the same row—49 transactions fail and retry in a loop, amplifying database CPU load. Switch to a single atomic `UPDATE inventory SET stock = stock - :qty WHERE id = :id AND stock >= :qty` or short pessimistic `FOR UPDATE` locks.

---

## 4. Deadlock Elimination via Consistent Lock Ordering

**Root Cause**: Transaction A locks Row 1 then requests Row 2; Transaction B locks Row 2 then requests Row 1. The database detects a deadlock cycle and aborts one transaction.

### Mandatory Directive
When modifying or locking multiple entities in a single transaction, **always sort entity identifiers in a consistent global order (e.g., ascending by ID)** before acquiring locks:

```typescript
// DEFENSIVE: Always sort target IDs before locking/updating:
const sortedAccountIds = [senderId, receiverId].sort((a, b) => a.localeCompare(b));

for (const id of sortedAccountIds) {
  await db.query('SELECT * FROM accounts WHERE id = ? FOR UPDATE', [id]);
}
```
Consistent ordering reduces row-lock cycles; it does not eliminate deadlocks involving other tables, secondary indexes, gap locks or implicit constraint locks. Handle detected deadlocks with bounded retries of the entire transaction.
