"use client";

/**
 * MΛĐ Gambit — DottedGlowBackground
 * ------------------------------------------------------------------
 * Canvas dot-grid animation ported 1:1 from VerdigrisTorsion flash-ui.zip
 * (components/DottedGlowBackground.tsx, Apache-2.0).
 * Replaces the static CSS radial-gradient cosmic backdrop.
 * Per-dot phase/speed randomization, glow pulse at intensity > 0.7,
 * ResizeObserver cleanup, fully SSR-safe (canvas is client-only).
 */

import React, { useEffect, useRef } from "react";

interface DottedGlowBackgroundProps {
  className?: string;
  gap?: number;
  radius?: number;
  color?: string;
  glowColor?: string;
  opacity?: number;
  speedMin?: number;
  speedMax?: number;
  speedScale?: number;
}

export default function DottedGlowBackground({
  className,
  gap = 14,
  radius = 1.5,
  color = "rgba(255,255,255,0.06)",
  glowColor = "rgba(124,255,199,0.7)",
  opacity = 1,
  speedMin = 0.4,
  speedMax = 1.2,
  speedScale = 0.7,
}: DottedGlowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stopped = false;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    setTimeout(resize, 0);

    let dots: { x: number; y: number; phase: number; speed: number }[] = [];

    const regenDots = () => {
      dots = [];
      const { width, height } = container.getBoundingClientRect();
      const cols = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;
      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5);
          const y = j * gap;
          dots.push({
            x,
            y,
            phase: Math.random() * Math.PI * 2,
            speed: speedMin + Math.random() * (speedMax - speedMin),
          });
        }
      }
    };

    regenDots();
    window.addEventListener("resize", regenDots);

    const draw = (now: number) => {
      if (stopped) return;
      const { width, height } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      const time = (now / 1000) * speedScale;

      dots.forEach((d) => {
        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod;
        const intensity = 0.1 + 0.9 * (lin * lin);

        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);

        if (intensity > 0.7) {
          ctx.fillStyle = glowColor;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 10 * (intensity - 0.7) * 3;
        } else {
          ctx.fillStyle = color;
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = opacity * (intensity > 0.7 ? 1 : 0.25 + intensity * 0.5);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", regenDots);
      ro.disconnect();
    };
  }, [gap, radius, color, glowColor, opacity, speedMin, speedMax, speedScale]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
