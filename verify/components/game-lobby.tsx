"use client";

/**
 * MAD Gambit — Game Lobby (live chat + wall)
 * ------------------------------------------------------------------
 * Gamer-voted dopamine pattern: Discord-style channels + presence,
 * Twitch-style instant reactions, a shareable Wall feed, micro-feedback
 * springs, and 16-day ephemerality (scarcity → return visits).
 *
 * Channels: Main Lobby · Game Talk · Trading  (live chat)
 * Wall:     subject (required) · auto username · tweet-sized body (280) ·
 *           image/GIF/PNG attach only (no docs, no video).
 * Everything auto-expires after 16 DAYS.
 *
 * No backend: text persists in localStorage (16-day filtered on load);
 * image attachments are session-only object URLs. INK tokens, reduced-motion
 * friendly, SSR-safe.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ImagePlus, Hash, StickyNote, Users, X } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";
import { celebrate } from "@/components/joy-layer";

const EXPIRY_MS = 16 * 24 * 60 * 60 * 1000; // 16 days
const MAX_TWEET = 280;
const CHANNELS = ["Main Lobby", "Game Talk", "Trading"] as const;
const REACTIONS = ["🔥", "😂", "💀", "🚀", "🎩"];
type Channel = (typeof CHANNELS)[number] | "Wall";

interface Msg {
  id: string; channel: Channel; user: string; ts: number;
  text: string; subject?: string; img?: string; reactions: Record<string, number>;
}

function handle(): string {
  if (typeof window === "undefined") return "Degen";
  let h = window.localStorage.getItem("madgambit.handle");
  if (!h) { h = `Degen#${1000 + Math.floor(Math.random() * 8999)}`; window.localStorage.setItem("madgambit.handle", h); }
  return h;
}
const fresh = (m: Msg) => Date.now() - m.ts < EXPIRY_MS;
const daysLeft = (ts: number) => Math.max(0, Math.ceil((EXPIRY_MS - (Date.now() - ts)) / 86400000));

const SEED: Msg[] = [
  { id: "s1", channel: "Main Lobby", user: "Degen#4821", ts: Date.now() - 3600e3, text: "gm degens, chaos meter is COOKING today 🔥", reactions: { "🔥": 12 } },
  { id: "s2", channel: "Game Talk",  user: "MADHATr",    ts: Date.now() - 1800e3, text: "who's running the Cull Arena ladder tonight?", reactions: { "🚀": 5 } },
  { id: "s3", channel: "Trading",    user: "Degen#7788", ts: Date.now() - 900e3,  text: "WTS Golden Hand serial #7888 — make offers", reactions: { "💀": 3 } },
];

export default function GameLobby() {
  const [channel, setChannel] = useState<Channel>("Main Lobby");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [img, setImg] = useState<string | null>(null);
  const me = useMemo(() => handle(), []);
  const online = useMemo(() => 120 + Math.floor(Math.random() * 260), []);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(window.localStorage.getItem("madgambit.lobby") || "[]") as Msg[];
      const merged = [...SEED, ...saved].filter(fresh);
      setMsgs(merged);
    } catch { setMsgs(SEED); }
  }, []);

  const persist = (next: Msg[]) => {
    setMsgs(next);
    if (typeof window !== "undefined") {
      // persist text only (images are session object URLs) + keep it fresh
      const store = next.filter((m) => !m.id.startsWith("s")).map(({ img: _img, ...m }) => m).filter(fresh);
      window.localStorage.setItem("madgambit.lobby", JSON.stringify(store));
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) setImg(URL.createObjectURL(f)); // image-only (gif/png/jpg/webp)
    e.target.value = "";
  };

  const post = () => {
    const isWall = channel === "Wall";
    if (isWall && !subject.trim()) return;
    if (!text.trim() && !img) return;
    const m: Msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channel, user: me, ts: Date.now(),
      text: text.slice(0, MAX_TWEET), subject: isWall ? subject.trim() : undefined,
      img: img || undefined, reactions: {},
    };
    persist([...msgs, m]);
    setText(""); setSubject(""); setImg(null);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) { try { navigator.vibrate(8); } catch {} }
    if (isWall) celebrate({ intensity: 0.7, colors: [INK.gold, INK.cyan] });
  };

  const react = (id: string, emo: string) => {
    persist(msgs.map((m) => m.id === id ? { ...m, reactions: { ...m.reactions, [emo]: (m.reactions[emo] || 0) + 1 } } : m));
  };

  const view = msgs.filter((m) => m.channel === channel && fresh(m));
  const isWall = channel === "Wall";

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: INK.borderGold, background: "rgba(8,10,18,0.6)" }}>
      {/* header + presence */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: INK.border, background: INK.bgPanel }}>
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest" style={{ color: INK.gold }}>MAD Gambit Lobby</span>
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: INK.green }}>
          <Users className="w-3.5 h-3.5" /><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: INK.green }} /><span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: INK.green }} /></span>
          {online} online
        </span>
      </div>

      {/* channel tabs */}
      <div className="flex gap-1 px-2 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {[...CHANNELS, "Wall" as const].map((c) => {
          const on = channel === c;
          return (
            <button key={c} type="button" onClick={() => setChannel(c)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
              style={{ color: on ? "#05070c" : INK.muted, background: on ? INK.gold : "transparent", border: `1px solid ${on ? INK.gold : INK.border}` }}>
              {c === "Wall" ? <StickyNote className="w-3 h-3" /> : <Hash className="w-3 h-3" />}{c}
            </button>
          );
        })}
      </div>

      {/* stream */}
      <div className="px-3 pb-2 space-y-2 max-h-[340px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence initial={false}>
          {view.length === 0 && <p className="font-mono text-[10px] text-center py-6" style={{ color: INK.muted }}>No {isWall ? "posts" : "messages"} yet — start it off.</p>}
          {view.map((m) => (
            <motion.div key={m.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl border p-2.5" style={{ borderColor: INK.border, background: INK.bgCard }}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-[10px] font-bold" style={{ color: INK.cyan }}>{m.user}</span>
                <span className="font-mono text-[8px]" style={{ color: INK.muted }}>· expires in {daysLeft(m.ts)}d</span>
              </div>
              {m.subject && <p className="font-mono text-[11px] font-black uppercase tracking-wide mb-0.5" style={{ color: INK.gold }}>{m.subject}</p>}
              {m.text && <p className="font-sans text-[12px]" style={{ color: INK.white }}>{m.text}</p>}
              {m.img && <img src={m.img} alt="attachment" className="mt-1.5 rounded-lg max-h-40 w-auto" />}
              <div className="flex gap-1 mt-1.5">
                {REACTIONS.map((e) => (
                  <button key={e} type="button" onClick={() => react(m.id, e)}
                    className="px-1.5 py-0.5 rounded-md text-[11px] active:scale-90 transition-transform"
                    style={{ background: m.reactions[e] ? `${INK.gold}1f` : "transparent" }}>
                    {e}{m.reactions[e] ? <span className="ml-0.5 font-mono text-[9px]" style={{ color: INK.gold }}>{m.reactions[e]}</span> : null}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* composer */}
      <div className="border-t p-2.5 space-y-2" style={{ borderColor: INK.border, background: INK.bgPanel }}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: INK.muted }}>as</span>
          <span className="font-mono text-[10px] font-bold" style={{ color: INK.cyan }}>{me}</span>
        </div>
        {isWall && (
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={60} placeholder="Subject (required)"
            className="w-full px-3 py-2 rounded-lg font-mono text-[12px] outline-none"
            style={{ background: INK.bgCard, color: INK.white, border: `1px solid ${subject.trim() ? INK.borderGold : INK.border}` }} />
        )}
        {img && (
          <div className="relative inline-block">
            <img src={img} alt="preview" className="h-16 rounded-lg" />
            <button type="button" onClick={() => setImg(null)} aria-label="Remove image"
              className="absolute -top-1.5 -right-1.5 rounded-full p-0.5" style={{ background: INK.pink, color: "#fff" }}><X className="w-3 h-3" /></button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_TWEET))} rows={1}
            placeholder={isWall ? "Post to the wall…" : `Message #${channel}…`}
            className="flex-1 px-3 py-2 rounded-lg font-sans text-[13px] resize-none outline-none"
            style={{ background: INK.bgCard, color: INK.white, border: `1px solid ${INK.border}` }} />
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={onPick} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach image or GIF"
            className="p-2 rounded-lg active:scale-90 transition-transform" style={{ color: INK.cyan, border: `1px solid ${INK.border}` }}><ImagePlus className="w-4 h-4" /></button>
          <button type="button" onClick={post} aria-label="Send"
            className="p-2 rounded-lg active:scale-90 transition-transform" style={{ background: INK.gold, color: "#05070c" }}><Send className="w-4 h-4" /></button>
        </div>
        <div className="flex justify-between font-mono text-[8px] uppercase tracking-wider" style={{ color: INK.muted }}>
          <span>images/GIF only · no docs/video</span>
          <span style={{ color: text.length > MAX_TWEET - 20 ? INK.pink : INK.muted }}>{MAX_TWEET - text.length}</span>
        </div>
      </div>
    </div>
  );
}
