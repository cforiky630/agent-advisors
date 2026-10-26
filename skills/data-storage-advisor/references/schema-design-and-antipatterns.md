# Engineering Reference: Schema Design & SQL Antipatterns

## Purpose

This reference provides architectural heuristics for relational schema design, relationship modeling, and data integrity constraints based on Bill Karwin's *SQL Antipatterns*.

---

## 1. Classical Structural Antipatterns

### Antipattern 1: Jaywalking (Comma-Separated Lists)
- **Problem**: Storing delimited lists in a single text column (`tags: "frontend,react,css"`).
- **Consequences**: Impossible to enforce foreign key integrity; queries require expensive substring/regex matching (`LIKE '%react%'`); aggregation (`COUNT`) requires runtime parsing.
- **Solution**: Normalize into an intersection/junction table (`article_tags(article_id, tag_id)`) with composite primary key `(article_id, tag_id)`.

### Antipattern 2: Entity-Attribute-Value (EAV)
- **Problem**: Attempting to accommodate dynamic schemas by creating a table with rows of `(entity_id, attribute_name, attribute_value)`.
- **Consequences**: Loss of column data types (everything stored as string); cannot enforce `NOT NULL` constraints; simple reads require multiple self-joins.
- **Solution**:
  - Prefer semi-structured native columns (`JSONB` in PostgreSQL, `JSON` in MySQL) with GIN/expression indexes for genuinely sparse, irregular attributes.
  - Retain core, queried business attributes in typed relational columns.

### Antipattern 3: Polymorphic Associations
- **Problem**: Storing `commentable_id` and `commentable_type` in a comments table so it can point to either `articles` or `videos`.
- **Consequences**: Relational database foreign keys cannot be applied to dynamic target tables, destroying referential integrity.
- **Solutions**:
  - **Reverse Reference Tables (Intersection)**: `article_comments(article_id, comment_id)` and `video_comments(video_id, comment_id)` with explicit foreign keys.
  - **Exclusive Arc**: Separate nullable foreign key columns (`article_id REFERENCES articles`, `video_id REFERENCES videos`) paired with a `CHECK` constraint asserting exactly one foreign key is not null:
    ```sql
    CHECK (
      (article_id IS NOT NULL AND video_id IS NULL) OR
      (article_id IS NULL AND video_id IS NOT NULL)
    )
    ```

### Antipattern 4: Multicolumn Attributes
- **Problem**: Storing fixed numbered columns: `tag1, tag2, tag3` or `phone1, phone2`.
- **Consequences**: Hardcoded ceiling; searching requires inspecting every column (`WHERE tag1 = ? OR tag2 = ?`); adding attributes requires schema alterations (`ALTER TABLE`).
- **Solution**: Dependent table referencing parent ID.

---

## 2. Constraints & Referential Integrity

### Directives
- **Enforce Foreign Keys at the Database Layer**: Do not rely exclusively on application-level ORM lifecycle hooks (`beforeDelete`, cascade callbacks) to maintain data consistency. Network failures or manual admin scripts easily create orphaned rows.
- **Explicit `ON DELETE` Policies**:
  - `RESTRICT` / `NO ACTION`: Default policy. Rejects parent deletion if children exist.
  - `CASCADE`: Use exclusively for owned compositional children (e.g., deleting an `Order` cascades to `OrderItems`).
  - `SET NULL`: Use when the relationship is optional (e.g., `assigned_user_id` set to null on user deletion).

---

## 3. The Soft-Delete Unique Constraint Trap

**Problem**: Adding a `deleted_at` timestamp frequently breaks unique constraints:
- Desired rule: Email must be unique among active users.
- Standard SQL unique constraint on `(email, deleted_at)`:
  - In PostgreSQL / MySQL: Multiple active rows with `deleted_at = NULL` may violate uniqueness or (in SQL standard) `NULL != NULL` allows duplicate active emails!

### Production Solution: Partial Unique Index
```sql
-- PostgreSQL: Partial unique index covering only active rows
CREATE UNIQUE INDEX uq_users_active_email ON users (email)
WHERE deleted_at IS NULL;

-- MySQL (Prior to partial index support):
-- Store deleted_at default as a sentinel non-null value or use active state column
```
