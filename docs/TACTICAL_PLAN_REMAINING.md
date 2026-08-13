# MAD GAMBIT — THE REMAINING TACTICAL PLAN (v2)
## Master Build v3.1 sprint ladder ⊕ Claude Code Handoff Stories 1–7 ⊕ Optimizations/Env Audit v1 ⊕ **the custom perpetual families**
### 06 Aug 2026 · Reconciled against `main` at `c7f9b43` — every status below was checked against the tree, not carried forward

> Precedence: §DELTA founder amendments → this doc → Master Build v3.1 → Omnibus D12–D15.
> Every story = one PR = one agent session, per Part V protocol. Canon Lock + Pixel
> Constitution are pasted into every story prompt.

---

## 0 · WHAT CHANGED SINCE v1 (02 Aug)

v1 was written before the custom perpetual workstream existed. Four PRs merged between
03 and 06 Aug that v1 does not describe at all, and **that workstream is now the largest
body of code in the app**. It is added below as PHASE P.

The correction that matters most for planning: **Sprint 1 did not advance.** Exactly one
of its eight stories is done (B3), and it got done because the perp families needed it.
Anyone reading v1 would reasonably have assumed the ladder was progressing. It was not —
a different ladder was.

| v1 said | Actual (verified against `main`) |
|---|---|
| Sprint 0 closes on A1+A2 | A1 ✅ merged (`b49a007`). **A2 never fired** — no `v2.24-constellation` tag exists |
| B3 migrations-as-code scheduled | ✅ **Done.** `verify/sql/NNNN_*.sql` + `migrate.mjs` + `db-migrate.yml`. Path differs from v1's `db/migrations/` — same mechanism, and console-paste is retired |
| B0–B2, B4–B7 sequenced for Sprint 1 | ❌ **Untouched**, except B4 partial. Verified: no `/story`, no `/engine`, no `/portal`, no manifest, no `wire-sources.ts`, no `remotePatterns`, no Playwright, no raw-hex gate |
| (nothing) | **PHASE P shipped** — #57, #58, #59, plus #60 hardening |

---

## PHASE A — SPRINT 0 CLOSE

- **A1 ✅ — PR #35 merged** at `b49a007`. (OV-Deck #1 is a separate repo; not verifiable from the app session.)
- **A2 🔴 — Tag `v2.24-constellation` + handoff doc.** The handoff doc is now written
  (`docs/HANDOFF_2026-08-06_PERPS.md`). **The tag is BLOCKED and needs a human**: the git
  proxy fails tag pushes with `send-pack: unexpected disconnect while reading sideband
  packet`, and the GitHub MCP is read-only for tags. Run locally:
  ```
  git tag -a v2.24-constellation b49a007 -m "MAD Gambit v2.24 — Constellation (Sprint 0 close)"
  git push origin v2.24-constellation
  ```
- **A3 · A4 · A5 — founder-side, unchanged.** QA click-pass, `NEON_API_KEY` rotation, and
  the three Vercel dashboard fixes (preview password protection, `madgambit.io` attachment,
  the `live: false` toggle).

---

## PHASE P — THE CUSTOM PERPETUAL FAMILIES *(new in v2; not in the v3.1 ladder)*

Shipped 05–06 Aug. Full detail in `docs/HANDOFF_2026-08-06_PERPS.md`; sheets in
`docs/FIVE_FACES_Product_Sheet.md` and `docs/ZEITGEIST_Product_Sheet.md`.

