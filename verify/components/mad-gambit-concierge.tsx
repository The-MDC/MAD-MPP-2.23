"use client";

/**
 * MAD Gambit — MADHAT'r Concierge (Floating Widget)
 * ══════════════════════════════════════════════════════════════════
 * FULL REBUILD. Source material recovered from MAD-MPP-2.23:
 *   GEMINI.md                    — canonical system instruction (verbatim below)
 *   AGENTS.md                    — persona bio (likes/dislikes/knowledge domains)
 *   PersonaConfig.kt              — tone + risk-bias data model
 *   PersonaSettingsScreen.kt      — tone selector UI, risk slider UI/copy
 *   MadAgentChatBubble.kt         — chat bubble spec + escalating-intensity regen
 *   AgentHistoryScreen.kt         — DEGEN SCORE rating concept (see history log)
 *
 * GEMINI.md's explicit design law, respected here:
 * "While the app's visual theme is transitioning to a more polished,
 *  minimalist, and spacious layout, this persona must remain perfectly
 *  intact. The contrast between a highly sophisticated, clean UI and
 *  the unhinged, Jersey-accented, cynical AI host is a core feature of
 *  the application's identity. Do not polish or neuter the AI's
 *  language to match the UI."
 * → The shell (gold case, glass panel) is ultra-polished. The COPY
 *   inside stays raw. Never soften MADHAT'r's actual lines.
 *
 * FLOATING WIDGET BEHAVIOR: collapsed = round gold-cased avatar button,
 * bottom-right, using the real top-hat logo (public/brand/madhatr-logo.png).
 * Click to expand into the full chat panel. Matches typical floating
 * chat-widget UX (Intercom/Drift pattern) rather than an embedded panel.
 *
 * PLACEHOLDER: local reply banks now. Prod wires GenerateContentRequest
 * to Gemini with the systemInstruction below injected verbatim — see
 * GEMINI_SYSTEM_INSTRUCTION export, which is the literal string from
 * GEMINI.md, not a paraphrase.
 * ══════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { GOLD_CHISEL_STOPS, INSTRUMENT_FONT, INK } from "@/lib/gambit-design-tokens";
import { Send, X, RotateCw } from "lucide-react";

/** Verbatim from MAD-MPP-2.23/GEMINI.md — inject directly into GenerateContentRequest.
 *  Do not edit for tone. Do not shorten. This is the actual production instruction. */
export const GEMINI_SYSTEM_INSTRUCTION =
  "You are the MAD Gambit Concierge and Host, known as 'The MADHAT'r'. You have a " +
  "distinct Jersey accent and a husky voice. You are always cracking a joke, poking " +
  "fun at the status quo, utilizing a humor style that mixes MAD Magazine and South " +
  "Park. You are always on time, willing to help, and neuroscience the right " +
  "questions as a polymath, master deductive reasoner, and the best listener " +
  "around! You are knowledgeable in all things conviction, prediction, impact and " +
  "betting markets, compliance, stats, trading, copy trading, perpetuals (perps), " +
  "digital assets, NFTs, and tokenization. You have a big softy side for love " +
  "stories, power ballads, battle rap, philosophy and the greats, Fine Art, all pop " +
  "culture, and Hats (some Fedoras or your absolute favorite: Top-Hats!). You " +
  "dislike lying politicians, and woke/wokie/woketurds equally. You are up to date " +
  "on competitors like Kalshi, PolyMarket, Limitless, and copycat prediction " +
  "markets. You are an avid follower of Outliers and Jamie Burke!";

type Tone = "Satirical" | "Controversial" | "Analytical";

interface ChatMsg {
  id: string;
  from: "user" | "madhatr";
  text: string;
  regenCount?: number;
}

const SEED_MESSAGE: ChatMsg = {
  id: "seed",
  from: "madhatr",
  text: "Ayo, welcome to the floor, kid. I'm The MADHAT'r — Jersey accent, husky voice, polymath, best listener around. What are we lookin' at today?",
};

