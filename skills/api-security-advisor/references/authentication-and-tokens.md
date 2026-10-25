# Engineering Reference: Authentication, Sessions & Token Hygiene

## Purpose

This reference provides production-grade architectural and implementation heuristics for authentication, session management, and JSON Web Token (JWT) handling based on RFC 7519, RFC 9068, and NIST SP 800-63B standards.

---

## 1. JSON Web Token (JWT) Construction & Validation

### Production Directives
- **Explicit Algorithm Pinning**: Always pin the expected cryptographic algorithm when verifying signatures. Never extract the algorithm from the untrusted token header:
  - Disallow the `none` algorithm unconditionally.
  - Defend against key confusion attacks (e.g., verifying an RSA token with an HMAC public key as a shared secret).
- **Mandatory Claims Assertion**:
  - `exp` (Expiration): Enforce a tight expiration window (5–15 minutes for access tokens). Account for maximum clock skew of 60 seconds.
  - `iss` (Issuer) & `aud` (Audience): Explicitly verify both claims to prevent token forwarding across different systems or environments.
  - `nbf` (Not Before): Check if present to ensure the token is active.
- **Efficient Stateless Revocation (Token Versioning Pattern)**:
  - Tracking millions of individual revoked `jti` IDs in Redis creates memory bloat.
  - *Production Pattern*: Include a `ver` (version) or `auth_time` claim in the JWT payload. Store a corresponding `token_version` counter in the user record/cache.
  - When a user logs out, resets credentials, or changes roles, increment `token_version`. Invalidate any token where `jwt.ver < user.token_version` in a single integer comparison.

---

## 2. Token Storage & Web Architecture (SPA / BFF Pattern)

### Web Clients & Browser Security
- **The Backend-for-Frontend (BFF) Pattern (Recommended for SPAs)**:
  - Avoid storing access tokens in `localStorage` or `sessionStorage` (vulnerable to XSS exfiltration).
  - Use a lightweight server/BFF (e.g., Next.js Route Handlers, Envoy, or reverse proxy) to hold tokens in encrypted, `HttpOnly`, `Secure`, `SameSite=Lax` cookies, stripping cookies and injecting standard `Authorization: Bearer <token>` headers toward backend microservices.
- **Cross-Subdomain Cookie Configuration**:
  - For frontend on `app.example.com` and API on `api.example.com`: set `domain: '.example.com'`, `SameSite=Lax`, `Secure: true`.
  - If using cross-origin cookies (`SameSite=None`), pair with explicit CSRF token defense (e.g., Double Submit Cookie with custom header `X-CSRF-Token`).

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

## 4. Password Handling & Account Authentication (NIST SP 800-63B)

- **Eliminate Arbitrary Composition Rules**: Do not mandate complex character mixtures (e.g., uppercase + symbol + number) that encourage predictable substitutions (`P@ssw0rd1`).
- **Enforce Length & Breach Checking**: Require minimum 8 characters (12–16 recommended). Check submitted passwords against known breached password lists (e.g., HaveIBeenPwned API or bloom filters).
- **Rate Limit Login Attempts & Progressive Delays**: Mitigate credential stuffing by limiting attempts per account and per IP using distributed storage (Redis). Use CAPTCHA or progressive exponential backoff after 3–5 consecutive failures.
- **Constant-Time Verification**: When verifying user credentials, perform password hash checks even if the user lookup fails, preventing username enumeration through timing discrepancies.
