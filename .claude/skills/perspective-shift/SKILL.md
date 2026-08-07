---
name: perspective-shift
description: Evaluate a feature, engine, repo, or decision from six stakeholder lenses paired as three adversarial dualities, stress-tested with six perspective-shifting methods (Round Table, Phoenix Checklist, Day in the Life, Inversion, Reframing, Vuja Dé). Use when a build looks "done" and you need to find what's missing, when choosing between approaches, when auditing an inherited repo or capability, when scoping a product sheet, or when a decision keeps circling. Triggers on "perspective", "six lenses", "dual perspective", "stress test this", "what are we missing", "evaluate this capability", "should we keep or kill", "product scope", "second opinion", "poke holes".
---

# Perspective Shift — six lenses, three dualities, six methods

> "One perspective is no perspective." — Game-Changer
> "Perspective is worth more than IQ." — Alan Kay

Most evaluation checklists fail the same way: they score each dimension in isolation, every dimension comes back "fine," and the real problem — which lives in the *tension between* dimensions — is never surfaced. A feature can be technically excellent and ethically indefensible. A joke can be funnier and thereby less trustworthy. Scoring those separately hides the trade; pairing them exposes it.

This skill does three things in order:

1. **Pair** the six lenses into three dualities, so each lens is interrogated by its natural adversary.
2. **Apply** a perspective-shifting method to each duality — a different one per pair, because each method breaks a different kind of stuck.
3. **Extract** the top 5–6 needs per lens, then report only the **conflicts**, because that is where the design decision actually is.

## When to use this

- A build passes CI and looks finished — find what "finished" is hiding
- Deciding keep / rebuild / kill on an inherited repo or capability
- Scoping a product sheet or dev plan and needing the requirement set to be complete
- A decision keeps circling with no new information
- Before anything user-facing, revenue-touching, or legally exposed ships

**Do not** use it for mechanical tasks, single-fact lookups, or when the answer is already known and the analysis would be theatre.

---

## Step 1 — The three dualities

Never evaluate a lens alone. Each pair below is chosen because the two sides *want incompatible things*, and the incompatibility is the finding.

### Duality 1 · Customer ↔ User
**Who pays vs. who consumes.** Often the same human in different modes, which is exactly why teams conflate them and ship for one at the other's expense.

- **Customer (Experience)** — the buyer or external recipient. Value, satisfaction, ROI, the end-to-end journey, trust in what they're paying for.
- **User (Product)** — direct interaction. Usability, friction, interface, how smoothly the daily task completes.

*Classic conflict:* what delights the User in the moment (speed, spectacle, edge) can erode the thing the Customer is actually paying for (trust, accuracy, durability).

**Method: Inversion.** Charlie Munger: *"Don't think about what you want. Think about what you want to avoid."* Ask what would make each side abandon the product, then check whether the other side's wins cause exactly that.

### Duality 2 · Employee ↔ Business
**Who operates it at 2am vs. the P&L it serves.**

- **Employee (People)** — internal adoption, required skills, workflow changes, on-call burden, readiness and resistance.
- **Business (Strategy)** — alignment with goals, financial impact, operating cost, competitive advantage, defensibility.

*Classic conflict:* the cheapest thing to build is frequently the most expensive thing to run, and the operating cost is invisible on the day the decision is made.

**Method: Vuja Dé.** Look at the familiar thing as if you have never seen it, with a child's willingness to question the obvious. *Why does it work this way? Why does it have four legs?* This is where you notice the system has no memory, no ledger, no kill-switch — the absences that are invisible precisely because they've always been absent.

### Duality 3 · Technical ↔ Societal/Ethical
**What we can build vs. what we should ship.**

- **Technical (Systems)** — architecture, security, data integration, scalability, maintenance, failure modes.
- **Societal/Ethical (Impact)** — cultural, environmental, governance and compliance implications; who is harmed if this works exactly as designed.

*Classic conflict:* the most elegant technical solution often externalises its cost onto someone not in the room.

**Method: King Arthur's Round Table.** Seat people — living, dead, fictional — who would each see this differently, and ask their questions rather than yours. Seat *adversaries*, not fans: the regulator, the plaintiff's lawyer, the competitor, the person the feature is done *to*. Ask: *How would ___ approach this? What would ___ find interesting? What would ___ ask that I wouldn't?*

---

## Step 2 — The six methods

Three are assigned above. All six are available; reach for the one that matches how you're stuck.

