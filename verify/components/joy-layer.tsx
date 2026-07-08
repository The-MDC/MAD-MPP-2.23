"use client";

/**
 * MAD Gambit — Joy Layer
 * ------------------------------------------------------------------
 * Topshelf reward-moment polish. A page-level particle + flash canvas
 * that fires on the platform's high points (opening packs, entering the
 * arena/casino, wins). Any component can trigger it:
 *
 *     import { celebrate } from "@/components/joy-layer";
 *     celebrate({ intensity: 0.8 });            // center burst
 *     celebrate({ x, y, colors: [...] });       // from a point
 *
 * Mounted once at page level. Because it renders `position: fixed`, on
 * desktop it inherits the DeviceFrame's transform containing-block and
 * stays *inside the phone*. Honors prefers-reduced-motion (no-op).
 *
 * Note: intentionally not labelled with any behavioural-psychology
 * terminology in shipped copy — this is delight, framed as delight.
 */

import React, { useEffect, useRef } from "react";
import { INK } from "@/lib/gambit-design-tokens";

const DEFAULT_COLORS = [INK.gold, INK.cyan, INK.pink, INK.green, "#fffcf0"];

interface CelebrateDetail { x?: number; y?: number; intensity?: number; colors?: string[]; }

/** Fire a celebration burst from anywhere in the app. */
export function celebrate(detail: CelebrateDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("madgambit:celebrate", { detail }));
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; max: number;
  size: number; color: string; rot: number; vr: number; shape: 0 | 1;
}

export default function JoyLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number | undefined>(undefined);
  const flash = useRef<{ t: number; color: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (detail: CelebrateDetail) => {
      const W = window.innerWidth, H = window.innerHeight;
      const cx = detail.x ?? W / 2;
      const cy = detail.y ?? H * 0.38;
      const intensity = Math.max(0.2, Math.min(1.4, detail.intensity ?? 0.8));
      const colors = detail.colors?.length ? detail.colors : DEFAULT_COLORS;
      const count = Math.round(70 * intensity);
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = (2 + Math.random() * 7) * (0.7 + intensity * 0.6);
        particles.current.push({
          x: cx, y: cy,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - 3,
          life: 0, max: 60 + Math.random() * 40,
          size: 3 + Math.random() * 4,
          color: colors[(Math.random() * colors.length) | 0],
          rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
          shape: Math.random() > 0.5 ? 0 : 1,
        });
      }
      flash.current = { t: 0, color: colors[0] };
      if (!raf.current) loop();
    };

    const loop = () => {
      const W = window.innerWidth, H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      // gold radial flash
      if (flash.current) {
        flash.current.t += 1;
        const a = Math.max(0, 0.22 - flash.current.t * 0.012);
        if (a > 0) {
          const g = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, Math.max(W, H) * 0.6);
          g.addColorStop(0, flash.current.color + Math.round(a * 255).toString(16).padStart(2, "0"));
          g.addColorStop(1, "#00000000");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        } else flash.current = null;
      }

      const alive: Particle[] = [];
      for (const p of particles.current) {
        p.life += 1;
        p.vy += 0.16;            // gravity
        p.vx *= 0.99;            // drag
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        const a = 1 - p.life / p.max;
        if (a <= 0 || p.y > H + 40) continue;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 1.5, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        alive.push(p);
      }
      particles.current = alive;

      if (alive.length || flash.current) raf.current = requestAnimationFrame(loop);
      else { raf.current = undefined; ctx.clearRect(0, 0, W, H); }
    };

    const onCelebrate = (e: Event) => spawn((e as CustomEvent<CelebrateDetail>).detail || {});
    window.addEventListener("madgambit:celebrate", onCelebrate);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("madgambit:celebrate", onCelebrate);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60 }}
    />
  );
}
