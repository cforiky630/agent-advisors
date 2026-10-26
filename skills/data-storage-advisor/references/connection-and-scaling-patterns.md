# Engineering Reference: Connection Pools & Scaling Patterns

## Purpose

This reference provides production engineering heuristics for connection pool sizing, N+1 query elimination, and read-replica replication lag mitigation based on PostgreSQL/MySQL operational best practices and HikariCP benchmarks.

---

## 1. Connection Pool Sizing & Resource Management

**Misconception**: "If we have 1,000 concurrent web requests, we need 1,000 database connections."
**Reality**: Relational databases (PostgreSQL processes, MySQL threads) are bound by CPU cores and disk I/O spindles. Excess connections (>100 per database instance) trigger devastating OS context-switching overhead, disk thrashing, and memory exhaustion.

### The Pool Sizing Formula (HikariCP / PostgreSQL Standard)
```
connections = (CPU_cores * 2) + effective_spindle_count
```
- Example: An 8-core database server with SSD storage operates optimally with approximately `(8 * 2) + 1 = 17` to `25` active connections.
- Set application pool sizes conservatively (e.g., 10–20 connections per service instance).
- Use an external connection pooler (e.g., **PgBouncer** in transaction pooling mode or **ProxySQL**) to multiplex thousands of microservice clients onto a small, optimal pool of backend database connections.

---

## 2. The N+1 Query Problem in ORMs

**Root Cause**: Fetching a collection of parent entities, and subsequently executing an individual database query for each child inside an iteration loop.

```typescript
// VULNERABLE (1 query for orders + N queries for users = N+1 total queries):
const orders = await orderRepo.find({ limit: 100 });
for (const order of orders) {
  order.user = await userRepo.findById(order.userId); // 100 round-trips!
}
```

### Production Remedies
1. **SQL Eager Loading (`JOIN`)**:
   `SELECT orders.*, users.* FROM orders JOIN users ON orders.user_id = users.id;`
2. **Two-Step Batch Fetching (`IN` Clause)**:
   Extract all unique user IDs and fetch in a single batched query:
   `SELECT * FROM users WHERE id IN (:user_ids);`
3. **The DataLoader Pattern (GraphQL / Microservices)**:
   Queue and de-duplicate entity lookups across the current event-loop tick, consolidating individual requests into a single batched fetch.

---

## 3. Read-Write Splitting & Replica Lag Mitigation

**Architecture**: Primary node handles all writes (`INSERT`, `UPDATE`, `DELETE`); read replicas handle `SELECT` queries asynchronously replicated from the primary.

### The "Read-Your-Own-Writes" Hazard
- Asynchronous replication carries latency (typically 5ms–2000ms).
- When a user updates their profile or posts a comment and immediately refreshes the page, routing the read to a replica that has not caught up displays stale data (making the user think their write was lost).

### Production Mitigation Patterns
1. **Time-Windowed Primary Pinning**:
   - When a user performs a write mutation, set a session cookie or local cache entry with a timestamp (e.g., `last_write_at`).
   - For the next 2–5 seconds, route all read requests for that specific user directly to the **Primary** database node.
   - All subsequent reads drop back to read replicas once replica lag window has passed.
2. **Replication Position Verification (GTID / LSN)**:
   - Record the Global Transaction ID (GTID) or Log Sequence Number (LSN) upon committing the write on the primary.
   - Wait or assert that the selected read replica has caught up to that LSN before executing read queries.
3. **Explicit Writer Routing for Invariant Checks**:
   - Critical authorization, quota checks, or idempotency queries must always be routed to the Primary, never to read replicas.
