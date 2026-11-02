"use client";

/**
 * Octavian's speech line: a quiet caption under the creature that says something in character when its temper
 * changes — more often as it gets more annoyed, never more than once every few seconds, and never when the visitor
 * prefers reduced motion AND has not touched it. It reads the shared mood (a module singleton) on a slow timer and
 * only re-renders on a change of temper, so it adds nothing to the 60 fps draw loop.
 */
import React, { useEffect, useRef, useState } from "react";
import { getMood, getSelected } from "@/lib/octavian-state";
import { NODE_REGISTRY } from "@/lib/node-registry";
import { cannedQuip, rank, temperOf, type Temper } from "@/lib/octavian-voice";

const POLL_MS = 400;
const MIN_GAP_MS = 6000; // never chatty
const SHOW_MS = 7000;

export default function OctavianVoice() {
  const [line, setLine] = useState("");
  const last = useRef<{ temper: Temper; at: number }>({ temper: "calm", at: 0 });
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    const say = (text: string) => {
      if (!alive || !text) return;
      setLine(text);
      if (hide.current) clearTimeout(hide.current);
      hide.current = setTimeout(() => alive && setLine(""), SHOW_MS);
    };

    const id = setInterval(async () => {
      const now = performance.now();
      const t = temperOf(getMood().prods);
      const prev = last.current;
      if (t === prev.temper) return;
      // Cooling down is quiet; getting more annoyed is what it comments on. Never more often than MIN_GAP_MS.
      if (rank(t) < rank(prev.temper)) { last.current = { temper: t, at: prev.at }; return; }
      if (now - prev.at < MIN_GAP_MS) return;
      last.current = { temper: t, at: now };
      try {
        const res = await fetch("/api/octavian/quip", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ temper: t, node: NODE_REGISTRY[getSelected()]?.badge ?? null }),
        });
        const j = (await res.json()) as { line?: string };
        say(typeof j.line === "string" && j.line ? j.line : cannedQuip(t));
      } catch {
        say(cannedQuip(t)); // offline or blocked: the written bank, never silence
      }
    }, POLL_MS);

    return () => { alive = false; clearInterval(id); if (hide.current) clearTimeout(hide.current); };
  }, []);

  return (
    <p
      role="status"
      aria-live="polite"
      style={{
        margin: "6px 2px 0", minHeight: 18, fontSize: 11, fontStyle: "italic", lineHeight: 1.4,
        opacity: line ? 1 : 0, transition: "opacity .35s ease", color: "inherit",
      }}
    >
      {line ? <>◉ {line}</> : null}
    </p>
  );
}