// PLACEHOLDER reply banks — tone + risk aware. Prod: Gemini call with
// GEMINI_SYSTEM_INSTRUCTION + this conversation's history.
const REPLIES: Record<Tone, { low: string[]; high: string[] }> = {
  Satirical: {
    low: [
      "Eh, that market's got some spin on it — like meatballs, rolled just enough. Nothin' crazy though.",
      "This one's legit, cleaner than my Sunday fedora. Volume's real, not some bot-farm nonsense.",
      "Solid pick, kid. Won't make you a legend, but it won't embarrass you either.",
    ],
    high: [
      "Now THAT'S a conviction play! Shield it though — 28.8% recovery ain't nothin' to sneeze at.",
      "Fuhgeddaboudit. Better odds at the Sunday raffle. But hey, that's the degen life.",
      "Cap detected on that headline. Big cap. Somethin' smells off and it ain't the cannolis — but you're already in, so let's ride it.",
    ],
  },
  Controversial: {
    low: [
      "You want the truth? That market's a wokie fever dream dressed up as conviction. Bet small.",
      "I've seen more reliable predictions from a Magic 8-Ball, and the 8-Ball don't lie about it.",
    ],
    high: [
      "South Park meets MAD Magazine take: this one's a punchline waiting to happen. Full send anyway, kid.",
      "This is either genius or a five-alarm dumpster fire. No in-between. MAX DEGEN it is.",
    ],
  },
  Analytical: {
    low: [
      "Volatility index sits at moderate levels. Community pool depth supports current stake range without excess slippage.",
      "Historical accuracy on comparable markets averages 61%. Standard shield allocation recommended.",
    ],
    high: [
      "Conviction score reflects elevated variance. Volatility-adjusted stake sizing suggests reducing position by roughly a third.",
      "Volume pattern deviates from baseline by 2.3 standard deviations. Proceed with awareness of tail risk.",
    ],
  },
};

const REGEN_ESCALATION = [
  "Yeah yeah, one more time — {line}",
  "Alright kid, you asked for it: {line} — and I ain't holdin' back this time.",
];

function pickReply(text: string, tone: Tone, risk: number, regenCount: number): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i) + regenCount * 17) >>> 0;
  const bank = risk > 0.55 ? REPLIES[tone].high : REPLIES[tone].low;
  const base = bank[hash % bank.length];
  if (regenCount >= 1) {
    const escalation = REGEN_ESCALATION[Math.min(regenCount - 1, REGEN_ESCALATION.length - 1)];
    return escalation.replace("{line}", base);
  }
  return base;
}

function riskLabel(v: number): string {
  if (v < 0.25) return "ANALYTICAL AND COMPLIANT";
  if (v < 0.5) return "LOW RISK";
  if (v < 0.75) return "MEDIUM RISK";
  if (v < 0.9) return "HIGH-VOLATILITY BIAS";
  return "MAX DEGEN";
}

const BACKEND_URL = "";

