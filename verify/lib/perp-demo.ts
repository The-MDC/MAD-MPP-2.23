/**
 * MAD Gambit — demo fixtures for the three perp families.
 * ────────────────────────────────────────────────────────────────
 * House convention (see markets/proposals): every surface renders without a
 * database by running DEMO DATA through the REAL MATH. Nothing here fakes a
 * decomposition — the vectors below are observations, and `decompose()` does
 * the same work it does in production.
 *
 * The subjects are institutional and archetypal on purpose. A demo fixture is
 * the easiest place in a codebase for a named individual to end up permanently,
 * and §6.2 says a named subject may not exist without a registered portrait key
 * — which a fixture, by construction, cannot have.
 */
import type { FaceId } from "@/lib/persona-codex";
import { decompose, detectSlip } from "@/lib/persona-decompose";
import { currentLeg, nextLegClose } from "@/lib/lunar-legs";
import type { PerpFamily, PerpMarket } from "@/lib/perp-store";

export interface DemoFaces {
  id: string;
  title: string;
  subjectRef: string;
  observed: Record<FaceId, number>;
  shocks: Record<FaceId, number>;
}

export const DEMO_FACES: readonly DemoFaces[] = [
  {
    id: "faces-demo-legacy-bank",
    title: "THE LEGACY BANK — which face is permanent?",
    subjectRef: "subj_demo_legacy_bank",
    observed: { saint: 0.08, white_rice: 0.34, megalomaniac: 0.31, narcissist: 0.09, prostitute: 0.18 },
    shocks: { saint: -0.4, white_rice: 0.1, megalomaniac: 0.6, narcissist: 0.0, prostitute: 0.2 },
  },
  {
    id: "faces-demo-wellness-brand",
    title: "THE WELLNESS BRAND — saint or sellout?",
    subjectRef: "subj_demo_wellness_brand",
    observed: { saint: 0.41, white_rice: 0.12, megalomaniac: 0.05, narcissist: 0.14, prostitute: 0.28 },
    shocks: { saint: 0.3, white_rice: 0.0, megalomaniac: -0.1, narcissist: 0.2, prostitute: 0.5 },
  },
  {
    id: "faces-demo-frontier-lab",
    title: "THE FRONTIER LAB — mission, or the size of the mission?",
    subjectRef: "subj_demo_frontier_lab",
    observed: { saint: 0.22, white_rice: 0.06, megalomaniac: 0.44, narcissist: 0.2, prostitute: 0.08 },
    shocks: { saint: -0.2, white_rice: 0.0, megalomaniac: 0.8, narcissist: 0.45, prostitute: -0.1 },
  },
];

/** A demo market row shaped exactly like a persisted one, so clients can't tell. */
export function demoMarket(d: DemoFaces, family: PerpFamily = "faces", nowMs = Date.now()): PerpMarket {
  const leg = currentLeg(nowMs);
  return {
    id: d.id,
    family,
    subjectRef: d.subjectRef,
    subjectClass: "institution",
    title: d.title,
    status: "open",
    legIndex: 0,
    legOpenedAt: new Date(leg.openedAt).toISOString(),
    legClosesAt: new Date(nextLegClose(nowMs)).toISOString(),
    paramCommit: null,
    paramEpoch: 0,
    volume: 0,
    details: { demo: true },
    createdAt: new Date(leg.openedAt).toISOString(),
    updatedAt: new Date(nowMs).toISOString(),
  };
}

/** Run a demo subject through the real decomposition. */
export function demoDecomposition(d: DemoFaces) {
  const result = decompose({
    observed: [d.observed.saint, d.observed.white_rice, d.observed.megalomaniac, d.observed.narcissist, d.observed.prostitute],
    shocks: [d.shocks.saint, d.shocks.white_rice, d.shocks.megalomaniac, d.shocks.narcissist, d.shocks.prostitute],
  });
  return { result, slip: detectSlip(result.reading) };
}

export function findDemoFaces(id: string): DemoFaces | null {
  return DEMO_FACES.find((d) => d.id === id) ?? null;
}
