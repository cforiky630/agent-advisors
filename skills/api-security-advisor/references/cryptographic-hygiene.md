# Engineering Reference: Cryptographic Hygiene & Secret Safety

## Purpose

This reference provides defensive, production-ready engineering standards for password hashing, symmetric encryption, cryptographic randomness, and side-channel timing attack mitigation.

---

## 1. Password Storage & Key Derivation (KDF)

**Core Rule**: Passwords must be hashed using memory-hard, computationally expensive Key Derivation Functions (KDFs). Fast cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512) are completely vulnerable to GPU-based rainbow table and dictionary cracking.

### Production Directives (Event-Loop Safety & Algorithm Selection)
- **Never Block the Event Loop (Async Mandate)**:
  - In single-threaded runtimes (Node.js, Python asyncio), running synchronous KDFs (`bcrypt.hashSync`) blocks the event loop for 200–500ms, creating a trivial Denial-of-Service (DoS) vulnerability.
  - **Always invoke asynchronous/worker-thread KDF APIs**:
    ```typescript
    // VULNERABLE (Blocks entire server for 300ms per request):
    const hash = bcrypt.hashSync(password, 12);

    // DEFENSIVE (Offloads to libuv threadpool):
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    ```
- **Argon2id (Preferred Industry Standard)**:
  - Resists GPU/ASIC acceleration via memory-hardness. Recommended configuration:
  - Memory: 64 MiB (19 MiB for RAM-constrained microservices).
  - Iterations (Time): 3 passes.
  - Parallelism: 1–4 threads.
- **Bcrypt (Battle-tested alternative & 72-Byte Null-Byte Trap)**:
  - Cost factor: Minimum `12`.
  - **The 72-Byte Truncation Bug**: Bcrypt ignores any characters beyond 72 bytes. If supporting long passwords, pre-hash with SHA-256 formatted as **hex**:
    ```typescript
    // Hex encoding prevents raw null-byte (\x00) C-string termination bugs:
    const preHashed = crypto.createHash('sha256').update(password).digest('hex');
    const hash = await bcrypt.hash(preHashed, 12);
    ```
- **Salt Management**:
  - Always generate a cryptographically random salt per user (minimum 16 bytes). Modern libraries (Argon2, bcrypt) handle salt generation and embedding automatically. Never reuse static salts or peppers as a substitute for unique per-user salts.

---

## 2. Symmetric Data Encryption (AEAD)

**Core Rule**: Use Authenticated Encryption with Associated Data (AEAD). AEAD provides confidentiality and guarantees that ciphertext cannot be forged or tampered with without immediate detection.

### Approved Modes
- **AES-256-GCM**: Industry standard authenticated symmetric cipher.
- **ChaCha20-Poly1305**: High-performance AEAD alternative, especially on CPUs lacking hardware AES instructions (e.g., ARM or low-cost microcontrollers).

### Strict Nonce / IV Directives
- **Never Reuse a Nonce with the Same Key**:
  - Reusing a 96-bit (12-byte) initialization vector (IV) in AES-GCM destroys both confidentiality and authenticity.
  - Generate a fresh cryptographically random 12-byte IV for every encryption call:
    ```typescript
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    ```
- **Append IV and Authentication Tag to Ciphertext**:
  - Store resulting ciphertext formatted as: `iv (12B) + auth_tag (16B) + ciphertext`. The IV is public metadata, but must be unique.
- **Never Use ECB Mode**: Electronic Codebook (ECB) mode preserves plaintext byte patterns and leaks data structures.

---

## 3. Cryptographically Secure Randomness (CSPRNG)

### Production Directives
- **Zero Insecure PRNGs in Security Contexts**:
  - Disallowed: `Math.random()`, `rand()`, `random.random()`. Their internal states can be determined from minimal output.
  - Required: OS-backed CSPRNG (`crypto.randomBytes()`, `secrets.token_hex()`, `/dev/urandom`).
- **Use CSPRNG For**: Session IDs, API keys, password reset tokens, OAuth state/PKCE values, and CSRF tokens.

---

## 4. Constant-Time Verification (Eliminating Timing Side-Channels)

**Core Rule**: When comparing sensitive secrets (hashes, signatures, HMACs, reset tokens), standard string equality operators (`===`, `==`, `strcmp`) terminate at the first differing byte. Attackers can measure execution latency to recover secrets byte-by-byte (CWE-208).

### Production Directives
- **Use Constant-Time Comparison Functions**:
  - Node.js: `crypto.timingSafeEqual(bufA, bufB)`
  - Python: `hmac.compare_digest(strA, strB)`
  - Go: `subtle.ConstantTimeCompare(sliceA, sliceB)`
- **Equal Length Pre-condition (Pre-Hashing Pattern)**:
  - Most constant-time functions throw or return false early if lengths differ, leaking length information.
  - *Production Pattern*: Hash both inputs with SHA-256 first to produce fixed 32-byte digests before constant-time comparison:
  ```typescript
  function safeCompare(a: string, b: string): boolean {
    const hashA = crypto.createHash('sha256').update(a, 'utf8').digest();
    const hashB = crypto.createHash('sha256').update(b, 'utf8').digest();
    return crypto.timingSafeEqual(hashA, hashB);
  }
  ```

---

## 5. Secret Management in Code & Runtime

- **Zero Hardcoded Secrets**: Secrets and private keys must never exist in source code, commit history, or client bundles.
- **Runtime Environment Injection**: Inject secrets via environment variables or cloud secret managers (AWS Secrets Manager, HashiCorp Vault).
- **Log Redaction**: Ensure passwords, authorization headers, and credit card numbers are scrubbed from application logs.
