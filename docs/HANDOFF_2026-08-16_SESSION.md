# Handoff — start here

**Last updated:** 2026-08-16 · **Status:** PR #91 **merged** to `main` (rebase, 8 commits preserved).
**`main` @ `07a23e7`.** No PR open, no CI running, no scheduled check-ins. Clean slate.

> **Read order for a new session:** this file first (what's outstanding and who can act), then
> [`MAD_GAMBIT_MASTER.md`](MAD_GAMBIT_MASTER.md) for platform truth — stack, canonical numbers,
> security map, and the full step-by-step plans. This file is session state and is meant to be
> deleted once its contents are either done or folded into the master doc. The last session
> deleted 114 planning docs to stop exactly this kind of sprawl; don't let it grow back.

---

## 1 · Where things stand

Merged and live on `main`:

| Area | State |
|---|---|
| **Docs** | ~150 planning docs consolidated into `MAD_GAMBIT_MASTER.md`. 114 files / ~36.5k lines removed, inbound links repaired. |
| **Maths** | Exactly one master (`MASTER_MATHS_AND_ALGORITHMS.md`) + one companion (`MATHS_ENGINE_FORMULAS.md`). Do not create a third. |
| **Octavian** | One creature across all mounts (`octavian-creature.tsx` + `lib/octavian-state.ts`): shared mood/orbit/zoom/selection, firefly star swarm, live platform-activity feed, reduced-motion. |
| **CI** | 11 checks. `actions/checkout` on v6. Agentic-compile false-green fixed. |
| **Repo** | Verified complete: working tree fully committed; `.gitignore` excludes only secrets, Vercel link artifacts and build products. |

**Verified green at merge:** Type-check, Lint, Build, Unit tests, Route-guard, guard, Secret scan,
Dependency review, forge build + test, Slither, Vercel Preview — plus both Vercel previews Ready.

**But green ≠ done.** Lint, Slither and Dependency Review are **report-only** (Slither has ~135
untriaged findings — green means "ran"). Nothing blocks merge until branch protection requires
these checks on `main`. And the Octavian creature **merged without any human ever looking at it**.

---

## 2 · Do these first

### 2.1 — Visual pass on the Octavian creature 🔴 *it's live and unreviewed*
It compiles, lints, type-checks, builds and passes tests. None of that catches a canvas that
renders wrong. Look at `/octavian`, the `/preview` inline mesh, and the desktop corner HUD.

Three tuning constants, all one-liners in `components/octavian-creature.tsx`:
- `bloomR` — bloom scale. Most likely too generous at HUD size, where the orb is small.
- `reach` — diffraction-spike length. Watch for "noise" rather than "star".
- `swarm` (in the draw loop) — firefly drift amplitude. Should read alive, not jittery.

Also confirm `prefers-reduced-motion` actually pins the swarm.

### 2.2 — `open-pack` fairness bug 🔴 *live, exploitable, half a day*
`verify/app/api/v1/cards/open-pack/route.ts` reads `userNonce` **from the request body** (default
`Math.random()`), so pack rarity is grindable by retrying nonces. Derive it server-side from
`auth.owner` + a persisted per-wallet pack counter. Same file: the `madxBalance` check also reads
from the body — the route's own comment calls it "decorative". Either wire it to a real
server-side balance or delete it so it stops implying a guarantee. Add a regression test asserting
two identical client nonces don't produce identical rarities.

---

## 3 · Decisions only you can make

| Item | The tension |
|---|---|
| **`@neondatabase/serverless`** | You asked to install it + add a `neon()` helper. **ADR-008 (2026-08-05) explicitly evaluated and rejected exactly that**, mandates `pg` Pool + Route Handlers, and is marked *"Settled. Do not reopen without a new ADR superseding this one."* Options: (a) drop it, ADR stands — **my recommendation**; (b) write a superseding ADR; (c) use the ADR's own escape hatch — one edge-latency-sensitive route, its own ADR, never the default. |
| **Near-miss on real-money surfaces** | `dopamine-engine.tsx` renders some losses as almost-wins (`isNear = !won && roll < 0.58`). Ordinary game feel on free-play `madCredits`; on real `$MADx` stakes it is the single most regulated pattern in this space. Recommendation: confine to credits/demo, make the boundary explicit in code. Unchanged pending your call. |
| **Promote `main` to production** | `vercel.json` sets `git.deploymentEnabled.main = false`; production deploys are manual. |
| **`$MADx` supply** | Canon says 888,888,888 fixed. The deployed Arbitrum One contract is mutable/mint-on-purchase, cap 224,573,096, Pausable. Two candidate addresses in the archive (`0xb61ae772…fd18`, `0x6972370e…151f`). Needs an on-chain check and one written answer. |
| **Chain topology** | Work targets Arbitrum One only, but canon restates Nova + One + HyperLiquid as founder-locked and `contracts/foundry.toml` still configures `arbitrum_nova`. |
| **Token distribution split** | April canon (35/20/15/10/10/10) vs March "vFinal" (45/15/15/15/10). |
| **O-V deck — 2 canon conflicts** | `MADdegen/OV-Deck-2026` says **"Wyoming L.C."** (slides 0, 7) against a **New Mexico** formation record filed 2026-03-25 — a legal-entity fact on an investor slide. And slide 3 reintroduces **"MAD Upshot"**, which canon bans; the deck is *newer* than the ban. *(A third conflict — the Creator Ladder — turned out to be the master doc's error, not the deck's; already corrected.)* |
| **React18 / Hono / HonoX** | Never clarified. `verify/` is already Next.js 16 + React **19.2.1** + Tailwind v4, live. Hono/HonoX appears once in the whole archive as a speculative Phase-4 API-gateway idea — not a frontend, not tied to React 18. |
| **Containerizing the platform** | Asked for, deliberately not started: an architectural reversal for a Vercel-native Next.js app. I'd want your reasoning first. |

---

## 4 · Blocked on access no agent has

| Item | Blocker |
|---|---|
| **Neon three-database merge** | `mad-mpp-2-23-postgres` (target), `Neon-DB-MADMPP`, `neon-sky-park`. Ordered procedure + read-only inspection SQL in **Master Part II.5**. Agents cannot reach `*.neon.tech` (403) or TCP 5432. Until this completes there is **no single source database**, so "sync the DBs" has no well-defined target. Correct sequence: merge → `npm run schema:verify` → commit any drift as `verify/sql/0015_*.sql`. Schema-as-code is already complete: 14 migrations + `schema-verify.mjs` checking the ledger, pgvector and 39 named tables. |
| **Generate the two `.lock.yml` files** | `gh aw compile`, then commit `agentic-security-review.lock.yml` + `agentic-quality-review.lock.yml`. Until then **both AI review gates are configured but never run**. The Actions `GITHUB_TOKEN` is *correctly* forbidden from writing `.github/workflows/` — needs a human push or a session with real push credentials. |
| **eslint / eslint-config-next / @types/node realignment** | `eslint-config-next` is pinned at **15.4.5** while `next` resolves to **16.2.9** (and it's the only dep without a caret); `eslint` is **8.x, EOL** — config 16.x wants ESLint 9 + flat config, so those two move together; `@types/node` is **20.x** against `engines.node: 22.x`. Needs a lockfile regen — the sandbox 403s the npm registry, and hand-editing `package-lock.json` breaks `npm ci` on every job. Because Lint is report-only, the stale config is silently under-checking a Next 16 codebase rather than failing. |
| **Founder-gated ops** | Rotate/confirm `NEON_API_KEY` · attach `madgambit.io` · GitHub Advanced Security toggles · push `v2.24-constellation` · Phase-4 named-subject gate (KMS choice, `MADPortraitKeyRegistry` deploy, 6 signed `registry_readiness` rows). |

---

## 5 · Build queue, in dependency order

Full detail — file paths, exit criteria — in **`MAD_GAMBIT_MASTER.md` Parts III–V + Workstream B**.

| Phase | Item | Effort |
|---|---|---|
| **0** | `open-pack` fairness bug (§2.2) | 0.5d |
| **B1-rest** | Octavian perps-deck container sizing — adopt the `perp-dials.tsx:714` idiom (`borderRadius: 24`, `clamp(10px,1.4vw,16px)` padding, a `--dial`-style scale var) and lift it into `lib/instrument-chrome.ts` rather than copy-pasting a third time. Plus the visual pass (§2.1). | 0.5d |
| **1** | Perceived-performance foundations: `error.tsx` + `global-error.tsx`, `loading.tsx`/Suspense + skeletons, `next/font`, `next/dynamic` code splitting (93 components / 19,455 lines ship eagerly today), image optimization. **Measure LCP/CLS before and after or it's worthless.** | 2–3d |
| **2** | Interaction feel: `useOptimistic` on mutations, haptics on the moments that matter, persisted audio mute (**default off**), focus rings (only 3 `focus-visible` vs 92 `aria-`). | 2d |
| **3** | VRF on Sepolia: seed-parameterize `openCardPack`/`attemptEvolution`, `contracts/src/MADRandomness.sol` on `VRFConsumerBaseV2Plus`, Foundry tests with a mock coordinator, async pack UX. Coordinator address + key hash marked **‹verify›** — read off live Chainlink docs, they were egress-blocked here. | 3–5d |
| **4** | VRF mainnet + **random juror selection** in `MADDisputeVoting.sol` (the most defensible non-obvious use — removes "who resolves this market" as a manipulation surface). | — |
| **B2** | O-V deck → exterior interactive experience, bound to `node-registry` state. Source is the **`MADdegen/OV-Deck-2026` repo** (`src/slidesData.ts`, structured, plus 8 ready-built interactive components) — *not* the older HTML export. Blocked on §3's deck conflicts. | 4–6d |
| **—** | Security gaps: **CSP header** and **ERC-4337 session keys** — the two genuine holes in the 8-layer map. | — |
| **—** | Promote Lint / Slither / Dependency Review from report-only to blocking, once their backlogs are worked. | — |
| **—** | Carried from the repo: THE WIRE demo-row · raw-hex design-token scrub (~82 values, 5 panels) · 4 dead components · slot-auction clearing is manual. | — |

**Sequencing constraint:** VRF makes pack-opening asynchronous (request → 3+ confirmations →
callback). Shipping it onto today's synchronous UI replaces an instant pack-open with an
unexplained freeze. **Phases 1–2 are prerequisites for Phase 3, not parallel work.**

---

## 6 · Environment constraints — these will hit the next session too

| Blocked | Evidence | Consequence |
|---|---|---|
| `registry.npmjs.org` | direct `curl` → **403** (host is in `no_proxy`, so it's egress policy, not the proxy) | No `npm install`, no local typecheck. **Never hand-edit `package-lock.json`** — CI runs `npm ci`. |
| `vrf.chain.link`, `docs.chain.link` | proxy `EGRESS_BLOCKED` | VRF constants marked **‹verify›** must be read off live docs. |
| `*.neon.tech`, TCP 5432 | 403 / unreachable | No agent can inspect or merge the databases. |
| `github.com` (WebFetch) | `EGRESS_BLOCKED` | Can't check action release notes — why `setup-node@v4`, `upload-artifact@v4`, `dependency-review-action@v4` were left alone. WebSearch still works. |
| Cross-org `add_repo` | *"cross-tier adds are not supported"* | Session scoped to `maddegen`; `The-MDC/*` repos unreachable. |
| v0 MCP server | disconnected | Couldn't query v0 chats (§7). |

---

## 7 · Things a future session will get wrong without this

- **`octavian-mesh.tsx` does not exist.** Merged into `octavian-creature.tsx` (`compact`/`full` variants). Zoom, two-axis orbit, click-select, pop-out, mood system, shared state and the firefly swarm **all already ship** — don't rebuild them.
- **The build no longer runs migrations.** `next build` only; migrations are a controlled `npm run migrate:deploy`. Don't set `SKIP_MIGRATIONS` on Vercel.
- **The `$MADx` transfer vulnerability is FIXED.** A stale-tree review reported it open; all seven `madx` routes use `lib/madx-route-auth.ts`. **Do not re-fix it.**
- **The `.agents/` swarm verdicts are static-only.** All four 2026-07-01 milestones returned CLEAN, but every shell command in that run timed out — nothing was ever executed.
- **Placeholder stubs — do not restore:** `lib/auth/siwe.ts`, `app/api/session-keys/*`, `SessionKeyManager.tsx`, root `middleware.ts`. Do **not** re-add `ai-backend/.../auth.py` — it forks a second auth path.
- **Next 16 renamed `middleware.ts` → `proxy.ts`.**
- **Creator Ladder (28.8/40/60% by status) is canon**, not the flat 40% — founder sign-off 31 Jul 2026, recorded in `verify/lib/node-registry.ts`, implemented as `CREATOR_LADDER`.
- **Octavian's origin is Google AI Studio lineage, not Vercel v0.** Zero v0 fingerprints anywhere; three `metadata.json` files carry the AI Studio app-builder schema. Unverified only because v0 chats and `The-MDC/v0-open-in-v0-023b047d` were unreachable — to close it, start a session with that repo as the initial source and diff against `octavian-creature.tsx`.
- **Compliance:** the mechanics stay, the clinical neuroscience framing stays out of anything user- or investor-facing. Internal docs may name them plainly; decks and marketing may not.
- **Morpho / Aerodrome:** no such repos. Morpho returned zero across ~190; the Aerodrome lookup needed approval and never ran.
