# Engineering Reference: OWASP API Security Top 10

## Purpose

This reference provides actionable, production-grade engineering heuristics based on the OWASP API Security Top 10 standard. It prioritizes practical implementation, eliminating textbook anti-patterns that fail under real-world deployment conditions.

---

## 1. Broken Object Level Authorization (BOLA / IDOR - API1)

**Root Cause**: Exposing object identifiers in URLs or request payloads without asserting that the authenticated subject owns or is explicitly authorized to access the object.

### Production Directives
- **Assert Tenant/User Context in Every Query**: Never rely solely on an entity ID passed by the client. Bind queries to the caller's verified identity token:
  ```sql
  -- VULNERABLE:
  SELECT * FROM orders WHERE id = :order_id;

  -- DEFENSIVE:
  SELECT * FROM orders WHERE id = :order_id AND tenant_id = :authenticated_tenant_id;
  ```
- **Compound Keys & Policy Enforcement**: In microservices or ORMs, perform row-level filtering in the repository layer or run an explicit policy assertion (`policy.can(user, 'read', order)`) before exposing the resource.
- **Use Unpredictable Identifiers**: Prefer UUIDv4 or KSUID over sequential integers (`id=1234`) to defeat automated enumeration, while maintaining database authorization checks.
- **Fail Closed on Missing Subject**: If the caller's identity context cannot be established, abort with HTTP 401/403 before executing data access routines.

---

## 2. Broken Object Property Level Authorization (BOPLA - API3)

**Root Cause**: Mass assignment or excessive data exposure where endpoints blindly bind client payloads to domain models, or serialize private fields to JSON responses.

### Production Directives
- **Strict Schema Parsers (Zod / Pydantic / Valibot)**:
  - Explicitly declare input schemas for every mutating endpoint.
  - Configure schemas to reject (`.strict()`) or silently strip (`.strip()`) unmapped properties, strictly forbidding injection of administrative attributes (`role`, `is_admin`, `verified`, `credit_balance`).
- **Dedicated Response DTOs (No ORM Serialization)**: Never return raw database records directly to JSON serializers. Explicitly map domain entities to outward-facing response contracts to prevent leaking password hashes, internal flags, or PII.

---

## 3. Unrestricted Resource Consumption (API4)

**Root Cause**: Endpoints allowing unbounded memory allocation, database query size, or execution time, leading to denial of service.

### Production Directives
- **Enforce Hard Pagination Limits**: Set maximum limits on paginated queries (e.g., `limit` capped at 100, default 20). Reject negative or exorbitant limits.
- **Payload & Body Size Limits**: Enforce request body size caps at the gateway/framework layer *before* buffer allocation (e.g., JSON capped at 1MB; file uploads with explicit content-length ceilings).
- **Distributed Rate Limiting (Multi-Pod Safe)**:
  - In-memory rate limiters (`Map` or local cache) fail across multi-replica or auto-scaling environments.
  - Production APIs must use a distributed store (e.g., Redis-backed sliding window or generic cell rate algorithm via atomic Lua scripts).
  - High sensitivity routes (auth, password reset, checkout): tight limits (e.g., 5 requests / min). Include standard `Retry-After` headers.

---

## 4. Broken Function Level Authorization (BFLA - API5)

**Root Cause**: Relying on hidden UI elements or client-side routing to prevent unauthorized users from invoking administrative or privileged endpoints.

### Production Directives
- **Server-Side Policy Middleware**: Validate permissions explicitly at the controller or application service boundary before business logic runs.
- **Hierarchical Privilege Separation**: Administrative and sensitive workflows (e.g., `/admin/*`, `/internal/*`) must enforce independent policy checks regardless of network origin.
- **Default Deny Route Configuration**: Configure route matchers to require authentication by default; public routes must be explicitly allowlisted.

---

## 5. Server-Side Request Forgery (SSRF - API7)

**Root Cause**: Fetching remote resources from user-supplied URLs without verifying destination IP addresses, allowing attackers to pivot into internal cloud metadata or private VPCs.

### Production Directives (Addressing DNS Rebinding & TOCTOU)
- **Beware of Naive Pre-Lookup (TOCTOU Flaw)**:
  - Resolving a hostname with `dns.lookup()`, verifying it, and then passing the URL to `fetch(url)` introduces a **DNS Rebinding** race condition (the attacker returns a public IP during pre-check, and `169.254.169.254` on actual connection).
- **Production Defense Patterns**:
  1. **Socket-Level IP Pinning (Custom Transport / Dialer)**: Use a custom HTTP Agent/Dialer that resolves the IP, asserts it is not in private/link-local ranges, and connects *directly* to that verified IP address while passing the original hostname only in the `Host` header and TLS SNI.
  2. **Egress Proxy**: Route all outbound user-triggered HTTP requests through a hardened egress proxy (e.g., Smokescreen, Squid, Envoy) configured with strict IP filtering.
- **Disallowed IP Ranges**:
  - `0.0.0.0/8`, `10.0.0.0/8`, `127.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254` (cloud metadata), and IPv6 equivalents (`::1`, `fc00::/7`, `fe80::/10`).
- **Enforce Protocol & Scheme Allowlists**: Only permit `https:` (or `http:` where required). Strictly reject `file:`, `gopher:`, `ftp:`, `dict:`.
- **Disable Automatic Redirection Following**: Disallow HTTP redirect following or re-verify destination IPs on each redirect hop.
