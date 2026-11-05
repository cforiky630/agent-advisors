# Sources & Provenance: Data Storage Advisor

This document provides formal bibliographic attribution, copyright provenance, and reference mapping for `data-storage-advisor`.

> **Audience**: Humans, open-source auditors, and maintainers.  
> **Runtime Note**: This file is intentionally omitted from `SKILL.md` routing so that AI agents do not consume context tokens loading it during routine task execution.

---

## Legal Notice & Attribution Policy

1. **Independent Distillations**: The engineering summaries located in `references/*.md` are independently written, structural distillations of relational database design, query optimization, and storage engineering principles. They are **not** verbatim reproductions, scans, or derivative adaptations of proprietary texts.
2. **Trademarks & Copyrights**: All book titles, author names, database trademarks (PostgreSQL, MySQL), and catalog references belong entirely to their respective copyright holders and publishers.
3. **No Affiliation**: This open-source project is not affiliated with, sponsored by, or endorsed by any of the authors, publishers, or database organizations referenced below.

---

## Canonical Standards & Reference Mapping

| Reference File | Primary Source Title | Author(s) / Publisher | ISBN / Official Link |
| :--- | :--- | :--- | :--- |
| `references/query-optimization-and-indexing.md` | *High Performance MySQL* (4th Edition) | Silvia Botros, Jeremy Tinley (O'Reilly, 2021) | ISBN 978-1492080510 |
| `references/query-optimization-and-indexing.md` | *PostgreSQL Documentation: Performance Tips & B-Tree Indexes* | The PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/indexes.html |
| `references/schema-design-and-antipatterns.md` | *SQL Antipatterns: Avoiding the Pitfalls of Database Programming* | Bill Karwin (Pragmatic Bookshelf, 2010) | ISBN 978-1934356555 |
| `references/transactions-and-concurrency.md` | *Designing Data-Intensive Applications* (Transactions & Concurrency) | Martin Kleppmann (O'Reilly, 2017) | ISBN 978-1449373320 |
| `references/connection-and-scaling-patterns.md` | *About Pool Sizing & HikariCP Research* | Brett Wooldridge (HikariCP / Oracle Guidelines) | https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing |
| `references/connection-and-scaling-patterns.md` | *PostgreSQL Documentation: High Availability, Load Balancing, and Replication* | The PostgreSQL Global Development Group | https://www.postgresql.org/docs/current/high-availability.html |

---

## Maintenance Rules

- For substantive reference changes, keep the source attribution accurate. Check an edition when its differences affect the recommendation or an explicit conformance claim; preserve the applicable project-pinned version. Editorial edits and stable principles do not require a search for the newest publication.
- Reference notes must remain concise, high-density persistence heuristics rather than database product manuals.

Version-specific clarification: [PostgreSQL 18 multicolumn indexes and skip scans](https://www.postgresql.org/docs/18/indexes-multicolumn.html). HikariCP pool sizing is a benchmark starting point; its source explicitly notes the absence of SSD analysis, not an SSD optimum.

Dialect boundary: [MySQL 8.4 CREATE INDEX](https://dev.mysql.com/doc/refman/8.4/en/create-index.html) documents functional indexes and NULL uniqueness semantics; PostgreSQL partial-index syntax must not be presented as portable SQL.

## Retry and Recovery Verification (2026-11-05)

[Amazon Builders' Library: Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) describes request identity and side-effect safety. [AWS Saga orchestration guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html) covers participant idempotency, compensation and crash handling. The advisor's conditional-finalization and reconciliation checklist is an engineering synthesis, not a claim that every workflow needs Saga orchestration or achieves cross-system ACID.

Isolation semantics: [PostgreSQL 17 transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html). Engine/read-mode differences must be checked before treating an isolation-name table as a portable behavioral contract.
