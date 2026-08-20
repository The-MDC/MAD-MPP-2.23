# Lens question batteries

Ask these verbatim. The value is in asking the question you would not have
thought to ask, so resist paraphrasing them into questions you already had.

---

## Customer (Experience) — the buyer / external recipient

1. What is this person actually paying for — and is that the thing we optimised?
2. What would make them feel they got value, as distinct from getting output?
3. Where in the end-to-end journey do they lose confidence?
4. What promise are we implicitly making that we cannot keep?
5. If they showed this to a peer, what would embarrass them?
6. What is the ROI story, and does it survive a sceptical CFO?

## User (Product) — direct interaction

1. What is the very first thing they must understand, and how long does that take?
2. Where does friction live — and is it accidental or load-bearing?
3. What happens on the slow device, the small screen, the bad connection?
4. What do they do *most often*, and is that the shortest path?
5. What would they try that we did not anticipate?
6. What is the failure mode they see, versus the one we log?

## Employee (People) — internal adoption and operation

1. Who gets paged when this breaks, and what will they see?
2. What new skill does operating this require, and does anyone have it?
3. What existing workflow does this change, and who will resist that?
4. What is the manual step nobody has admitted is still manual?
5. How is a bad output stopped in production, right now, today?
6. What does one unit of this cost to run — and can anyone see that number?

## Business (Strategy)

1. Which company goal does this serve, and how would we know it did?
2. What is the marginal cost per unit, and does it scale in our favour?
3. What is defensible here — and what could a competitor copy in a fortnight?
4. What does this make impossible or expensive later?
5. What is the vendor dependency, and what is the cost of switching?
6. If this succeeded completely, what would break next?

## Technical (Systems)

1. What are the unbounded operations — loops, fetches, allocations, queries?
2. What happens when each external dependency is slow, wrong, or absent?
3. Where is the state, and what happens when two writers disagree?
4. What is the blast radius of the worst plausible bug?
5. What here is a new dependency, and what does it pull in transitively?
6. What is untested because it is hard to test?

## Societal / Ethical (Impact)

1. Who is affected by this who is not in the room?
2. If it works *exactly as designed*, who is harmed?
3. What claim does the output implicitly make, and can we stand behind it?
4. Whose content, likeness, data, or labour does this use — and under what right?
5. What is the regulatory framing in the least favourable jurisdiction?
6. What would a hostile journalist write, and would it be wrong?

---

## The Phoenix Checklist — the subset worth running verbatim

Originating with the CIA as a battery for seeing a situation from every angle.
Start from a written problem statement and expect to revise both the answers
*and the statement* as you go.

**Defining the problem**
1. Why is it necessary to solve this problem?
2. What benefits do we get by solving it?
3. What is the unknown?
4. What is it that we do not yet understand?
5. What is the information we have?
6. **What is *not* the problem?** ← the single highest-yield question here
7. Is the information sufficient? Insufficient? Redundant? Contradictory?
8. Should I draw a diagram of the problem? A figure?
9. Where are the boundaries of the problem?
10. Can I separate the various parts of the problem? What are the relationships between them?
11. What are the constants that cannot be changed?
12. Have I seen this problem before, in a slightly different form?
13. Suppose I find a problem related to mine that has already been solved — can I use it?

**Making the plan**
14. Can I solve the whole problem? Part of it?
15. What would I like the resolution to be? Can I picture it?
16. How much of the unknown can I determine?
17. Can I derive something useful from the information I have?
18. Have I used all the information?
19. Have I taken into account all essential notions in the problem?
20. Can I separate the steps in the problem-solving process? Can I check each?
21. What creative thinking techniques can I use to generate ideas?
22. Can I see the result? How many different kinds of results can I see?
23. What have I not yet tried?

Question 6 is the one to run first on anything that looks finished. Naming what
is *not* broken frequently reveals that the expensive component everyone is
debating was never the constraint.

---

## Round Table — seating suggestions

Seat adversaries and outsiders, never admirers. A useful default table for a
software or product decision:

- **The plaintiff's lawyer** — what claim does this hand them?
- **The regulator** — which rule is this closest to touching?
- **The competitor** — what would they copy, and what would they mock?
- **The person it is done *to*** — the scraped publisher, the roasted subject, the user whose data it is
- **The on-call engineer at 3am** — what does the alert say and what can they do about it?
- **The sceptical journalist** — what is the headline?
- **The child asking why** — the Vuja Dé seat; questions nobody senior will ask aloud

Typical prompts: *How would ___ approach this? What questions would ___ ask?
What would ___ find interesting? What would ___ do?*
