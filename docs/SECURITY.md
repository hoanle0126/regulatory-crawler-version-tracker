# RegTracker Security & Defense-in-Depth

## 1. Overview

**RegTracker** monitors external, untrusted web destinations and executes automated data extraction pipelines. Because administrators can configure custom source URLs and crawl targets, the application treats all remote inputs and outbound network requests as potentially hostile.

This document details the multi-layered security controls implemented across the codebase.

---

## 2. Server-Side Request Forgery (SSRF) Defenses

The crawler incorporates a strict, dedicated security layer implemented in `packages/crawler-core/src/security/ssrf-guard.ts`.

### 2.1. Protocol Enforcement
- Only `http:` and `https:` schemes are permitted.
- All other protocols (`file:`, `ftp:`, `gopher:`, `dict:`, `data:`, `ldap:`, `php:`) are immediately rejected prior to DNS lookup.

### 2.2. Pre-Resolution IP Blacklisting
Before any HTTP socket connection is established, the target hostname is resolved to its canonical IP addresses via `dns.promises.lookup()`. Both IPv4 and IPv6 addresses are validated against the following denied CIDR ranges:

| Address Range / CIDR | Category | Exploit Prevented |
| :--- | :--- | :--- |
| `127.0.0.0/8` | Loopback IPv4 | Localhost service probing |
| `::1/128`, `::` | Loopback / Unspecified IPv6 | Localhost IPv6 probing |
| `0.0.0.0/8` | "This" host IPv4 | Zero-address binding bypasses |
| `10.0.0.0/8` | RFC 1918 Private Class A | Internal corporate LAN access |
| `172.16.0.0/12` | RFC 1918 Private Class B | Docker internal networks, Kubernetes pods |
| `192.168.0.0/16` | RFC 1918 Private Class C | Local network infrastructure & routers |
| `169.254.0.0/16` | RFC 3927 Link-Local / AWS Metadata | Cloud instance IAM credential theft (`169.254.169.254`) |
| `100.64.0.0/10` | RFC 6598 Shared Address Space | Carrier-grade NAT internal networks |
| `fc00::/7` | RFC 4193 Unique Local IPv6 | Internal IPv6 private routing |
| `fe80::/10` | RFC 4291 Link-Local IPv6 | Local link IPv6 probing |

### 2.3. Redirect Interception & DNS-Rebinding Prevention
- The crawler **never follows redirects blindly**.
- `SafeFetcher` disables automated redirect following in the underlying HTTP client (`redirect: 'manual'`).
- Every redirect response (HTTP 301, 302, 303, 307, 308) is trapped:
  1. The target `Location` header is parsed and resolved relative to the origin.
  2. The redirect counter is checked against `maxRedirects = 5` to prevent infinite redirect loops.
  3. The redirect target URL is **re-validated through `SsrfGuard.validateUrl()`**, ensuring an attacker cannot bypass SSRF filters via an external site redirecting to `http://169.254.169.254`.

### 2.4. Localhost Demo Source Isolation Policy
To allow local offline portfolio demonstrations without weakening production security, an explicit whitelist policy is enforced:
- A local URL (`127.0.0.1` or `localhost`) is accepted **only if** `ALLOW_LOCAL_DEMO_SOURCES=true` AND the port exactly matches the dedicated demo service port (`5101`).
- Arbitrary localhost ports (e.g., PostgreSQL `55432`, Redis `6381`, Backend `4101`, or default `5432`/`6379`) remain strictly blocked under all circumstances.

---

## 3. Crawler Resource Limits & Anti-DoS Protections

- **Response Size Capping:** The HTTP response stream is inspected via `Content-Length` and chunks are measured as they arrive. If an endpoint exceeds the limit (default: 10 MB for HTML, 25 MB for PDF), the stream is aborted immediately (`AbortController.abort()`) with error code `ERR_PAYLOAD_TOO_LARGE`.
- **Request Timeouts:** Default timeout of 15,000ms is strictly enforced per fetch attempt. Slow-drip or hung connections are automatically severed.
- **Per-Domain Rate Limiting:** Crawl schedules enforce minimum crawl intervals and per-source concurrency caps to respect remote servers and prevent accidental denial of service.

---

## 4. Webhook Security & Signatures

All outbound webhook events dispatched to downstream platforms (such as Legal RAG systems) are authenticated via HMAC-SHA256 signatures:

1. **Header:** `X-RegTracker-Signature: sha256=<hex_digest>`
2. **Algorithm:**
   ```typescript
   const expectedSignature = 'sha256=' + crypto
     .createHmac('sha256', secret)
     .update(payloadString, 'utf8')
     .digest('hex');
   ```
3. **Timing-Safe Comparison:** Receiving systems and internal tests use `crypto.timingSafeEqual` to prevent timing attacks.
4. **Secrets Management:** Webhook signing secrets are never exposed in logs or API responses and can be regenerated on demand.

---

## 5. Authentication, RBAC & API Hardening

- **Password Hashing:** Passwords are encrypted using `bcrypt` with salt rounds = 10.
- **JWT Tokens:** Stateless JWT tokens signed with SHA-256 secrets enforce expiration timeouts.
- **Role-Based Authorization:**
  - `ADMIN`: Full management of regulatory sources, schedule edits, manual crawl triggers, webhook endpoints, and version acknowledgments.
  - `VIEWER`: Read-only access to documents, versions, diffs, changes, and audit logs. All state-mutating endpoints reject `VIEWER` access with HTTP 403 Forbidden.
- **Defensive Parameter Validation:**
  - All pagination parameters (`page`, `pageSize`) are clamped between 1 and 100.
  - SQL injection patterns are negated by Prisma parameterization and strict type parsing.
  - Cron expressions are verified using `cron-parser` with a minimum interval restriction to prevent resource exhaustion.
- **Security Headers:** HTTP response headers configured with `helmet` (Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
