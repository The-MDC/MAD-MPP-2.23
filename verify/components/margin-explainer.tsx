"use client";

/**
 * MAD Gambit — Margin Explainer.
 *
 * On desktop the app runs inside the phone bezel, which leaves the workbench
 * margins empty. This uses them: the section you are looking at (any element
 * with `data-explain="<key>"`) gets a short blurb — what it is, the formula that
 * runs it, the file it lives in — pinned beside the phone. Tapping a section
 * pins its explainer for a few seconds so a presenter can point at it.
 *
 * Mounted once in the root layout, outside DeviceFrame: `.mg-device` carries a
 * transform, so anything fixed inside it would anchor to the phone, not the
 * window. Hidden below 1024px, where there is no margin to use.
 */
import React, { useEffect, useRef, useState } from "react";
import { explainerFor, type Explainer } from "@/lib/explainers";

const PANEL_W = 300;
const GAP = 28;
const PIN_MS = 9000;

export default function MarginExplainer() {
  const [key, setKey] = useState<string | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const ratios = useRef(new Map<Element, number>());
  const pinnedUntil = useRef(0);
  const pinnedKey = useRef<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    const seen = new Set<Element>();

    const pickVisible = () => {
      if (Date.now() < pinnedUntil.current && pinnedKey.current) {
        setKey(pinnedKey.current);
        return;
      }
      let best: Element | null = null;
      let bestR = 0;
      ratios.current.forEach((r, el) => {
        if (r > bestR) { bestR = r; best = el; }
      });
      const k = best ? (best as Element).getAttribute("data-explain") : null;
      if (k) setKey(k);
    };

    const place = () => {
      const dev = document.querySelector(".mg-device");
      if (!dev || !mq.matches) { setPos(null); return; }
      // Right margin first (the workbench's own widgets sit top-left and
      // top-right, so start below the top-right status panel); fall back to
      // the left margin below the mesh widget; hide if neither fits.
      const r = dev.getBoundingClientRect();
      const right = r.right + GAP;
      const left = r.left - GAP - PANEL_W;
      if (right + PANEL_W <= window.innerWidth - 16) setPos({ left: right, top: Math.max(160, r.top + 140) });
      else if (left >= 16) setPos({ left, top: Math.max(330, r.top + 300) });
      else setPos(null);
    };

    const wire = () => {
      const root = document.querySelector(".mg-device-scroll");
      io?.disconnect();
      ratios.current.clear();
      seen.clear();
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => ratios.current.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
          pickVisible();
        },
        { root: root ?? null, threshold: [0, 0.15, 0.35, 0.6, 0.85, 1] },
      );
      const observe = () => {
        document.querySelectorAll("[data-explain]").forEach((el) => {
          if (!seen.has(el)) { seen.add(el); io?.observe(el); }
        });
      };
      observe();
      mo?.disconnect();
      mo = new MutationObserver(() => observe());
      mo.observe(root ?? document.body, { childList: true, subtree: true });
    };

    // Hover reads like a tap but pins for less time, so moving the pointer
    // across the phone walks the margin through each section's maths.
    let lastHover: string | null = null;
    const onOver = (ev: MouseEvent) => {
      const t = ev.target as Element | null;
      const host = t && t.closest ? t.closest("[data-explain]") : null;
      const k = host ? host.getAttribute("data-explain") : null;
      if (k && k !== lastHover) {
        lastHover = k;
        pinnedKey.current = k;
        pinnedUntil.current = Date.now() + 4000;
        setKey(k);
      }
    };
    const onClick = (ev: MouseEvent) => {
      const t = ev.target as Element | null;
      const host = t && t.closest ? t.closest("[data-explain]") : null;
      const k = host ? host.getAttribute("data-explain") : null;
      if (k) {
        pinnedKey.current = k;
        pinnedUntil.current = Date.now() + PIN_MS;
        setKey(k);
      }
    };

    wire();
    place();
    const ro = new ResizeObserver(place);
    const dev = document.querySelector(".mg-device");
    if (dev) ro.observe(dev);
    window.addEventListener("resize", place);
    document.addEventListener("click", onClick, true);
    document.addEventListener("mouseover", onOver, true);
    mq.addEventListener("change", place);
    return () => {
      io?.disconnect();
      mo?.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", place);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mouseover", onOver, true);
      mq.removeEventListener("change", place);
    };
  }, []);

  const ex: Explainer | null = explainerFor(key);
  if (!pos || !ex) return null;

  return (
    <aside className="mg-margin-explainer" style={{ left: pos.left, top: pos.top, width: PANEL_W }} aria-live="polite" key={key ?? ""}>
      <div className="mg-mx-tag">You are here</div>
      <div className="mg-mx-kicker">{ex.kicker}</div>
      <div className="mg-mx-title mg-display">{ex.title}</div>
      <div className="mg-mx-formula">
        {ex.formula.map((f) => (
          <div key={f}>{f}</div>
        ))}
      </div>
      <p className="mg-mx-body">{ex.body}</p>
      <div className="mg-mx-source">{ex.source}</div>
    </aside>
  );
}
