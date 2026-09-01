"use client";

/**
 * MAD Gambit — <HoldHint>.
 * ══════════════════════════════════════════════════════════════════════
 * Wrap any control to give it "hover, or press and hold, for what this does":
 *
 *   <HoldHint hint={{ title: "Z-Liar", body: "…", kind: "measured" }}>
 *     <button onClick={openMeter}>88.5</button>
 *   </HoldHint>
 *
 * It renders no wrapper element. The handlers are cloned onto the child, so
 * layout is untouched — no extra span to break a flex row, a grid cell, or the
 * `flex: 1 1 0` sizing the desk buttons depend on. That constraint is why this
 * clones rather than wraps: a component that quietly inserts a box into a
 * carefully-tuned instrument panel is a component nobody will apply globally,
 * and a pattern nobody applies globally is not a global pattern.
 *
 * Every handler it adds COMPOSES with one the child already has, rather than
 * replacing it. A card that already listens for pointerdown to start a drag
 * keeps its drag; a button keeps its onClick. The one deliberate exception is
 * the capture-phase click swallow after a touch hold — see use-hold-hint.ts.
 * ══════════════════════════════════════════════════════════════════════ */
import React from "react";
import { useHoldHint } from "@/hooks/use-hold-hint";
import type { HoldHintSpec } from "@/lib/hold-hint-context";

type AnyProps = Record<string, unknown>;

/**
 * Compose two prop bags: functions chain (child's first, so it can call
 * stopPropagation and mean it), everything else takes the child's value —
 * an id or aria-describedby the caller wrote is theirs, not ours to overwrite.
 */
function merge(childProps: AnyProps, ours: AnyProps): AnyProps {
  const out: AnyProps = { ...childProps };
  for (const [key, value] of Object.entries(ours)) {
    if (value === undefined) continue;
    const existing = childProps[key];
    if (typeof value === "function" && typeof existing === "function") {
      out[key] = (...args: unknown[]) => {
        (existing as (...a: unknown[]) => unknown)(...args);
        (value as (...a: unknown[]) => unknown)(...args);
      };
    } else if (existing === undefined) {
      out[key] = value;
    }
  }
  return out;
}

export interface HoldHintProps {
  /** Null or undefined disables the affordance — the child renders untouched. */
  hint?: HoldHintSpec | null;
  children: React.ReactElement;
}

export default function HoldHint({ hint, children }: HoldHintProps) {
  const triggerProps = useHoldHint(hint);
  if (!React.isValidElement(children)) return children;
  const child = children as React.ReactElement<AnyProps>;
  return React.cloneElement(child, merge(child.props, triggerProps as unknown as AnyProps));
}
