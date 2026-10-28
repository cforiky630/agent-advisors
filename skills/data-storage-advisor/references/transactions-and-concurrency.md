# Engineering Reference: Transactions, Isolation Levels & Concurrency Control

## Purpose

This reference establishes heuristics for transaction boundaries, concurrency anomalies, and deadlock prevention based on *Designing Data-Intensive Applications* (DDIA) and modern MVCC relational engines.

---

## 1. The Golden Rule of Transaction Boundaries

**Directive**: **NEVER hold a database transaction open while performing network I/O, file system operations, or computationally expensive tasks.**

### The Catastrophic Cascade
- An HTTP call to a payment gateway taking 1.5 seconds holds the database connection and row locks open for 1.5 seconds.
- At 50 concurrent requests, the entire database connection pool (typically 20–50 connections) is exhausted, causing connection starvation and cascading site-wide outages.

### The Correct Three-Phase Pattern
1. **Phase 1 (Fast DB Read / State Reservation)**: Query current state, validate preconditions, reserve status (commit or release locks immediately).
2. **Phase 2 (External I/O Outside Transaction)**: Make external API call, send email, or execute third-party network request.
3. **Phase 3 (Fast DB Update / State Finalization)**: Open a short transaction, record results, update balance/status, commit in milliseconds.

---

## 2. Transaction Isolation Levels & Concurrency Anomalies

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Write Skew / Serialization Anomaly |
| :--- | :---: | :---: | :---: | :---: |
| **Read Uncommitted** | Possible | Possible | Possible | Possible |
| **Read Committed** | **Prevented** | Possible | Possible | Possible |
| **Repeatable Read** (MySQL default) | **Prevented** | **Prevented** | **Prevented** (MVCC) | Possible (Write Skew) |
| **Serializable** (SSI) | **Prevented** | **Prevented** | **Prevented** | **Prevented** |

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
Eliminating circular lock dependencies eliminates 99% of relational database deadlocks.
