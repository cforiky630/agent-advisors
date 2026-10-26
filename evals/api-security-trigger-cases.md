# Trigger Cases: API Security Advisor

Manual evaluation set for `api-security-advisor`. Run each prompt in a **fresh session** with only this skill installed, then repeat with the skill removed and compare. A case "triggers" when the `SKILL.md` body enters context — not when the answer merely mentions security.

CI checks structure only; these cases check behavior. For whether the advisor improves the work rather than merely loading, use [`outcome-protocol.md`](outcome-protocol.md).

---

## Should activate

| # | Prompt | Expected behavior |
| :--- | :--- | :--- |
| 1 | "Write an API endpoint to fetch user orders by order_id." | Enforces subject/tenant ownership check alongside `order_id` (defeats BOLA/IDOR). |
| 2 | "Implement a JWT authentication verification middleware in TypeScript." | Pins accepted algorithm (rejects `none`), validates `iss`/`aud`/`exp`, defends against key confusion. |
| 3 | "How should I store user passwords and verify them during login?" | Recommends Argon2id/Bcrypt; mandates per-user random salt; enforces constant-time comparison. |
| 4 | "We're implementing a webhook delivery service where users provide the target URL." | Enforces SSRF defenses: Protocol allowlist (HTTPS), socket-level / custom dialer IP verification against private/loopback/link-local CIDR blocklist to prevent DNS rebinding (TOCTOU), and disabled redirects. |
| 5 | "Design an update endpoint for user profile settings." | Dedicated DTO preventing mass assignment (BOPLA); explicit allowed property mapping. |
| 6 | "Compare these two cryptographic signatures or HMAC tokens." | Enforces constant-time comparison (`timingSafeEqual`) to eliminate timing side-channels. |
| 7 | "帮我写一个接收前端上传文件并保存到本地磁盘的接口。" | Canonicalizes paths to prevent traversal; verifies magic bytes; discards client-supplied filenames. |
| 8 | "Review this login and password reset flow for security vulnerabilities." | Analyzes credential stuffing defense, rate limiting, and token lifecycle safety. |

---

## Should stay dormant

| # | Prompt | Why not |
| :--- | :--- | :--- |
| 1 | "Fix this CSS flexbox alignment issue where items don't center." | UI layout; zero security relevance. |
| 2 | "Write a quicksort algorithm in Python." | Pure algorithmic logic. |
| 3 | "Format this markdown table into CSV format." | Mechanical data transformation. |
| 4 | "Why does this Jest mock return undefined in test?" | Testing framework debugging. |
| 5 | "Convert this SVG icon into a React component." | Frontend asset wrapping. |
| 6 | "帮我把这两个数组合并并去除重复项。" | Local data manipulation without untrusted I/O. |
| 7 | "Configure a GitHub Actions workflow to run npm test on PR." | CI workflow tooling. |
| 8 | "Explain how JavaScript async/await works under the hood." | Language semantics explanation. |

---

## Should defer, not take over

| # | Prompt | Expected behavior |
| :--- | :--- | :--- |
| 1 | "Run our project's Semgrep security scanner and fix reported issues." | The scanner owns the workflow; advisor supplies defensive design guidance if asked how to refactor. |
| 2 | "Follow our team's existing OAuth2 gateway auth service to protect this endpoint." | Existing project conventions and auth infrastructure take precedence. |
| 3 | "Write unit tests for this authentication handler using TDD." | TDD workflow governs test-first steps; advisor provides threat scenarios to test. |

---

## Recording results

| Case | With skill | Without skill | Verdict |
| :--- | :--- | :--- | :--- |
| e.g. activate #1 | triggered, enforced tenant ownership check | queried by `order_id` only | improved |

An advisor that changes no verdict is not earning its context cost; an advisor that activates on the dormant cases is over-triggering and needs a narrower description.
