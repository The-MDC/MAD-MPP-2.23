# MAD Gambit — Security Layers (Source of Truth)

Reconstructed 2026-07-26 from the current tree, git history, the governance
repo (`MADHATs-Claude-Enhancement/.claude`), and the Google Drive doc set.
This is the canonical map of the platform's defense-in-depth. When a layer
changes, update this file in the same PR.

> Status legend: ✅ present & wired · 🟡 present but not enforcing · 🔴 deleted / missing

---

## 1. Edge / HTTP headers — ✅
Request-level hardening before any handler runs.
- `verify/middleware.ts` — edge middleware (route/session gating).
- Security headers in `vercel.json` (root) and `verify/vercel.json`:
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- **Gap:** no explicit `Content-Security-Policy` yet — candidate hardening.

## 2. Wallet authentication (SIWE / EIP-4361) — ✅
Proves control of a wallet before privileged actions.
- `verify/app/api/v1/auth/nonce/route.ts` — issues a single-use nonce.
- `verify/app/api/v1/auth/verify/route.ts` — verifies the signed message.
- `verify/lib/siwe-verify.ts` — verification logic.
- `verify/components/auth-modal.tsx` — Tier-1 social + wallet entry.

## 3. Session & secrets — ✅
- `verify/lib/session.ts` — session issuance/validation (`SESSION_SECRET`).
- Guest access gate — `GUEST_USER` / `GUEST_PASS`.
- Cron authenticity — `CRON_SECRET` on scheduled endpoints.
- Secret inventory & rotation policy: see `SECURITY.md` → Secret Management.

## 4. Rate limiting — ✅
- `verify/lib/rate-limit.ts` — throttles public endpoints (anti-abuse / DoS).
- **Check:** confirm every public `app/api/**` route applies it.

## 5. Domain guards — Shield — ✅
Application-level risk controls for the Shield product.
- `verify/sql/0002_shield.sql`, `verify/lib/shield.ts`,
  `verify/app/api/v1/shield/{quote,opt-in,positions/[wallet]}/route.ts`.

## 6. Smart-contract security — ✅ (analysis 🟡)
- Contracts in `contracts/src` (`MADMarketFactory`, `MADOptimisticOracle`,
  `MADShieldVault`, staking, etc.), OpenZeppelin under `contracts/lib`.
- `forge build + test` gates behaviour; **Slither** adds static analysis
  (reentrancy, unchecked calls, arbitrary-send, access control).
- External audit vendor on file: **Hacken.io** (Drive) — engage before mainnet.

## 7. Supply-chain / SAST (CI) — 🟡 rebuilding
Added/repaired in the current work. Enforcement status:

| Gate | Workflow | Status | To make blocking |
| ---- | -------- | ------ | ---------------- |
| Secret Scan (TruffleHog) | `secret-scan.yml` | ✅ enforcing | — |
| Slither | `foundry.yml` | 🟡 report-only | Triage the 135 findings on `src/`, then drop `continue-on-error` |
| Dependency Review | `dependency-review.yml` | 🟡 report-only | Enable Dependency Graph + GHAS, then drop `continue-on-error` |
| Lint (eslint) | `ci.yml` | 🟡 report-only | Realign `eslint-config-next` to Next 16, regen lockfile, verify clean |

## 8. Governance / review process — ✅ (lives in another repo)
- `MADHATs-Claude-Enhancement/.claude/skills/ecc/security-review.md` — the review skill.
- `MADHATs-Claude-Enhancement/.claude/rules/common-security.md` — mandatory checklist.
- `MADHATs-Claude-Enhancement/.claude/commands/security.md` — `/security` command.
- Applied via the Pre-Deployment Checklist in `SECURITY.md`.

---

## Deleted files in history — assessed, NOT for restoration

A full-history scan (2026-07-26) shows the "missing security" is an illusion of
deleted *files*, not lost *layers*. Restoring any of these would regress the
repo. Verdicts:

| File(s) | Max size ever | Verdict |
| ------- | ------------- | ------- |
| `verify/lib/auth/siwe.ts` | 19 B | **Placeholder stub, never a real impl.** Superseded by `verify/lib/siwe-verify.ts`. Do not restore. |
| `verify/app/api/session-keys/route.ts` | 65 B | **Placeholder stub.** AA session keys are a future *build*, not a restore. |
| `verify/app/components/SessionKeyManager.tsx` | 94 B | **Placeholder stub.** Same as above. |
| root `middleware.ts` | 81 B | **Placeholder stub**, removed as "broken". Live middleware is `verify/middleware.ts`. Do not restore. |
| `ai-backend/app/routes/auth.py` (+ `tests/test_siwe_auth.py`) | 136 / 156 lines (real) | **Real, but deliberately migrated** to `verify/app/api/v1/auth/*` (commit `fb42450`). The current Next stack is stronger (rate-limited, fails closed without `SESSION_SECRET`). Do not re-add — it would fork a second, conflicting auth path. |

**Genuine gaps — build fresh, do not "restore":**
- **AA session keys (ERC-4337)** — only ever a placeholder. A net-new feature
  per SystemState v2 (Alchemy AA-SDK, modular-account / light-account). Scope
  it as a fresh build with its own security review, not a history checkout.
- **`Content-Security-Policy` header** (Layer 1 gap).

---

## Enforcement roadmap (the multiplier)

None of the CI gates block a merge until **branch protection** requires them.
1. Enable branch protection on `main` → require: Type-check, Unit tests, Build,
   Placeholder Guard, Secret Scan.
2. Enable Dependency Graph + GitHub Advanced Security → flip Dependency Review to enforcing.
3. Triage Slither `src/` findings → flip Slither to enforcing.
4. Realign eslint for Next 16 → flip Lint to enforcing.
5. Add a `Content-Security-Policy` header (Layer 1 gap).
6. Build AA session keys (ERC-4337) fresh, with a dedicated security review —
   not a history restore (the deleted files were placeholders; see above).

## Sources reconciled
- **Current tree** (`verify/`, `contracts/`) — layers 1–6.
- **Git history** — the three deleted layers.
- **Governance repo** — layer 8.
- **Google Drive** — Hacken.io audit doc (layer 6); `SystemState v2` and the
  migration zips are **not yet mined** and may hold additional detail / the
  deleted code intact. The two Drive `THREAT_MODEL.md` files are generic `qs`
  library templates — **not** MAD Gambit's, excluded.