**P1 ✅ · Maths core (#57).** Codex, exact capped-simplex projection, permanent/transitory
decomposition, THE DIVERGENCE.

**P2 ✅ · Persistence, API, front end, registrar (#58).** `sql/0012` + `sql/0013`, ten new
libs, routes under `/api/v1/{faces,zeitgeist,epiphany,perps,registrar}`, and five surfaces
on `/preview` — PersonaPrice, THE WATERLINE, THE ALMANAC, the Epiphanies catalog, the
Registrar transparency panel.

**P3 ✅ · Contracts, auction, ribbon (#59).** `MADPortraitKeyRegistry.sol` +
`MADPortrait.sol` (INTERLOCK L1), `DeployPortrait.s.sol` (L4), `sql/0014` + the slot
auction room, the succession ribbon.

**P4 ✅ · Production hardening (#60, founder-side).** `CRON_SECRET` on the two cron routes,
auth + rate-limit on succession `persist`.

### P5 🔴 · THE PHASE-4 GATE — the only thing standing between this and named subjects

Named-individual markets are **live but inert**. `/api/v1/registrar/status` reports NOT
LIVE, and every stake path refuses them, until:

1. `SUBJECT_MAP_PEPPER` set — *founder / infra*
2. `PAUSE_GUARDIAN_TOKEN` set, on a key that is **not** the owner key — *founder / infra*
3. All six `registry_readiness` rows `complete` **and** `tested` **and** signed off — *founder + counsel*
4. A real `KmsAdapter` (HSM-backed, FIPS 140-2 L3) and a **deletable** object store injected — *infra*
5. `MADPortraitKeyRegistry` deployed and answering on the target chain — *deploy*

Nothing in the app is blocked on this. Only named subjects are. Institutional, brand,
model and index subjects trade today.

### P6 · Remaining perp work, in priority order

- **P6.1 — Auto-clear the slot auction.** Clearing is a manual `POST { action: "clear" }`
  today. It belongs in the same cron as `/api/v1/perps/roll`. Small, and it removes a
  standing operational obligation.
- **P6.2 — The registrar service internals.** The triage lanes exist as pure functions and
  the queue is persisted, but the LLM-judge lane has no implementation behind it.
- **P6.3 — Portrait mint wiring.** The contracts exist; nothing in the app calls them yet.
  Gated on P5 regardless.
- **P6.4 — ERC-1155 positions, ERC-5192 attestations, ERC-6551 accounts.** L1/L3/L4 of the
  tradeable stack. Transfer stays **closed at launch** per §9 — closed-to-open is
  reversible, open-to-closed is not.

---

## PHASE B — SPRINT 1 · CONVERGENCE + FOUNDATION

Sequence unchanged from v1. Statuses corrected.

**B0 🔴 — S1.0 · Env & settings hardening.** Not started. Verified absent: `images.remotePatterns`
in `next.config` (the reason the wire cards still use raw `<img>`), and none of
`NEXT_PUBLIC_SITE_URL` / `WIRE_LIVE` / `FEATURE_FLAG_GAMBIT_NODES` / `LUNAR_PHASE_OVERRIDE`
are referenced anywhere in the tree.
↳ **v2 addition:** the env checklist must now also carry `SUBJECT_MAP_PEPPER`,
`PAUSE_GUARDIAN_TOKEN` and `CRON_SECRET` (P5, and #60 depends on the last one).

**B1 🔴 — S1.2 · `/story` route.** Absent.

**B2 🔴 — S1.3 · Datahouse fold.** `/engine` and `/portal` both absent.

**B3 ✅ — N3 · Migrations-as-code.** Done, and proven: migrations `0001`–`0014` are applied
by `db-migrate.yml` on merge to main. Console-paste is retired.
↳ *Outstanding within B3:* N4 — confirm PR-close Neon branch deletion actually fires.

**B4 🟡 — S1.4 · Hub consolidation + theme unification.** Partial: `/` redirects to
`/preview`, but that is a redirect and not the promotion the story specifies, and
`/mpp2.23` is still a live route. **Still blocked on the founder naming the second-theme
repo** before anything gets sunset.

**B5 🔴 — S0.4b + VIII.5 · Design-debt pass.** No raw-hex gate, no Playwright baseline.
↳ **v2 note:** five new surfaces landed in PHASE P without a visual baseline, so the
snapshot set has grown before it was ever taken.

**B6 🔴 — S1.8 · THE WIRE.** No `wire-sources.ts`, no `cron/wire-ingest`. **Still blocked
on `SCOPE_THE_WIRE_v1.md` being uploaded** — W2–W6 will not be guessed.

**B7 🔴 — S1.7 · PWA.** No manifest, no service worker.

**Sprint 1 deploy gate (unchanged):** one origin serves hub+story+engine+portal · PWA
installs · migrations idempotent-rerun clean · the wire serves live headlines with DEMO as
fallback only · env checklist closed.

---

## PHASE C — SPRINTS 2–12

Unchanged from v1 in sequence and acceptance, with the same corrections applied:
Fibonacci house physics (233/144/89ms) · ShieldPremiumWidget evolves rather than duplicates
· StakingTiersPanel is the **4-tier eights ladder** · FeeExplainer extends to every surface
· Reactor Ring 2 and P2P listing share both follow the **Creator Ladder 28.8–60%** · S11.2
gates now include the raw-hex gate and visual-regression diff staged in B5 · Part VI maths
at Y3 base **$139.6M** × 8× ≈ **$1.1B**.

↳ **v2 addition:** PHASE P introduced maths that the Sprint 2–12 surfaces do not yet know
about — the lunar leg grid, THE DIVERGENCE, the succession matrix. When S2.x touches house
physics or S3.x touches the shield, check whether the perp surfaces need the same treatment
rather than diverging silently.

---

## OPEN ITEMS FOR THE FOUNDER

Ordered by what unblocks the most.

1. **Rotate `NEON_API_KEY`** (A4) — still 401. Unblocks per-PR DB branches.
2. **The three Vercel dashboard fixes** (A5) — preview protection, domain attachment, live toggle.
3. **Upload `SCOPE_THE_WIRE_v1.md`** — unblocks B6, the story that ends the DEMO-rows era.
4. **Name or confirm the second-theme repo** — unblocks B4 without sunsetting something you meant to keep.
5. **Push the `v2.24-constellation` tag** (A2) — two commands, in §PHASE A. Blocked in-environment, not undone.
6. **Delete `vercel-agent/migrate-middleware-to-proxy`** — one click. Same git-proxy block.
7. **Phase-4 gate decisions** (P5) — the two secrets, the six sign-offs, the KMS choice. Only named subjects are blocked on this.
8. **Re-authorise the Windsor.ai connector** in claude.ai settings — low priority.

---

## A NOTE ON HOW THIS DOC GOES STALE

v1 was accurate on 02 Aug and materially misleading by 05 Aug — not because anything in it
was wrong, but because a large workstream started outside it and the doc had no way to say
so. The failure mode is the doc staying confidently silent about work it does not know
about.

The cheap guard: **when a session merges a PR that is not in this plan, it adds a line to
§0 before it ends.** That is a smaller obligation than a rewrite and it is the one that
would have prevented this.
