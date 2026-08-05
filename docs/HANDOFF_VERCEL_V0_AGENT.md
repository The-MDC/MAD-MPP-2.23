# Handoff — Vercel v0 agent · custom perpetual families

**Scope of this handoff:** FIVE FACES · ZEITGEIST · PERPETUAL EPIPHANIES, backend and front end.
**Branch:** `claude/custom-perpetual-concepts-g1aa4s` → PR #58.
**Prior:** #57 (maths core) is merged to `main`.

This is a verification brief, not a build brief. Everything below is implemented; what is
wanted from v0 is a second pair of eyes on the surfaces and the failure paths.

---

## 1. What exists

### Route map

```
GET  /api/v1/faces                    list the FIVE FACES book
GET  /api/v1/faces/codex              the five-face axis (pure — no DB)
GET  /api/v1/faces/[id]               one market + leg history + book
POST /api/v1/faces/decompose          one decomposition step (pure — no DB)
POST /api/v1/faces/stake              authed · face + layer required
POST /api/v1/faces/exit               authed · request | redeem
GET  /api/v1/faces/slips              live Slips across the book

GET  /api/v1/zeitgeist/slate          live slate, or the sourced seed slate
GET  /api/v1/zeitgeist/turning        vintage, leg, countdown, drift, moon
GET  /api/v1/zeitgeist/succession     stored matrix for a Turning
POST /api/v1/zeitgeist/succession     build S · optionally persist

GET  /api/v1/epiphany/models          catalog · region + search

POST /api/v1/perps/roll               settle matured legs, open the next
POST /api/v1/perps/convict            authed · ZEITGEIST + EPIPHANY positions
```

### Front-end surfaces (all mounted on `/preview`)

| Component | Anchor | What it draws |
|---|---|---|
| `faces-waterline.tsx` | `#mg-faces` | Permanent vs transitory entropy per leg; the Divergence between them; Slips in gold |
| `zeitgeist-almanac.tsx` | `#mg-zeitgeist` | Slate, per-slot lifecycle phase, Turning countdown in legs, corpus + sources per slot |
| `epiphany-catalog.tsx` | `#mg-epiphanies` | Region filter, search, cultural-persistence bars, cross-cultural share |
| `persona-price.tsx` | — | The shared price primitive used by the first two |

---

## 2. What to verify — in priority order

### 2.1 The §2 binding (highest priority)

Every rendered face price must have its Codex definition adjacent, at no less than the label's
visual weight. This is a compliance requirement, not a style preference.

It is enforced two ways in `persona-price.tsx`:

- **Type level** — the component takes a whole `StakeableLabel`. `definition` is a required field
  of that type and `stakeableLabel()` is its only constructor. There is no prop shape that renders
  a price without one, and the constructor never returns a `catchphrase`, so flavour cannot reach
  a stakeable surface.
- **Style level** — a single `scale` prop drives both the name and the definition type size. There
  is no separate number to shrink.

**Please check:** that no surface renders a face price outside `PersonaPrice`. A raw
`{Math.round(p*100)}%` next to a face name anywhere in the tree is the failure this design exists
to prevent. Also confirm the definition does not truncate or ellipsis at narrow widths.

There is deliberately **no compact variant**. The compact variant of a bound disclosure is an
unbound one. If a layout needs one, that layout is wrong, not the component.

### 2.2 Degrade-without-a-database

Every surface must render with no `DATABASE_URL`. The pattern is demo **data** through the **real**
maths — nothing fakes a decomposition. Confirm on a preview deployment with the env var absent:

- `/api/v1/faces` → `source: "demo"`, three institutional subjects, real entropies
- `/api/v1/zeitgeist/slate` → `source: "seed"`, three slots with corpora and sources
- `/api/v1/epiphany/models` → `source: "catalog"`

The demo subjects are institutional and archetypal on purpose. A demo fixture is the easiest place
in a codebase for a named individual to become permanent, and a fixture cannot have a registered
portrait key.

### 2.3 Responsive behaviour

The three surfaces use `repeat(auto-fit, minmax(min(100%, Npx), 1fr))` grids. Please check at 360px
that nothing forces horizontal page scroll — particularly the Turning strip in the Almanac, which
is a wrapping flex row with a progress bar that claims `flex: 1 1 200px`.

### 2.4 Skin coverage

Both skins (Gilded Pop-Baroque / Neon Noir). Note the `Skin` type has **no `negative` key** — the
new components use `accent2` where a negative reading is meant. Confirm the Slip state reads as
alarming in both.

---

## 3. Where the interesting failure paths are

Worth probing, in rough order of how much a mistake would cost:

1. **`/api/v1/faces/exit`** — the price locks at *request*, not redemption. If a payout ever varies
   with post-request state, the cooldown becomes a free option written by the house. Maturity is
   enforced in SQL (`exit_ready_at <= now()`), not in the handler, so a client cannot rush it.
2. **`/api/v1/perps/roll`** — settles the closing leg *then* advances. Idempotent: `rollLeg` only
   moves a market whose leg has actually closed, so a double-firing cron cannot skip a leg. CGARCH
   filter state carries forward; losing it would silently reset every persistence reading.
3. **`/api/v1/zeitgeist/succession` (POST with `persist: true`)** — refuses to write a matrix that
   fails conservation. A leaky Turning destroys holder value with no visible symptom.
4. **`/api/v1/faces/stake`** — THE INTERLOCK. A `named_individual` market rejects conviction unless
   a portrait key is registered and unexpired. The check is a live query, not a cached flag,
   because the failure it guards against is the registry quietly lapsing while markets keep trading.

---

## 4. Deliberate design decisions — please don't "fix" these

- **Legs, not expiries.** There is no `resolved_at` on a perp market and no settle function. If a
  review suggests adding one, the answer is no; that is the product.
- **Leg boundaries are global,** anchored to the lunar epoch, not to each market's creation date. A
  market created mid-leg gets a short first leg. Per-market anniversaries would make THE TURNING a
  different date for every slate.
- **The Turning drifts ~10.9 days earlier each Gregorian year** and the Almanac says so on screen.
  That is the lunar cadence, not a bug in the countdown.
- **`persistence` is not updated on catalog re-sync** (`upsertEpiphanyModel`). It is a live market
  reading, not catalog metadata — a re-sync must not reset what the book has priced.
- **`subject_ref` is opaque and validated at the boundary.** Never a name, handle or likeness.

---

## 5. Known gaps — not in PR #58

- `portrait-vault.ts` / `subject-identity-map.ts` / `registrar-queue.ts` — the Phase-4 registrar
  internals. Schema and interlock are in place; the service is the next increment.
- Slot auction room (Dutch clock, commit-reveal) — specified in ZEITGEIST §11.3, not built.
- The succession flow ribbon in the Almanac — the API returns the matrix; the Almanac currently
  renders slate + lifecycle only.

---

## 6. Verification note

CI is the authoritative check for this branch. A local `npm ci` cannot run in the authoring
environment — the registry returns 403 on tarball fetches — so `type-check`, `build`, `lint` and
`test` all run in GitHub Actions rather than locally.