| Method | Use when | The move |
|---|---|---|
| **King Arthur's Round Table** | You're stuck inside your own expertise | Seat living/dead/fictional people with genuinely different vantage points. Ask their questions, not yours. Adversaries beat admirers. |
| **The Phoenix Checklist** | You're not sure you're asking the right question | CIA-origin question battery. Especially: *Why do we need to solve this? What do we know vs. not know for sure? **What is NOT the problem?** What if we drew a picture of it?* |
| **A Day in the Life** | You're guessing at someone's needs | Ethnography. Don't imagine the user — become one. Run the flow yourself, on their device, with their constraints, withholding judgment. |
| **Inversion** | You keep listing what you want | Ask what you want to *avoid*, then work backwards. Avoiding stupidity is easier than seeking brilliance. |
| **Reframing** | The solution space feels narrow or expensive | Reword the problem statement. *"How do I compete with MBAs?"* → *"How do I get rewarded for expertise without one?"* — different question, entirely different answers. How you frame it determines which paths exist. |
| **Vuja Dé** | The thing is too familiar to see | The inverse of déjà vu: look at the familiar as if brand new. Question what everyone stopped questioning. Effectively the 5 Whys with better branding. |

> **Sourcing note.** The Game-Changer article this derives from titles itself "6 methods" but its own numbered list has seven entries — it opens with "Contact" and never explains it. Six have substance; Contact is a dropped thread. Do not invent content for it.

---

## Step 3 — Extract, then report only conflicts

For each of the six lenses, list the **top 5–6 needs / wants / requirements**. Then discard most of it.

The deliverable is **not** thirty-six bullet points. It is:

1. **The conflicts** — where two paired lenses want incompatible things. Name the trade explicitly.
2. **The absences** — what no lens asked for because nobody thought to (Vuja Dé's harvest).
3. **A ranked action list** — 5–6 items, each tagged with the lens that produced it and a difficulty/blast-radius note.
4. **A split** — which actions are small and confident (do them now) vs. architecturally significant or policy-level (ask first).

That last split is mandatory. An analysis that recommends ten things with equal weight has made no decision.

### Output shape

```markdown
## Dual-6 Perspective Audit — <subject>

### Duality 1 · Customer ↔ User    [Method: Inversion]
| | Top needs |
|---|---|
| Customer | 1. … 2. … 3. … 4. … 5. … |
| User | 1. … 2. … 3. … 4. … 5. … |

**The conflict this exposes:** …
**Insight → action:** …

### Duality 2 · Employee ↔ Business    [Method: Vuja Dé]
…

### Duality 3 · Technical ↔ Societal/Ethical    [Method: Round Table]
*Seated:* <adversary>, <adversary>, <adversary>
**What the table returns:** …

### Cross-cutting: Phoenix Checklist
Running *"what is NOT the problem?"* → …

## Top 5–6 actions
1. **<action>** — <why> *(lens — size)*
…

**Confident + small:** #, #, #  ·  **Needs your call:** #, #
```

---

## Rules that keep this honest

1. **Read the actual artifact first.** Perspective analysis on top of an assumed implementation produces confident fiction. Open the files. If you cannot, say so and scope the conclusion.
2. **Seat adversaries at the Round Table.** A table of admirers returns nothing you didn't already believe.
3. **Report conflicts, not coverage.** "All six lenses look fine" means the pairing wasn't done.
4. **Separate pre-existing from introduced.** When auditing a change, say plainly whether a flaw is new or inherited. Both matter; conflating them misassigns blame and mis-sizes the fix.
5. **Name the blast radius.** Storage changes, public API contracts, and legal/policy calls are never "small," however few lines they take.
6. **Never let the analysis become the deliverable.** It exists to change what gets built.

## Feeding results into product scope

The extracted needs map directly onto the MAD Gambit product-sheet format
(`§1 Overview · §2 Canonical Constants · §Taxonomy · §Technical Development Scope
7.1–7.4 · §Compliance · §Success Metrics`):

- **Customer + User** needs → §1 Overview, tagline, core loop, and §Success Metrics
- **Employee + Business** needs → §7.4 Phased Build, operating-cost notes, and the metrics that gate each phase
- **Technical** needs → §7.1 Smart Contracts / §7.2 Backend / §7.3 Frontend
- **Societal/Ethical** needs → §Compliance — and any of them that are launch-blocking belong in Phase 1, not Phase 4

A requirement that no lens produced probably belongs to no one. Cut it.

See `references/lens-questions.md` for the per-lens question batteries and the
Phoenix Checklist subset worth running verbatim.
