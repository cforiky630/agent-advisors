# Engineering Reference: Query Optimization & B-Tree Indexing

## Purpose

This reference provides production-tested engineering heuristics for relational database indexing, execution plan analysis, and query optimization based on *High Performance MySQL* and PostgreSQL internal tuning standards.

---

## 1. Execution Plan (EXPLAIN) Interpretation

**Directives**: Never optimize queries on intuition. Always inspect the database query planner output (`EXPLAIN` or `EXPLAIN (ANALYZE, BUFFERS)`).

### Access Types Hierarchy (Fastest to Slowest)
1. `const` / `system`: Single row lookup via primary key or unique index.
2. `eq_ref`: 1-to-1 join lookup via unique/primary key.
3. `ref`: Non-unique index lookup returning multiple matching rows.
4. `range`: Index range scan (`BETWEEN`, `<`, `>`, `IN`).
5. `index`: Full index scan (scans entire index tree without table access).
6. `ALL`: Full table scan (critical performance red flag on large tables).

### Crucial Diagnostics
- **Rows Examined vs. Rows Returned**: A high ratio (>100:1) indicates missing index selectivity or poor filter order.
- **`Using filesort`**: Indicates sorting could not be satisfied by index order; requires sorting in memory or disk buffers.
- **`Using temporary`**: Database creates an internal temporary table to evaluate queries (common in un-indexed `GROUP BY` or `DISTINCT`).
- **`Using index` (Covering Index)**: All requested columns exist within the secondary index; zero clustered index/heap lookups needed.

---

## 2. The B-Tree Composite Index Left-Prefix Rule

A composite index on `(col_a, col_b, col_c)` creates a single sorted B-Tree ordered hierarchically.

### Heuristics
- **Strict Leftmost Matching**: The query must filter on `col_a` to utilize the index. A query filtering only on `col_b` and `col_c` cannot navigate the index root and triggers a full scan.
- **The Range Condition Barrier (ESR Rule: Equality, Sort, Range)**: The SQL query optimizer automatically reorders `AND`-ed predicates in the `WHERE` clause, so lexical condition order in `WHERE` does not matter—**index column definition order** does. A B-Tree seek can traverse equality columns up to the first range condition (`<`, `>`, `BETWEEN`, `LIKE 'prefix%'`), after which subsequent index columns cannot be used for tree-seek filtering:
  - Given query: `WHERE tenant_id = 1 AND created_at >= '2026-01-01' AND status = 'ACTIVE'`
  - Suboptimal index `(tenant_id, created_at, status)` -> **Only `tenant_id` and `created_at` use index seek**; `status` sits after the range column `created_at` in the index definition and must be filtered post-scan.
  - Optimal index `(tenant_id, status, created_at)` -> **All 3 columns use index seek** (equality on `tenant_id` and `status`, followed by range scan on `created_at`).
- **Index Order Rule**: Place equality columns first, followed by sort/group columns, followed by range filters (ESR).

---

## 3. Index Invalidation Anti-Patterns

### Anti-Pattern 1: Function Wrapping on Columns
- **Vulnerable**: `WHERE DATE(created_at) = '2026-10-25'` or `WHERE SUBSTRING(name, 1, 3) = 'ABC'`.
- **Defensive**: Apply functions to the constant literal, not the column:
  `WHERE created_at >= '2026-10-25 00:00:00' AND created_at < '2026-10-26 00:00:00'`.

### Anti-Pattern 2: Type Mismatches & Column Casts (Full Scans or Runtime Errors)
- **Vulnerable**: Querying a `VARCHAR` column with an integer literal or casting the indexed column:
  `SELECT * FROM users WHERE phone_number = 13800001111;`
  - **MySQL**: Silently coerces every row's string column to a floating-point number (`CAST(phone_number AS DOUBLE)`), causing both precision loss and a full table/index scan.
  - **PostgreSQL**: Strictly rejects `varchar = bigint` with `ERROR: operator does not exist: character varying = bigint`. However, fixing it by casting the column (`WHERE phone_number::bigint = 13800001111` or `WHERE LOWER(email) = 'a@b.com'`) disables the standard B-Tree index unless a matching expression/functional index exists.
- **Defensive**: Match parameter and literal types strictly (`WHERE phone_number = '13800001111'`), or create an explicit expression index (`CREATE INDEX ON users (LOWER(email))`).

### Anti-Pattern 3: Leading Wildcards in `LIKE`
- **Vulnerable**: `WHERE title LIKE '%keyword%'` (B-Tree cannot navigate middle or suffix matches).
- **Defensive**: Prefix matching only (`WHERE title LIKE 'keyword%'`), or implement a dedicated Full-Text Search index (GIN/GiST or search engine).

---

## 4. Keyset Seek Pagination (Eliminating Deep `OFFSET`)

**Problem**: `LIMIT 20 OFFSET 500000` forces the database to read 500,020 rows, discard 500,000, and return 20. Latency grows linearly with page depth.

### Production Keyset Seek Pattern
Record the last evaluated sort cursor and primary key from the previous page:
```sql
-- VULNERABLE (Degrades linearly as offset increases):
SELECT id, title, created_at FROM articles
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 100000;

-- DEFENSIVE (O(1) execution time regardless of depth):
SELECT id, title, created_at FROM articles
WHERE (created_at < :last_seen_created_at)
   OR (created_at = :last_seen_created_at AND id < :last_seen_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```
Enforce composite index: `(created_at DESC, id DESC)`.

### When This Default Fails (Counter-Indications)
- **Small Bounded Tables ($< 10,000$ rows) or Mandatory Random Page Jumps**: Back-office admin tables that require jumping directly to "Page 42" cannot use pure keyset cursors alone. For those cases, cap maximum offset depth (e.g., `OFFSET <= 5000`) and use a **Deferred Join** (`SELECT a.* FROM articles a JOIN (SELECT id FROM articles ORDER BY created_at DESC LIMIT 20 OFFSET 1000) idx USING (id)`) so the offset scan touches only the narrow covering index.
- **Random `UUIDv4` Clustered Keys**: In InnoDB or clustered B-Tree tables, using random `UUIDv4` as the tie-breaker primary key causes random page splits on `INSERT`; prefer time-ordered `UUIDv7` / `KSUID` or `BIGINT` identity keys.
