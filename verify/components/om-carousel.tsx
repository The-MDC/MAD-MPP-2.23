"use client";

/**
 * MAD Gambit — fluid market carousel.
 *
 * Native horizontal scroll with snap (so touch and trackpads get the browser's
 * own momentum), plus mouse drag-to-fling on desktop and arrow buttons. While a
 * drag is in flight snapping is suspended, then the track glides to the
 * nearest card. A drag never fires the click on the card under the pointer.
 */
import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function OMCarousel({ children, cardWidth = 260, gap = 12, label }: { children: React.ReactNode; cardWidth?: number; gap?: number; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: 0, v: 0, t: 0 });
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = () => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  useEffect(() => { measure(); }, [children]);

  const nudge = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * (cardWidth + gap) * Math.max(1, Math.floor(el.clientWidth / (cardWidth + gap))), behavior: "smooth" });
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = { down: true, x: e.clientX, left: track.current.scrollLeft, moved: 0, v: 0, t: performance.now() };
    track.current.style.scrollSnapType = "none";
    track.current.style.cursor = "grabbing";
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = track.current;
    if (!d.down || !el) return;
    const dx = e.clientX - d.x;
    const now = performance.now();
    d.v = (el.scrollLeft - (d.left - dx)) / Math.max(1, now - d.t);
    d.t = now;
    d.moved = Math.max(d.moved, Math.abs(dx));
    el.scrollLeft = d.left - dx;
  };
  const onUp = () => {
    const d = drag.current;
    const el = track.current;
    if (!d.down || !el) return;
    d.down = false;
    el.style.cursor = "";
    // Fling: carry a little of the release velocity, then snap.
    const fling = Math.max(-1, Math.min(1, d.v)) * -(cardWidth + gap) * 0.9;
    const step = cardWidth + gap;
    const target = Math.round((el.scrollLeft + fling) / step) * step;
    el.scrollTo({ left: target, behavior: "smooth" });
    window.setTimeout(() => { if (track.current) track.current.style.scrollSnapType = ""; }, 420);
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved > 6) { e.preventDefault(); e.stopPropagation(); drag.current.moved = 0; }
  };

  return (
    <div className="mg-carousel" style={{ position: "relative" }}>
      <div
        ref={track}
        role="region"
        aria-label={label}
        className="mg-carousel-track"
        onScroll={measure}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onClickCapture={onClickCapture}
        style={{ ["--mg-card-w" as string]: `${cardWidth}px`, ["--mg-gap" as string]: `${gap}px` }}
      >
        {React.Children.map(children, (c) => <div className="mg-carousel-item">{c}</div>)}
      </div>
      {!edges.start ? <button type="button" aria-label="Scroll left" className="mg-carousel-arrow" style={{ left: 4 }} onClick={() => nudge(-1)}><ChevronLeft size={18} /></button> : null}
      {!edges.end ? <button type="button" aria-label="Scroll right" className="mg-carousel-arrow" style={{ right: 4 }} onClick={() => nudge(1)}><ChevronRight size={18} /></button> : null}
    </div>
  );
}
