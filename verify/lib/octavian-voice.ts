/**
 * Octavian's voice.
 * ─────────────────
 * The creature already moves, flinches and shifts colour as it is prodded (lib/octavian-state.ts, tiers in
 * components/octavian-creature.tsx). This gives that temper a name and a line of speech.
 *
 * The temper is a pure function of the shared `prods` count, so every mount agrees. The line comes from a small model
 * when one is configured (NVIDIA NIM) and from a written bank otherwise — the creature is never mute and a model
 * outage is invisible. The model is only ever asked for ONE short line in character; it has no tools, no facts and no
 * authority, and its output is length-capped and screened before it is shown.
 */
import { looksLikeLeak } from "@/lib/madhatr-guard";

export type Temper = "calm" | "ruffled" | "annoyed" | "furious";
export const TEMPERS: readonly Temper[] = ["calm", "ruffled", "annoyed", "furious"];

/** prods 0-1 calm, 2-3 ruffled, 4-5 annoyed (palette turns amber/red), 6+ furious. Matches the creature's tiers. */
export function temperOf(prods: number): Temper {
  if (!Number.isFinite(prods) || prods < 2) return "calm";
  if (prods < 4) return "ruffled";
  if (prods < 6) return "annoyed";
  return "furious";
}

export const rank = (t: Temper): number => TEMPERS.indexOf(t);

const BANK: Record<Temper, readonly string[]> = {
  calm: [
    "Mmm. The mesh hums. Twenty nodes, one mood: content.",
    "All nodes nominal. Ask me something, or just watch the fireflies.",
    "Quiet floor. I like it. Don't get used to it.",
    "I'm the platform's pulse. Currently: relaxed.",
  ],
  ruffled: [
    "Hey. Easy with the poking.",
    "I felt that. Twice. Let's not make it a habit.",
    "I'm made of maths, not clay. But I noticed.",
    "Okay, you've got my attention. Now stop.",
  ],
  annoyed: [
    "That's four. I'm turning orange on purpose.",
    "I said easy. Do I look like a stress ball to you?",
    "Every node just rolled its eyes. All twenty.",
    "Keep it up and I start charging by the poke.",
  ],
  furious: [
    "Right. That's it. I'm red, I'm loud, and I'm not taking questions.",
    "Congratulations, you broke the calm. Give me a minute to cool down.",
    "I'm leaving the room. Metaphorically. I'm a mesh.",
    "Go outside. Touch grass. Come back when I've stopped glowing.",
  ],
};

export function cannedQuip(temper: Temper, rand: () => number = Math.random): string {
  const bank = BANK[temper];
  return bank[Math.floor(rand() * bank.length) % bank.length];
}

export const MAX_QUIP_CHARS = 120;

/** One clean, short line, or null. Strips quotes and markdown, caps length, refuses anything key-shaped. */
export function fitQuip(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const line = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();
  if (!line || looksLikeLeak(line)) return null;
  if (line.length <= MAX_QUIP_CHARS) return line;
  const cut = line.slice(0, MAX_QUIP_CHARS);
  const sp = cut.lastIndexOf(" ");
  return (sp > 40 ? cut.slice(0, sp) : cut).replace(/[,;:\-\s]+$/, "") + "…";
}

export function quipPrompt(temper: Temper, node: string | null): { system: string; input: string } {
  return {
    system: [
      "You are Octavian, the living mesh at the centre of MAD Gambit: twenty glowing nodes that pulse with the platform's activity.",
      "You are lifelike, dry and a little vain. You are not an assistant and you do not give advice or facts.",
      "Reply with ONE short line of speech, under 14 words, in first person. No quotes, no emoji, no markdown, no stage directions.",
      "Your line must match your current temper exactly. The joke is on yourself or on being poked, never on a person.",
    ].join("\n"),
    input: `Temper: ${temper}.${node ? ` The visitor is looking at the node called "${node}".` : ""} Say your line.`,
  };
}