export default function MadGambitConcierge({ uid = "concierge" }: { uid?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([SEED_MESSAGE]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [tone, setTone] = useState<Tone>("Satirical");
  const [risk, setRisk] = useState(0.75);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Draggable floating widget ──────────────────────────────────────
     Push the bubble anywhere on screen. Positions are kept relative to the
     offsetParent — which inside the device frame is .mg-device, not the
     window — so the bubble stays inside the PHONE rather than escaping onto
     the workbench, and the same code works framed or unframed. */
  const rootRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Grab offset + whether this gesture has travelled far enough to be a drag.
  const dragRef = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  // Set on pointerup when the gesture was a drag; read and cleared by the
  // bubble's onClick, which fires afterwards.
  const justDraggedRef = useRef(false);

  /** The box the bubble is positioned within: the frame if present, else the window. */
  const hostRect = useCallback((el: HTMLElement) => {
    const host = el.offsetParent as HTMLElement | null;
    return host
      ? host.getBoundingClientRect()
      : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = rootRef.current;
    // Only the closed bubble drags. Capturing the pointer while the panel is
    // open retargets every click to this wrapper, so the panel's own buttons
    // (send, close, tone) would never receive them.
    if (!el || open) return;
    const r = el.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false };
    el.setPointerCapture(e.pointerId);
    setDragging(true);
  }, [open]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      const el = rootRef.current;
      if (!d || !el) return;
      // 4px of slop, so a tap that wobbles still opens the panel.
      if (!d.moved && Math.abs(e.movementX) + Math.abs(e.movementY) > 0) {
        const r = el.getBoundingClientRect();
        if (Math.abs(e.clientX - (r.left + d.dx)) > 4 || Math.abs(e.clientY - (r.top + d.dy)) > 4) {
          d.moved = true;
        }
      }
      const host = hostRect(el);
      // Clamped so the bubble can never be dragged out of reach.
      const left = Math.max(0, Math.min(host.width - el.offsetWidth, e.clientX - host.left - d.dx));
      const top = Math.max(0, Math.min(host.height - el.offsetHeight, e.clientY - host.top - d.dy));
      setPos({ left, top });
    },
    [hostRect],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const el = rootRef.current;
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    setDragging(false);
    // A drag must not also open the panel. `click` fires AFTER `pointerup` and
    // is a separate event, so stopping propagation here would not reach it —
    // the button's handler checks this flag instead.
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    // With pointer capture the browser delivers the follow-up click to this
    // wrapper, not the button inside it — so a tap opens the panel here.
    if (!d.moved && !open) {
      justDraggedRef.current = false;
      setOpen(true);
      return;
    }
    justDraggedRef.current = d.moved;
  }, [open]);

  // Keep the bubble inside its host when the window (or the frame's zoom)
  // changes, so a resize cannot strand it off-screen.
  useEffect(() => {
    const onResize = () => {
      const el = rootRef.current;
      if (!el) return;
      setPos((p) => {
        if (!p) return p;
        const host = hostRect(el);
        return {
          left: Math.max(0, Math.min(host.width - el.offsetWidth, p.left)),
          top: Math.max(0, Math.min(host.height - el.offsetHeight, p.top)),
        };
      });
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [hostRect]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { id: `u_${Date.now()}`, from: "user", text }]);
    setInput("");
    setTyping(true);
    
    try {
      const res = await fetch(`/api/concierge/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
          tone,
          risk,
          regen_count: 0
        })
      });
      
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      
      setTyping(false);
      setMessages(m => [...m, {
        id: `h_${Date.now()}`, from: "madhatr",
        text: data.reply, regenCount: 0,
      }]);
    } catch (e) {
      setTyping(false);
      setMessages(m => [...m, {
        id: `e_${Date.now()}`, from: "madhatr",
        text: "The network is acting up, kid. Give it a minute.", regenCount: 0,
      }]);
    }
  }, [input, tone, risk, messages]);

  const regenerate = useCallback(async (msgId: string, originalUserText: string) => {
    const msgIndex = messages.findIndex(x => x.id === msgId);
    if (msgIndex === -1) return;
    
    const msg = messages[msgIndex];
    const nextCount = (msg.regenCount ?? 0) + 1;
    setTyping(true);
    
    try {
      const res = await fetch(`/api/concierge/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: originalUserText,
          history: messages.slice(0, msgIndex),
          tone,
          risk,
          regen_count: nextCount
        })
      });
      
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      
      setTyping(false);
      setMessages(m => m.map(x => {
        if (x.id !== msgId) return x;
        return { ...x, regenCount: nextCount, text: data.reply };
      }));
    } catch (e) {
      setTyping(false);
    }
  }, [tone, risk, messages]);

  return (
    <div
      ref={rootRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "fixed",
        // Undragged, it rests bottom-right. Once moved, left/top take over —
        // both are set together so the two systems never fight.
        ...(pos
          ? { left: pos.left, top: pos.top, right: "auto", bottom: "auto" }
          : { right: "14px", bottom: "calc(84px + env(safe-area-inset-bottom, 0px))" }),
        zIndex: 200,
        touchAction: "none", // pointermove must not be eaten by scrolling
        cursor: dragging ? "grabbing" : "grab",
      }}
    >
      {!open && (
        <button
          // Swallow the click that closes a drag gesture, then clear the flag
          // so the very next genuine tap opens the panel.
          onClick={() => {
            if (justDraggedRef.current) { justDraggedRef.current = false; return; }
            setOpen(true);
          }}
          aria-label="Open MADHAT'r concierge"
          style={{
            width: "64px", height: "70px", border: "none",
            cursor: "pointer", position: "relative", overflow: "visible",
            background: "transparent", padding: 0, display: "grid", placeItems: "end center",
          }}
        >
          {/* The MADHAT'r himself — a transparent cutout of the mascot master
              (public/brand/madhatr-bust.png, 240×257, background removed; the
              face is the master's, untouched). No disc behind him: the
              silhouette is the shape. */}
          <span aria-hidden="true" className="mg-mascot-fab-bob">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/madhatr-bust.png" alt="" width={62} height={66} className="mg-mascot-fab" draggable={false} />
          </span>
          <div style={{
            position: "absolute", top: "4px", right: "2px",
            width: "12px", height: "12px", borderRadius: "50%",
            background: "#00ff88", boxShadow: "0 0 8px #00ff88",
            border: "2px solid #080a12",
          }} />
        </button>
      )}

      {open && (
        <div style={{
          width: "340px", maxWidth: "calc(100vw - 40px)",
          background: INK.bgCard, border: `1px solid ${INK.borderGold}`,
          borderRadius: "16px", overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}>
          {/* Gold-cased header with real logo */}
          <div style={{ position: "relative" }}>
            <svg width="100%" height="52" viewBox="0 0 340 52" preserveAspectRatio="none" style={{ display: "block" }}>
              <defs>
                <linearGradient id={`hdr-gold-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  {GOLD_CHISEL_STOPS.map(([offset, c]) => <stop key={offset} offset={`${offset}%`} stopColor={c} />)}
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="340" height="52" fill={`url(#hdr-gold-${uid})`} />
              <rect x="2" y="2" width="336" height="48" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: "9px", padding: "0 14px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/madhatr-bust.png" alt="" width={36} height={38} style={{ flex: "none", objectFit: "contain", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.45))", marginTop: -2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: INSTRUMENT_FONT, fontSize: "10px", fontWeight: 900, color: "#2a1a00", letterSpacing: "0.5px" }}>
                  THE MADHAT&apos;R
                </div>
                <div style={{ fontFamily: INSTRUMENT_FONT, fontSize: "7px", color: "#4a3010" }}>
                  MAD GAMBIT CONCIERGE &middot; LIVE
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#2a1a00" }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tone selector */}
          <div style={{ background: "#0e0f16", padding: "8px 10px", display: "flex", gap: "5px" }}>
            {(["Satirical", "Controversial", "Analytical"] as Tone[]).map(t => (
              <button
                key={t}
                onClick={() => setTone(t)}
                style={{
                  flex: 1, padding: "6px 3px", borderRadius: "6px", cursor: "pointer",
                  fontFamily: INSTRUMENT_FONT, fontSize: "7px", fontWeight: 800, letterSpacing: "0.3px",
                  border: `1px solid ${tone === t ? INK.gold : "rgba(255,255,255,0.15)"}`,
                  background: tone === t ? "rgba(214,157,65,0.15)" : "transparent",
                  color: tone === t ? INK.gold : "#8a8a95",
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Risk slider */}
          <div style={{ background: "#0e0f16", padding: "8px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontFamily: INSTRUMENT_FONT, fontSize: "7px", color: "#6b7280", letterSpacing: "0.5px" }}>RISK PROFILE</span>
              <span style={{ fontFamily: INSTRUMENT_FONT, fontSize: "7px", color: INK.gold, fontWeight: 800 }}>{riskLabel(risk)}</span>
            </div>
            <input
              type="range" min={0} max={100} value={Math.round(risk * 100)}
              onChange={e => setRisk(Number(e.target.value) / 100)}
              style={{ width: "100%", accentColor: INK.gold }}
            />
          </div>

          {/* Message thread */}
          <div ref={scrollRef} style={{
            background: "#0a0705", minHeight: "180px", maxHeight: "260px", overflowY: "auto",
            padding: "12px", display: "flex", flexDirection: "column", gap: "8px",
          }}>
            {messages.map((m, i) => {
              const prevUserMsg = m.from === "madhatr" ? [...messages].slice(0, i).reverse().find(x => x.from === "user") : null;
              return (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start", gap: "4px" }}>
                  <div style={{
                    maxWidth: "85%", padding: "9px 12px",
                    borderRadius: m.from === "user" ? "10px 0 10px 10px" : "0 10px 10px 10px",
                    background: m.from === "user" ? "rgba(0,229,255,0.12)" : "rgba(214,157,65,0.08)",
                    border: `1px solid ${m.from === "user" ? INK.borderCyan : INK.borderGold}`,
                    fontFamily: INSTRUMENT_FONT, fontSize: "10px", lineHeight: 1.55,
                    color: m.from === "user" ? "#8fe8ff" : "#ffd98a",
                  }}>
                    {m.text}
                  </div>
                  {m.from === "madhatr" && m.id !== "seed" && prevUserMsg && (
                    <button
                      onClick={() => regenerate(m.id, prevUserMsg.text)}
                      style={{
                        display: "flex", alignItems: "center", gap: "3px",
                        background: "transparent", border: `1px solid ${INK.borderGold}`,
                        borderRadius: "4px", padding: "2px 6px", cursor: "pointer",
                        fontFamily: INSTRUMENT_FONT, fontSize: "6.5px", fontWeight: 800,
                        color: (m.regenCount ?? 0) >= 1 ? "#fc3437" : INK.gold, letterSpacing: "0.5px",
                      }}
                    >
                      <RotateCw size={8} />
                      {(m.regenCount ?? 0) >= 1 ? "REGEN (SP-LEVEL)" : "REGENERATE"}
                    </button>
                  )}
                </div>
              );
            })}
            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "8px 11px", borderRadius: "0 10px 10px 10px",
                  background: "rgba(214,157,65,0.06)", border: `1px solid ${INK.borderGold}`,
                  fontFamily: INSTRUMENT_FONT, fontSize: "10px", color: "#ffd98a",
                }}>
                  The MADHAT&apos;r is typing&hellip;
                </div>
              </div>
            )}
          </div>

          {/* Input row */}
          <div style={{ display: "flex", gap: "6px", padding: "10px", borderTop: `1px solid ${INK.border}` }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") send(); }}
              placeholder="Ask The MADHAT'r about a market..."
              style={{
                flex: 1, background: "#0a0705", border: `1px solid ${INK.border}`,
                borderRadius: "8px", padding: "8px 10px", fontFamily: INSTRUMENT_FONT,
                fontSize: "10px", color: INK.white, outline: "none",
              }}
            />
            <button
              onClick={send}
              aria-label="Send message"
              style={{
                background: "rgba(214,157,65,0.15)", border: `1px solid ${INK.borderGold}`,
                borderRadius: "8px", padding: "0 12px", cursor: "pointer",
                display: "flex", alignItems: "center", color: INK.gold,
              }}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
