# Session Handoff — 2026-08-16

**Branch:** `claude/production-deployment-confirmed-iswp2h` · **PR:** [#91](https://github.com/MADdegen/MAD-MPP-2.23/pull/91) (draft, all 10 checks green)
**Head:** `96c2ee6` · **Base:** `main` @ `ce1ace4`

> **This is session state, not platform state.** Platform truth lives in
> [`MAD_GAMBIT_MASTER.md`](MAD_GAMBIT_MASTER.md) — this file deliberately does **not** duplicate
> it. Fold anything durable from here into that document and delete this file; the whole point of
> this session was killing exactly this kind of doc sprawl (114 files removed). Don't let it grow back.

---

## 1 · What shipped

| # | Change | Commit |
|---|---|---|
| 1 | Stripped stale Supabase mentions from 5 planning docs | `50d43e6` (merged in PR #80) |
| 2 | Consolidated ~150 planning docs → `docs/MAD_GAMBIT_MASTER.md`; **114 files / ~36.5k lines deleted** | `1909f19` |
| 3 | One master maths doc + one companion; refreshed state against current `main` | `d2051fc` |
| 4 | Re-scoped Octavian workstream; pointed O-V phase at the real deck repo | `7aa70f0` |
| 5 | **CI fix:** agentic compile check now sees missing `.lock.yml` files | `daa5a28` |
| 6 | **Cephalopod creature merge** — one shared nervous system across all mounts + firefly star swarm fed by live platform activity + reduced-motion | `96c2ee6` |

### The CI fix, specifically
`agentic-compile.yml`'s "out of date" step used `git diff --exit-code`, which is **blind to
untracked files**. Neither `agentic-security-review.lock.yml` nor `agentic-quality-review.lock.yml`
exists on `main` — so both AI review gates are **configured but not running**, and the check was
passing green anyway. Fixed with `git add -N` (intent-to-add). Verified by probe: exit 0 before,
exit 1 after.

**Still outstanding from this:** the two `.lock.yml` files must actually be generated
(`gh aw compile`) and committed by a human push or an agent session with real push credentials —
the Actions `GITHUB_TOKEN` is *correctly* forbidden from writing `.github/workflows/`. Until then
the gates don't run, and the check will now (correctly) fail loudly instead of lying.

### Doc layout after consolidation
```
docs/
├── MAD_GAMBIT_MASTER.md          ← platform source of truth (chronology + state + plan)
├── MASTER_MATHS_AND_ALGORITHMS.md ← the one canonical maths doc
├── MATHS_ENGINE_FORMULAS.md       ← its single companion (engine room)
├── PITCH_DECK_VERSION_TRACKER.md
└── HANDOFF_2026-08-16_SESSION.md  ← this file (temporary)
```
Untouched by design: `verify/docs/`, `contracts/`, `master-maths/`, `.claude/`, `.agents/`.

---

## 2 · Decisions needed from you

These block work. Nothing else in this handoff does.

### 2.1 — `@neondatabase/serverless` contradicts ADR-008 🔴
You asked me to `npm install @neondatabase/serverless` and add a `neon()`-based `getData()`.
**ADR-008 (2026-08-05) explicitly evaluated and rejected exactly that**, mandating `pg` Pool +
Route Handlers, and is marked *"Settled. Do not reopen without a new ADR superseding this one."*
It even says: *do not adopt `neon()` anywhere, including inside existing handlers.*

Not actioned. Three ways forward:
- **(a)** Drop it, keep `pg` — the ADR stands. *(my recommendation)*
- **(b)** Write a superseding ADR if the reasoning has genuinely changed.
- **(c)** Use the ADR's own escape hatch: adopt it for *one* edge-latency-sensitive route as an
  explicit exception with its own ADR — never as the default.

Note the install was independently blocked anyway: this sandbox's egress policy 403s
`registry.npmjs.org`.

### 2.2 — Near-miss on real-money surfaces 🔴
`dopamine-engine.tsx` renders some losses as almost-wins (`isNear = !won && roll < 0.58`). On
free-play `madCredits` that's ordinary game feel. On **real `$MADx` stakes** it is the single most
regulated pattern in this space. **Recommendation:** confine it to credits/demo surfaces, make the
boundary explicit in code, never render it against real stakes. Unchanged pending your call.

### 2.3 — Two canon conflicts in the current O-V deck 🟡
`MADdegen/OV-Deck-2026` (2026-07-31) vs repo canon:
- Slides 0 & 7 say **"Wyoming L.C."**; the formation record says **New Mexico**, filed 2026-03-25. A legal-entity fact on an investor slide — needs one definitive answer, not a merge.
- Slide 3 uses **"MAD Upshot"**, banned by canonical brand rules — and the deck is *newer* than the ban, so it was reintroduced.
- ~~Creator Ladder~~ — **resolved, deck is correct.** `node-registry.ts` records a founder sign-off (31 Jul 2026) adopting the tiered ladder over the flat 40%; implemented as `CREATOR_LADDER`. The master doc was the stale one and has been corrected. **Two conflicts remain**, not three.

### 2.4 — Long-standing, carried forward from the archive 🟡
- **$MADx supply.** Canon says 888,888,888 fixed; the deployed Arbitrum One contract is mutable/mint-on-purchase, cap 224,573,096, Pausable. Two candidate addresses in the archive (`0xb61ae772…fd18`, `0x6972370e…151f`). Needs an on-chain check and one written answer.
- **Chain topology.** Work targets Arbitrum One only, but canon restates Nova+One+HyperLiquid as founder-locked and `foundry.toml` still configures `arbitrum_nova`.
- **Token distribution split.** April canon (35/20/15/10/10/10) vs March "vFinal" (45/15/15/15/10).
- **Promote `main` to production** — `vercel.json` has `deploymentEnabled.main = false`; prod is manual.

### 2.5 — Ambiguous ask I never resolved 🟡
You said *"let's look at REACT18, Hono/HonoX + TailwindCSS frontend."* `verify/` is already
Next.js 16 + **React 19.2.1** + Tailwind v4, live. Hono/HonoX appears once in the whole archive, as
a speculative Phase-4 API-gateway idea — not a frontend, not tied to React 18. Never clarified.

---

## 3 · Outstanding work, in the order I'd do it

Full detail — file paths, exit criteria, effort — is in **`MAD_GAMBIT_MASTER.md` Parts III–V and
Workstream B**. Summary only here.

| Phase | What | Effort |
|---|---|---|
| **0** | **`open-pack` fairness bug** — `userNonce` is read from the request body, so pack rarity is grindable by retrying nonces. Also `madxBalance` comes from the body (route's own comment calls the check "decorative"). Independent of VRF, cheapest real win. | 0.5d |
| **1** | **Perceived-performance foundations** — error boundaries, Suspense/skeletons, `next/font`, code splitting (93 components / 19,455 lines ship eagerly), image optimization. Measure LCP/CLS before *and* after or it's worthless. | 2–3d |
| **2** | **Interaction feel** — `useOptimistic` on mutations, haptics on the moments that matter, persisted audio mute (**default off**), focus rings. | 2d |
| **3** | **VRF on Sepolia** — seed-parameterize `openCardPack`/`attemptEvolution`, `MADRandomness.sol` on `VRFConsumerBaseV2Plus`, Foundry tests with a mock coordinator, async pack UX. | 3–5d |
| **4** | **VRF mainnet + random juror selection** in `MADDisputeVoting.sol` (the most defensible non-obvious use). | — |
| **B1** | **Octavian — MOSTLY DONE** (`96c2ee6`). Shared state ✅, firefly star swarm ✅, platform-activity feed ✅, reduced-motion ✅. **Remaining: perps-deck container sizing** (`perp-dials.tsx:714` idiom — `borderRadius: 24`, `clamp(10px,1.4vw,16px)` padding, a `--dial`-style scale var; lift it into `instrument-chrome.ts` rather than copy-pasting a third time). Also unverified in a browser — needs a visual pass. | ~0.5d left |
| **B2** | **O-V deck → exterior interactive experience**, bound to `node-registry` state. Blocked on §2.3. | 4–6d |

**Sequencing constraint that matters:** VRF makes pack-opening asynchronous (request → 3+ block
confirmations → callback). Shipping it onto today's synchronous UI would replace an instant
pack-open with an unexplained freeze. **Phases 1–2 are prerequisites for Phase 3, not parallel.**

### Asked for but deliberately not started
- **"Make the entire platform modular and containerized"** — containerizing a Vercel-native Next.js app is an architectural reversal; I'd want your reasoning before touching it.
- **"Implement the security layers"** — the 8-layer map is consolidated into Master Part II.6; implementing the two genuine gaps (**CSP header**, **ERC-4337 session keys**) is unstarted.

---

## 4 · Environment constraints hit this session

Real, reproducible, and they'll hit the next session too.

| Blocked | Evidence | Consequence |
|---|---|---|
| `registry.npmjs.org` | direct `curl` → **403** (host is in `no_proxy`, so it's egress policy, not the proxy) | No `npm install`. Don't hand-edit `package-lock.json` — CI runs `npm ci` and a fabricated lockfile breaks every check. |
| `vrf.chain.link`, `docs.chain.link` | proxy `EGRESS_BLOCKED` | VRF audit built from search + your contracts. Coordinator addresses / key hashes marked **‹verify›** — read them off live docs before implementing. |
| `*.neon.tech`, TCP 5432 | 403 / unreachable | Agents can't inspect the databases. The 3-DB merge is founder-run or needs a read-only Neon MCP. |
| Cross-org `add_repo` | *"cross-tier adds are not supported"* | Session is scoped to `maddegen`; `The-MDC/*` repos unreachable. |
| v0 MCP server | disconnected | Couldn't query v0 chats (see §5). |

---

## 5 · Two investigations, concluded

### Octavian living-mesh origin — **not v0; Google AI Studio lineage**
Zero v0 fingerprints anywhere (`v0.dev`, `v0.app`, `vusercontent`, "Generated by v0", `open-in-v0`).
What *is* present, consistently: three `metadata.json` files (`verify/`, `master-maths/`, the OV
deck repo) all carrying the AI Studio app-builder schema (`requestFramePermissions` +
`MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`); explicit "AI Studio" sections in `verify/DEPLOY.md`;
`next.config.ts` ("works directly in AI Studio"); `nft-card.tsx` ("per AI Studio NFT Brief §1.2").

Git lineage, all authored by your account: 2026-07-13 Three.js/R3F/**WebGPU** "Master Octavian"
experiment → 2026-08-07 PR #63's 2D-canvas `octavian-mesh.tsx` → `72dccda` static hi-fi orb →
`fb73122` two-axis weave → **`11b8a6f` the living-mesh moment** (three-tier mood system modelled on
**cephalopod chromatophore-over-iridophore skin**) → `bb99269` merged both visuals into
`octavian-creature.tsx` (`compact` / `full` variants).

**Unverified, and the only thing that could overturn this:** v0 chats (MCP disconnected) and the
repos `The-MDC/v0-open-in-v0-023b047d` + `The-MDC/mad-gambit-ui` (cross-org, unreachable). To close
it: start a session with `The-MDC/v0-open-in-v0-023b047d` as the initial source and diff it against
`octavian-creature.tsx`.

### Morpho / Aerodrome — **no such repos**
Morpho: zero matches across ~190 repos. Aerodrome: the lookup required approval and was not run.

---

## 6 · Things a future session will get wrong without this

- **`octavian-mesh.tsx` does not exist.** Merged into `octavian-creature.tsx`. Zoom, two-axis orbit, click-select, pop-out and the mood system **already ship** — don't rebuild them. The gap is per-mount state.
- **The build no longer runs migrations.** `next build` only; migrations are a controlled `npm run migrate:deploy`. Don't set `SKIP_MIGRATIONS` on Vercel.
- **The `$MADx` transfer vulnerability is FIXED.** A stale-tree review reported it open; all seven `madx` routes use `lib/madx-route-auth.ts`. **Do not re-fix it.**
- **The `.agents/` swarm verdicts are static-only.** All four July-01 milestones returned CLEAN, but every shell command in that run timed out — nothing was executed.
- **These are placeholder stubs — do not restore:** `lib/auth/siwe.ts`, `app/api/session-keys/*`, `SessionKeyManager.tsx`, root `middleware.ts`. And do **not** re-add `ai-backend/.../auth.py` — it forks a second auth path.
- **Next 16 renamed `middleware.ts` → `proxy.ts`.**
- **Compliance:** the mechanics stay, the clinical neuroscience framing stays out of anything user- or investor-facing. Internal docs may name them plainly; decks and marketing may not.

---

## 7 · Task ledger

**Done this session:** Supabase cleanup · doc consolidation · maths master+companion · QOL top-12 benchmark · VRF audit · tactical plan · Octavian origin trace · Actions scan + CI fix · **cephalopod creature merge (B1 less container sizing)**.

**Open:**

| # | Item | Type |
|---|---|---|
| 15 | `@neondatabase/serverless` vs ADR-008 | decision (§2.1) |
| 21 | Three O-V deck canon conflicts | decision (§2.3) |
| 16 | React18 / Hono / HonoX ask unclear | clarification (§2.5) |
| 10 | Promote stale production deploy | decision |
| — | Near-miss on real-money surfaces | decision (§2.2) |
| — | Generate + commit the two `.lock.yml` files | task (§1) |
| — | Visual pass on the creature; finish B1 container sizing | task (§3) |
| — | Neon three-database merge | founder-run (Master II.5) |
| — | Phases 0–4 + B1–B2 | build (§3) |

**PR #91 is subscribed** — CI failures and review comments wake the session automatically. A
self check-in is armed hourly until the PR merges or closes.
