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
| `references/authentication-and-tokens.md` | *NIST SP 800-63B: Digital Identity Guidelines* | NIST | NIST SP 800-63B |
| `references/input-boundary-and-injection.md` | *CWE/SANS Top 25 Most Dangerous Software Weaknesses* | MITRE / SANS | CWE-89, CWE-78, CWE-22, CWE-502, CWE-611 |
| `references/input-boundary-and-injection.md` | *Secure by Design* | Dan Bergh Johnsson, Daniel Deogun, Daniel Sawano (Manning, 2019) | ISBN 978-1617294358 |
| `references/cryptographic-hygiene.md` | *NIST SP 800-38D: Recommendation for GCM Mode* | NIST | NIST SP 800-38D |
| `references/cryptographic-hygiene.md` | *CWE-208: Observable Timing Discrepancy* | MITRE | CWE-208 |
| `references/cryptographic-hygiene.md` | *Designing Secure Software* | Loren Kohnfelder (No Starch Press, 2021) | ISBN 978-1718501928 |

---

## Maintenance Rules

- Whenever an engineering reference under `references/` is modified or added, maintainers must verify that the corresponding entry above reflects the authoritative edition and publisher.
- Reference notes must remain concise, high-density defensive heuristics rather than exhaustive compliance manuals.
