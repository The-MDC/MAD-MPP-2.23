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
import Image from "next/image";
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

export default function MadhatrConcierge({ uid = "concierge" }: { uid?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([SEED_MESSAGE]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [tone, setTone] = useState<Tone>("Satirical");
  const [risk, setRisk] = useState(0.75);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { id: `u_${Date.now()}`, from: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, {
        id: `h_${Date.now()}`, from: "madhatr",
        text: pickReply(text, tone, risk, 0), regenCount: 0,
      }]);
    }, 650 + Math.random() * 500);
  }, [input, tone, risk]);

  const regenerate = useCallback((msgId: string, originalUserText: string) => {
    setMessages(m => m.map(msg => {
      if (msg.id !== msgId) return msg;
      const nextCount = (msg.regenCount ?? 0) + 1;
      return { ...msg, regenCount: nextCount, text: pickReply(originalUserText, tone, risk, nextCount) };
    }));
  }, [tone, risk]);

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 200 }}>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open MADHAT'r concierge"
          style={{
            width: "60px", height: "60px", borderRadius: "50%", border: "none",
            cursor: "pointer", position: "relative", overflow: "visible",
            background: "transparent", padding: 0,
          }}
        >
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ position: "absolute", inset: 0 }}>
            <defs>
              <linearGradient id={`fab-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                {GOLD_CHISEL_STOPS.map(([offset, c]) => <stop key={offset} offset={`${offset}%`} stopColor={c} />)}
              </linearGradient>
            </defs>
            <circle cx="30" cy="30" r="29" fill={`url(#fab-gold-${uid})`} />
            <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" />
            <circle cx="30" cy="30" r="24" fill="#0a0a12" />
          </svg>
          <div style={{
            position: "absolute", inset: "9px", borderRadius: "50%", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Image
              src="/brand/madhatr-logo.png"
              alt="The MADHAT'r"
              width={42}
              height={42}
              style={{ objectFit: "contain" }}
            />
          </div>
          <div style={{
            position: "absolute", top: "-2px", right: "-2px",
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
              <div style={{
                width: "30px", height: "30px", borderRadius: "50%", background: "#0a0a12",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.3)",
              }}>
                <Image src="/brand/madhatr-logo.png" alt="" width={24} height={24} style={{ objectFit: "contain" }} />
              </div>
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
                  background: tone === t ? "rgba(255,215,0,0.15)" : "transparent",
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
                    background: m.from === "user" ? "rgba(0,229,255,0.12)" : "rgba(255,215,0,0.08)",
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
                        color: (m.regenCount ?? 0) >= 1 ? "#ff007f" : INK.gold, letterSpacing: "0.5px",
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
                  background: "rgba(255,215,0,0.06)", border: `1px solid ${INK.borderGold}`,
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
                background: "rgba(255,215,0,0.15)", border: `1px solid ${INK.borderGold}`,
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
