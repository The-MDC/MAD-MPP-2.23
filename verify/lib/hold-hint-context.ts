"use client";

/**
 * MAD Gambit — hold-hint context.
 * ══════════════════════════════════════════════════════════════════════
 * The shared state behind the app-wide "hover, or press and hold, to find out
 * what this does" affordance. Exactly one hint is open at a time, app-wide, and
 * it renders from a single portal near the root rather than from inside
 * whichever component opened it.
 *
 * That single-surface design is the point. A hint rendered inside its trigger
 * inherits the trigger's stacking context, its overflow clipping and its
 * transforms — which is how tooltips end up half-hidden behind a sticky header,
 * clipped by a horizontally-scrolling ticker rail, or offset by an ancestor's
 * `transform`. Every one of those containers exists in this app already. One
 * portal, positioned from a viewport rect, has none of those failure modes.
 *
 * The context is split out from the provider so `useHoldHint` can consume it
 * without importing the provider component, and the provider can import the
 * hook's types without a cycle.
 * ══════════════════════════════════════════════════════════════════════ */
import { createContext, useContext } from "react";

export interface HoldHintAction {
  label: string;
  /** Run on activation. The hint closes itself afterwards. */
  onSelect: () => void;
}

export interface HoldHintSpec {
  /** Short noun phrase — what this control IS. */
  title: string;
  /** One or two sentences: what it does, or what to do with it. */
  body: string;
  /**
   * Optional third line for the number's provenance — "measured", "estimated",
   * "sample" — reusing the honesty vocabulary MetricPopover established rather
   * than inventing a second one.
   */
  kind?: "measured" | "estimated" | "sample";
  /** Optional single action, e.g. "Open the market", "Read the source". */
  action?: HoldHintAction;
}

export interface OpenHint {
  spec: HoldHintSpec;
  /** Viewport rect of the trigger at open time. */
  rect: { top: number; left: number; width: number; height: number };
  /** Element id used for aria-describedby wiring on the trigger. */
  id: string;
}

export interface HoldHintController {
  open: (hint: OpenHint) => void;
  /** Closes only if `id` still owns the surface — avoids a stale close racing a new open. */
  close: (id: string) => void;
  /** Id of the currently open hint, or null. Triggers use it for aria + styling. */
  openId: string | null;
}

/**
 * Default is a no-op rather than a throw. A component carrying a hint must
 * still render outside the provider — in a test, in a Storybook-style harness,
 * or in a subtree someone forgot to wrap — and losing the hint is a far better
 * failure than crashing the page that contains it.
 */
export const HoldHintContext = createContext<HoldHintController>({
  open: () => {},
  close: () => {},
  openId: null,
});

export const useHoldHintController = (): HoldHintController => useContext(HoldHintContext);
