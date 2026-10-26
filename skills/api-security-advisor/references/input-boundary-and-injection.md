# Engineering Reference: Input Boundaries & Injection Defense

## Purpose

This reference establishes defensive, production-tested engineering heuristics for input sanitization, data validation, and injection defense across SQL, OS commands, file paths, and serialization boundaries.

---

## 1. Domain Modeling: "Parse, Don't Validate"

**Principle**: Instead of shotgun checking primitives (`string`, `number`) across service layers, parse raw inputs into strongly typed Value Objects at the API boundary.

### Production Directives
- **Constrained Types Over Primitives**:
  - Replace raw `string` with domain types: `EmailAddress`, `TenantId`, `OrderCode`.
  - Construction of the Value Object encapsulates all invariant checks and normalization (e.g., lowercase conversion, trimming, regex validation).
  - Once constructed, inner domain services trust the Value Object's integrity without repeating defensive assertions.
- **Fail Early at the Edge**: Invalidate and reject malformed data at the outermost gateway/controller before it reaches persistence or execution layers.

---

## 2. SQL & NoSQL Injection Defense

### Production Directives
- **100% Parameterized Queries / Prepared Statements**:
  - Never concatenate or interpolate user input directly into SQL/NoSQL query strings.
  - Rely on database driver placeholders (`?`, `$1`, `:param`).
- **Dynamic Identifiers & Whitelisting**:
  - Column names, table names, and sort directions (`ASC`/`DESC`) cannot be parameterized by SQL drivers.
  - Assert dynamic identifiers against an explicit, immutable allowlist before query composition:
    ```typescript
    const ALLOWED_SORT_COLUMNS = new Set(['created_at', 'amount', 'status']);
    if (!ALLOWED_SORT_COLUMNS.has(sortBy)) {
      throw new InvalidRequestError('Invalid sort column');
    }
    ```
- **Cursor-Based Pagination for Large Tables**:
  - Unbounded `OFFSET 500000` queries trigger full-table index scans, causing database CPU exhaustion (Denial of Service). Prefer keyset pagination (`WHERE (created_at, id) < (:last_date, :last_id) LIMIT 20`).
- **ORM Escaping Caveats**: Be vigilant with raw clauses (`findRaw`, `whereRaw`, `$where`) in ORMs (Sequelize, Prisma, TypeORM, Mongoose). Parameterize raw queries explicitly.

---

## 3. Command Injection & Subprocess Execution

### Production Directives
- **Avoid Shell Interpreters**: Never pass command strings through a shell interpreter (`exec`, `system`, `sh -c`, `cmd.exe /c`).
- **Use Parameterized Argument Arrays (Without `shell: true`)**:
  - In Node.js / Python / Go, pass argument arrays directly to the executable binary. Never configure `{ shell: true }` in `spawn`/`execFile`:
  ```typescript
  // VULNERABLE:
  exec(`convert ${userFile} output.png`);
  spawn('convert', [userFile, 'output.png'], { shell: true }); // Still vulnerable!

  // DEFENSIVE:
  execFile('convert', [userFile, 'output.png']); // shell defaults to false
  ```
- **Strict Character & Path Whitelisting**: Validate file names and arguments against strict character sets (`^[a-zA-Z0-9._-]+$`).

---

## 4. Path Traversal, Symlinks & File Uploads

### Production Directives
- **Normalize, Canonicalize & Resolve Symlinks**:
  - Resolving relative paths (`../`) is insufficient if archives contain symlinks pointing outside the extraction root (Zip Slip).
  - Canonicalize paths using `fs.realpathSync` or assert that neither the file nor its parent directories are symlinks escaping `safeRoot`:
  ```typescript
  const safeRoot = fs.realpathSync('/var/app/uploads');
  const targetPath = path.resolve(safeRoot, userInput);
  if (!targetPath.startsWith(safeRoot + path.sep)) {
    throw new SecurityException('Path traversal attempt detected');
  }
  // Verify physical realpath of target (or its parent dir for new files) resolves inside root:
  const dirToCheck = fs.existsSync(targetPath) ? targetPath : path.dirname(targetPath);
  const realTarget = fs.realpathSync(dirToCheck);
  if (realTarget !== safeRoot && !realTarget.startsWith(safeRoot + path.sep)) {
    throw new SecurityException('Symlink path traversal detected');
  }
  ```
- **Discard User-Supplied File Names**: Store uploaded files using server-generated UUIDs on disk or object stores (S3). Keep original file names only as database metadata.
- **Enforce File Content Type Verification**: Validate uploaded file headers (magic bytes) rather than trusting client-provided `Content-Type` headers or file extensions.

---

## 5. Safe Deserialization & XML/XXE

### Production Directives
- **Prohibit Untrusted Object Deserialization**:
  - Avoid native language serialization formats for client data (e.g., Java `ObjectInputStream`, Python `pickle`, PHP `unserialize`, Ruby `Marshal`).
  - Use standard data-interchange formats (JSON, Protocol Buffers) with strict schema parsing.
- **Disable XML External Entity (XXE) Resolution**:
  - When parsing XML, explicitly disable DTDs (Document Type Definitions) and external entity resolution in parser configuration.
