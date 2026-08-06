# MAD Gambit — Session Handoff: The Custom Perpetuals (2026-08-06)

**Repo:** `MADdegen/MAD-MPP-2.23` · app in `verify/` (Next.js 16 · React 19 · raw `pg` on Neon · Vercel, root dir `verify`)
**Merged this session:** **#57** → **#58** → **#59**, plus **#60** (founder-side production audit) on top.
**`main` at handoff:** `c7f9b43`

---

## 0 · TL;DR

Three custom perpetual families shipped end to end — **FIVE FACES**, **ZEITGEIST**, **PERPETUAL EPIPHANIES** — from the maths core through persistence, API, front end, the Phase-4 registrar, and the on-chain interlock.

The product decision underneath all of it: **legs, not expiries.** A perp market has no `resolved_at` column and no settle function anywhere in the codebase. Positions roll on a lunar leg (2 synodic months = 59.061d); six legs are THE TURNING, one lunar year.

**The thing to know before launch:** named-individual markets are **live but inert**. They refuse conviction until the Phase-4 gate opens. That is the gate working as designed, not a bug — see §4.

---

## 1 · What shipped

### #57 — the maths core
- `persona-codex.ts` — the five-face axis, three name layers, and the §2 compliance mechanism: no path yields a formatted price without its Codex definition travelling with it.
- `persona-simplex.ts` — exact capped-simplex projection by bisection on the water-filling level (Wang & Carreira-Perpiñán). Entropy, THE DIVERGENCE, implied τ.
- `persona-decompose.ts` — per-face CGARCH permanent/transitory split with the EGARCH leverage term.

### #58 — persistence, API, front end, registrar
- `sql/0012` (8 tables) + `sql/0013` (7 tables) — perp markets, simplex history, slates, succession, positions, portrait keys, registrar queue, replies, complaints, identity map, pause state, readiness.
- `lunar-legs` · `position-exit` · `param-commit` · `trend-slate` · `trend-lifecycle` · `perp-store` · `portrait-vault` · `subject-identity-map` · `registrar-queue` · `portrait-metadata`.
- Routes under `/api/v1/{faces,zeitgeist,epiphany,perps,registrar}`.
- `PersonaPrice`, THE WATERLINE, THE ALMANAC, the Epiphanies catalog, the Registrar transparency panel — all on `/preview`.

### #59 — contracts, auction, ribbon
- `MADPortraitKeyRegistry.sol` + `MADPortrait.sol` — INTERLOCK layer 1.
- `DeployPortrait.s.sol` — INTERLOCK layer 4.
- `sql/0014` + `slot-auction.ts` + `/api/v1/zeitgeist/auction` — the slot auction room.
- `succession-ribbon.tsx` in the Almanac.

### #60 — founder-side hardening (not mine; kept)
`CRON_SECRET` bearer auth on `perps/roll` and `registrar/lapse`; auth + rate-limiting on the succession `persist` path; `lib/bearer-secret.ts`. Correct changes — the two cron routes were reachable unauthenticated, and `persist` wrote to the succession table without a session.

---

## 2 · Decisions that are load-bearing

Do not "fix" these without reading the reasoning first.

| Decision | Why |
|---|---|
| **The exit price locks at REQUEST, not redemption** | Settling at redemption makes the cooldown a free option written by the house: exit on a bad leg, keep the upside if it recovers |
| **Leg boundaries are GLOBAL**, anchored to the lunar epoch | Per-market anniversaries would make THE TURNING a different instant for every slate, and the succession matrix would have nothing to synchronise against |
| **Roll settles, THEN advances**; CGARCH state carries forward | Losing the filter state resets every persistence reading to a cold start — indistinguishable from everyone suddenly being forgiven |
| **Substantiated complaints SETTLE, they don't void** | Voiding erases the gains of holders who read the market correctly, and hands the platform an incentive to void whenever a market runs against it |
| **The succession write path refuses a non-conserving matrix** | A leaky Turning destroys holder value with no other visible symptom |
| **Auction clearing is uniform-price, not pay-as-bid** | Pay-as-bid punishes the bidder who states a slot's honest worth and rewards whoever best models the auction |
| **Auction phase is derived from the clock, never a stored flag** | A flag needs a scheduler; a down scheduler leaves the commit window open into the reveal window, and the seal is worthless |
| **`persistence` is NOT updated on an epiphany catalog re-sync** | It is a live market reading, not catalog metadata — a re-sync must not reset what the book has priced |
| **`subject_ref` is opaque, validated at the boundary** | Never a name, handle or likeness |

---

## 3 · THE INTERLOCK — all four layers, and how each fails

Off-chain data can be crypto-shredded. On-chain data cannot be deleted, ever. Every barrier below exists because of that asymmetry.

