# Sources & Provenance: API Security Advisor

This document provides formal bibliographic attribution, copyright provenance, and standard mapping for `api-security-advisor`.

> **Audience**: Humans, open-source auditors, and maintainers.  
> **Runtime Note**: This file is intentionally omitted from `SKILL.md` routing so that AI agents do not consume context tokens loading it during routine task execution.

---

## Legal Notice & Attribution Policy

1. **Independent Distillations**: The engineering summaries located in `references/*.md` are independently written, structural distillations of open industry standards and security engineering practices. They are **not** verbatim reproductions, scans, or derivative adaptations of proprietary texts.
2. **Trademarks & Copyrights**: All standard names, RFC specifications, catalog numbers, and author names belong entirely to their respective copyright holders, standards bodies (OWASP, IETF, NIST, MITRE), and publishers.
3. **No Affiliation**: This open-source project is not affiliated with, sponsored by, or endorsed by any of the authors, publishers, or standards organizations referenced below.

---

## Canonical Standards & Reference Mapping

| Reference File | Primary Standard / Canonical Source | Governing Body / Author | Identifier / Link |
| :--- | :--- | :--- | :--- |
| `references/owasp-api-security-top10.md` | *OWASP API Security Top 10 (2023 Release)* | OWASP Foundation | https://owasp.org/API-Security/ (API1–API10, CWE-918) |
| `references/owasp-api-security-top10.md` | *Application Security Verification Standard (ASVS 4.0)* | OWASP Foundation | https://owasp.org/www-project-application-security-verification-standard/ |
| `references/authentication-and-tokens.md` | *RFC 7519: JSON Web Token (JWT)* | IETF | RFC 7519 |
| `references/authentication-and-tokens.md` | *RFC 9068: JSON Web Token (JWT) Profile for OAuth 2.0* | IETF | RFC 9068 |
| `references/authentication-and-tokens.md` | *NIST SP 800-63B-4 (2025): Digital Identity Guidelines* | NIST | https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver |
| `references/input-boundary-and-injection.md` | *CWE/SANS Top 25 Most Dangerous Software Weaknesses* | MITRE / SANS | CWE-89, CWE-78, CWE-22, CWE-502, CWE-611 |
| `references/input-boundary-and-injection.md` | *Secure by Design* | Dan Bergh Johnsson, Daniel Deogun, Daniel Sawano (Manning, 2019) | ISBN 978-1617294358 |
| `references/cryptographic-hygiene.md` | *NIST SP 800-38D: Recommendation for GCM Mode* | NIST | NIST SP 800-38D |
| `references/cryptographic-hygiene.md` | *CWE-208: Observable Timing Discrepancy* | MITRE | CWE-208 |
| `references/cryptographic-hygiene.md` | *Designing Secure Software* | Loren Kohnfelder (No Starch Press, 2021) | ISBN 978-1718501928 |

---

## Maintenance Rules

- For substantive reference changes, keep the source attribution accurate. Check an edition when its differences affect the recommendation or an explicit conformance claim; preserve the applicable project-pinned version. Editorial edits and stable principles do not require a search for the newest publication.
- Reference notes must remain concise, high-density defensive heuristics rather than exhaustive compliance manuals.

## Content Verification (2026-11-05)

- Password requirements: SP 800-63B-4 section 3.1.1.2 distinguishes single-factor (minimum 15 characters) from password use only within MFA (minimum 8). Its maximum-length recommendation is at least 64, without truncation. State the applicable edition for a conformance claim; investigate a superseding revision only when the project targets it or its differences matter.
- Browser session scope: [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) recommends narrow cookie Domain/Path scope. Host-only cookies are the default; sibling subdomains do not automatically require a parent Domain.
- Token versioning is a stateful application pattern, not an RFC-mandated stateless revocation mechanism. Its cache freshness and revocation granularity require explicit design.

Password-KDF input and migration guidance was checked against the [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) on 2026-11-05: bcrypt input limits and password-shucking risks require a reviewed migration, not automatic plain-hash pre-processing.
