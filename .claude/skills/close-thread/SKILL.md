---
name: close-thread
description: Close out a working session into a single handoff file at docs/THREAD_CLOSEOUT.md — everything outstanding, everything that failed or timed out, TODOs, suggested items, a copy-paste new-chat opener and next steps. Use when the user says "close this thread", "close out this thread", "close the thread", "wrap this up", "session handoff", "hand off", "I'm done for today", "what's outstanding", or otherwise signals the session is ending and they want the state captured before context is lost. Also use before a long gap, before switching machines, or when context is about to run out.
---

# Close Thread — one file, no fragments

The point of this skill is that **the next chat starts warm**. A close-out that only lists
what got done is a changelog; what the next session actually needs is what is *unfinished*,
what is *broken*, and what to *type first*.

## The one hard rule: do not fragment the docs

`docs/MAD_GAMBIT_MASTER.md` says, in its own header, *"This is the only planning document…
Do not create one."* That rule was earned — ~150 scattered planning docs were consolidated
into it, 114 files and ~36.5k lines deleted in the same commit. A dated
`HANDOFF_2026-08-18.md` re-creates exactly that problem, one file at a time.

So the split is:

| Content | Where it goes |
|---|---|
| **Durable** — a corrected fact, a new TODO, a decision, a discovered constraint | **Folded into MASTER**, in the right Part. Not restated in the close-out. |
| **Transient** — what happened this session, what broke, what to type next | `docs/THREAD_CLOSEOUT.md` |

`docs/THREAD_CLOSEOUT.md` is a **fixed path that is overwritten every time.** Never date it,
never version it, never keep the old one. One file, always current. If the previous close-out
still holds items that were never actioned, carry them forward into the new one — do not keep
the old file to preserve them.

**Fold into MASTER first, then write the close-out.** In that order — otherwise the close-out
becomes the record and MASTER silently goes stale, which is the failure mode this whole
arrangement exists to prevent.

## Procedure

1. **Sweep the session for durable items** and fold each into MASTER's correct Part:
   - Corrected facts → wherever the wrong fact lived (and say it was corrected, with the date)
   - New work → PART 0 §5 build queue, or a Workstream
   - Founder-only items → PART 0 §3 (decisions) or §4 (blocked on access)
   - New environment constraints → PART 0 §6
   - Traps a future session would fall into → PART 0 §7
   - A dated line in PART I chronology
2. **Verify before you claim.** Every count, path, and status in the close-out gets checked
   against the tree or the API, not recalled. Getting a file count wrong here is how the
   next session inherits a false belief. Mark anything unverifiable as ‹verify› and say why.
3. **Write `docs/THREAD_CLOSEOUT.md`** to the template below, overwriting whatever is there.
4. **Commit and push** on the session's designated branch. An uncommitted close-out is worse
   than none — the container is ephemeral and reclaimed after inactivity.
5. **Report the file path and the PR link** in chat, plus the top 3 items, so the user gets
   the summary without opening anything.

## Template

```markdown
# Thread close-out — <date>

**Source of truth is `docs/MAD_GAMBIT_MASTER.md`.** This file is transient: what happened
this session, what is broken, and what to do next. It is overwritten every close-out.

Branch `<branch>` · HEAD `<sha>` · PR <link + state>

## 1 · Start the next chat with this
> <a copy-paste block that re-establishes context in one paste: repo, branch, PR,
> the single most urgent thing, and what NOT to redo>

## 2 · Shipped this session
<commits, one line each, with what each actually changed>

## 3 · Outstanding — ordered by who can act
### Blocked on the founder (no agent can do these)
### Blocked on environment/access
### Open engineering work

## 4 · Failed, timed out, or unverifiable this session
<every tool/network/CI failure hit, what it blocked, and the workaround if one exists.
This section is the one people skip and the one that saves the most time.>

## 5 · Suggested — not asked for, worth doing
<with a one-line reason each; keep it short and skippable>

## 6 · Do not redo
<work already done that a fresh session would plausibly repeat, and settled decisions>
```

## What makes this useful rather than ceremonial

- **§4 is the highest-value section.** A fresh session will otherwise burn twenty minutes
  rediscovering that `npm ci` 403s or that a domain is egress-blocked. List every failure,
  even ones you worked around.
- **§6 prevents the most expensive mistake** — re-fixing something already fixed, or
  reopening a settled decision. Both have happened in this repo.
- **§1 must be genuinely paste-able.** Not a summary *about* the context — the actual text
  to paste into a new chat.
- **Distinguish "not done" from "cannot be done here."** They need different actions from
  the user: one is scheduling, the other is a click in a settings page.
- **Never report unverified work as complete.** If CI could not run, say the change is
  unvalidated and say why.