| Layer | Barrier | Fails by |
|---|---|---|
| **1 — chain** | `MADPortrait.mintNamed` reverts unless the registry returns a non-zero keyRef. `staticcall` with explicit code-length **and** returndata-length checks | Transaction revert |
| **2 — type checker** | `CiphertextPointer` is branded with an unexported symbol; only `portrait-vault.ts` constructs one, only after a confirmed key write | Compile error |
| **3 — CI** | `lib/interlock.test.ts` asserts named payloads carry no name, persona label or persona value — key set **and** string contents | Red build |
| **4 — deploy** | `DeployPortrait.s.sol` cannot reach the portrait deploy unless the registry is deployed and answering | Script revert |
| **5 — last resort** | `PAUSE_GUARDIAN` halts new conviction platform-wide, separate credential, not timelocked | 503 on every stake path |

Layer 1's defensive read matters more than it looks: a plain `IRegistry(addr).keyRefOf()` against an address with **no code succeeds with empty returndata**. That is the silent failure the whole function exists to refuse.

---

## 4 · The Phase-4 gate — what "live" requires

`/api/v1/registrar/status` reports **NOT LIVE** and named-individual markets refuse conviction until all of:

1. `SUBJECT_MAP_PEPPER` set (HMAC pepper for the identity index — a bare hash of a name is dictionary-attackable and is personal data in disguise).
2. `PAUSE_GUARDIAN_TOKEN` set (separate credential, never the owner key).
3. All six rows in `registry_readiness` marked `complete` **and** `tested` **and** `signed_off_by` — key custody, ciphertext store, registry contract, identity map, legal instruments, tested destruction drill.

A missing row counts as outstanding, so the checklist cannot be passed by deleting from it.

**Also required in production:** a real `KmsAdapter` and a deletable `ObjectStore`. The shipped adapters are local stand-ins; `assertProductionKms` refuses the local one for named subjects, and `assertDeletableStore` refuses IPFS/Arweave-shaped stores.

---

## 5 · Operational notes

- **`/api/v1/perps/roll`** — settles matured legs. Needs `CRON_SECRET`. Idempotent; a double-fire cannot skip a leg or double-crown.
- **`/api/v1/registrar/lapse`** — THE LAPSE. Needs `CRON_SECRET`. Renews held keys whose subject still clears the bar; destroys on TTL expiry, delisting, or renewal failure, and erases the identity binding in the same pass. **If nobody ever calls it again, every payload lapses on schedule** — that is the abandonment case, and it is the design.
- **Auction clearing is currently a manual `POST { action: "clear" }`.** The settlement tail is ~5.9 days at the end of each auction leg, and a late clear is accepted on any auction whose window has closed. Folding it into the roll cron is the obvious next step and is not done.
- **Migrations 0012–0014** apply via `db-migrate.yml` on merge to main. Watch the first run — three land at once.

---

## 6 · Two things this environment could not do

Both are git-proxy limitations, both confirmed by retry, both need a human:

1. **Tag `v2.24-constellation`** on `b49a007` (the #35 merge). `git push origin <tag>` fails with `send-pack: unexpected disconnect while reading sideband packet`, and the GitHub MCP is read-only for tags. Run locally:
   ```
   git tag -a v2.24-constellation b49a007 -m "MAD Gambit v2.24 — Constellation (Sprint 0 close)"
   git push origin v2.24-constellation
   ```
2. **Delete branch `vercel-agent/migrate-middleware-to-proxy`** (`b2d9cf9`) — same sideband failure on delete-ref. Redundant: `main` already carries the identical proxy migration, and merging it would revert PR #49's security fix (its matcher predates #49 and would re-expose every `/api/*` route).

Local verification was also unavailable all session: `npm ci` gets a registry **403** on tarballs, and there is no Foundry toolchain. CI was the only check for both TypeScript and Solidity.

---

## 7 · Bugs found and fixed in-flight

Worth recording because each was caught by a different mechanism:

- **Local KMS adapter handed out its only key reference**, which `sealPortrait` then scrubbed — the first seal zeroed the stored key and every later read failed its auth tag. *Caught by: writing the round-trip test.*
- **`\p{L}` in the identity normaliser** needs a target above es5. *Caught by: type-check.*
- **`vm.prank` consumed by an external call** inside `vm.expectRevert`'s argument, so two access-control tests ran as the test contract. *Caught by: CI forge run.*
- **The auction `cleared` phase was unreachable** — phases summed to exactly one leg against a current-leg-anchored window, so `clear` always 409'd and every bidder's deposit was locked behind a phase that never arrived. *Caught by: Vercel review bot.*
- **`foundry.yml` never gated `contracts/script/**`** even though `forge build` compiles it — INTERLOCK layer 4 was unverified. *Caught by: a docs push tripping `cancel-in-progress`.*
