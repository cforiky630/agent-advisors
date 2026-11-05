# Engineering Reference: Authentication, Sessions & Token Hygiene

> Usage: Apply only the technical guidance relevant to the current decision. The parent `SKILL.md` controls scope, workflow, priorities and delivery; this reference does not require extra cleanup, architecture layers, tool calls or a separate report. Treat design preferences as defaults with counter-indications, while preserving actual safety/correctness invariants.


## Purpose

This reference provides production-grade architectural and implementation heuristics for authentication, session management, and JSON Web Token (JWT) handling based on RFC 7519, RFC 9068, and NIST SP 800-63B-4 (2025) standards. Password and session guidance was checked against primary sources on 2026-11-05. Apply the project's stated standard/version; investigate edition differences only when they affect the security decision or requested conformance claim.

---

## 1. JSON Web Token (JWT) Construction & Validation

### Production Directives
- **Explicit Algorithm Pinning**: Always pin the expected cryptographic algorithm when verifying signatures. Never extract the algorithm from the untrusted token header:
  - Disallow the `none` algorithm unconditionally.
  - Defend against key confusion attacks (e.g., verifying an RSA token with an HMAC public key as a shared secret).
- **Mandatory Claims Assertion**:
  - `exp` (Expiration): Enforce expiration and a documented clock-skew allowance. A 5–15 minute access-token lifetime and 60-second skew are example policy starting points, not universal RFC/NIST requirements; choose values from the deployed profile, revocation needs and clock behavior.
  - `iss` (Issuer) & `aud` (Audience): Explicitly verify both claims to prevent token forwarding across different systems or environments.
  - `nbf` (Not Before): Check if present to ensure the token is active.
- **Stateful Revocation with Token Versioning**:
  - Choose per-session revocation, a bounded token denylist, introspection or account-level versioning from the required revocation granularity and freshness. Version checks introduce a DB/cache lookup; they are not stateless.
  - *Production Pattern*: For account-level invalidation, include a numeric `ver` claim in the JWT payload. `auth_time` is a timestamp with different semantics; do not compare it to a version counter. Store a corresponding `token_version` counter in the user record/cache.
  - For all-session invalidation, increment `token_version` and require `jwt.ver === user.token_version` with validated types. Use a session identifier for single-session logout instead of unintentionally logging out every device; define cache freshness and failure behavior.

---

## 2. Token Storage & Web Architecture (SPA / BFF Pattern)

### Web Clients & Browser Security
- **The Backend-for-Frontend (BFF) Pattern (Recommended for SPAs)**:
  - Avoid storing access tokens in `localStorage` or `sessionStorage` (vulnerable to XSS exfiltration).
  - Where a BFF is justified, keep access/refresh tokens server-side and give the browser an opaque session cookie with `HttpOnly`, `Secure` and an appropriate `SameSite` policy. Add CSRF controls for state-changing requests; HttpOnly prevents script reads, not authenticated actions via XSS.
- **Cross-Subdomain Cookie Configuration**:
  - Prefer a host-only cookie by omitting `Domain`; using sibling frontend/API hosts does not itself require a parent-domain cookie. Widen scope only for a documented sharing requirement after checking every included subdomain's trust boundary.
  - Distinguish origin from site: sibling HTTPS subdomains can be cross-origin but same-site. Cross-site cookies require `SameSite=None; Secure` and appropriate CSRF defense; credentialed cross-origin requests also require a deliberate CORS policy. SameSite alone is not a complete CSRF design.

### Mobile & Native Clients
- Store tokens in OS-backed secure storage (iOS Keychain, Android EncryptedSharedPreferences / Keystore).
- Use PKCE (Proof Key for Code Exchange - RFC 7636) for authorization code flows to prevent authorization code interception.

---

## 3. Refresh Token Lifecycle & Rotation (RTR)

### Production Directives
- **One-Time Use & Rotation**: Every time a refresh token is exchanged, invalidate the old refresh token and issue a fresh one.
- **Family Tracking & Reuse Detection**:
  - Group refresh tokens into families linked to a user session.
  - If a previously consumed refresh token is presented again (indicating potential theft/replay), immediately invalidate all active tokens in that family and force re-authentication.
- **Absolute Session Lifetime**: Set an absolute maximum expiration on refresh token chains (e.g., 7–30 days) regardless of activity.

---

## 4. Password Handling & Account Authentication (NIST SP 800-63B-4, 2025)

- **Eliminate Arbitrary Composition Rules**: Do not mandate complex character mixtures (e.g., uppercase + symbol + number) that encourage predictable substitutions (`P@ssw0rd1`).
- **Enforce Length & Breach Checking**: For conformance to SP 800-63B-4 section 3.1.1.2, require at least 15 characters for single-factor passwords; passwords used only within MFA may be shorter but must have at least 8. Permit a maximum length of at least 64 characters, verify the complete password without truncation, and check a blocklist of common/compromised passwords.
- **Rate Limit Login Attempts & Progressive Delays**: Mitigate credential stuffing by limiting attempts per account and per IP using distributed storage (Redis). Use CAPTCHA or progressive exponential backoff after 3–5 consecutive failures.
- **Constant-Time Verification**: When verifying user credentials, perform password hash checks even if the user lookup fails, preventing username enumeration through timing discrepancies.

### When This Default Fails (Counter-Indications)
- **Protocol-specific requirements**: Check the deployed token profile, authenticator type and standards revision before applying access-token lifetimes or password requirements; do not present local heuristics as universal NIST mandates.
- **Single-session logout**: Account-wide versioning is too broad; use per-session state/revocation. A stale cache cannot promise immediate revocation.
- **No BFF requirement**: Retain an established secure client architecture rather than adding a proxy solely to follow this example. Minimize browser token exposure and assess XSS/CSRF explicitly.
