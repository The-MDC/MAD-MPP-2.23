import { describe, it, expect } from "vitest";
import {
  buildOnChainPayload,
  personalDataLeaks,
  verifiabilityCopy,
  type InstitutionalSubject,
  type NamedIndividualSubject,
} from "@/lib/portrait-metadata";
import {
  assertDeletableStore,
  assertProductionKms,
  createLocalKmsAdapter,
  createLocalObjectStore,
  erasureSlaCopy,
  openPortrait,
  sealPortrait,
  shredSubject,
  AWS_DESTROY_WINDOW_MS,
  type CiphertextPointer,
  type KmsAdapter,
  type ObjectStore,
} from "@/lib/portrait-vault";
import {
  READINESS_WORKSTREAMS,
  evaluateReadiness,
  laneFor,
  preScreen,
  slaDueAt,
  LISTING_SLA_HOURS,
  TRUSTED_FLAGGER_SLA_HOURS,
  type EligibilityClaim,
  type ReadinessRow,
} from "@/lib/registrar-queue";
import { normaliseIdentity } from "@/lib/subject-identity-map";
import { FACE_ORDER } from "@/lib/persona-codex";

const uniform = () => {
  const r = {} as Record<(typeof FACE_ORDER)[number], number>;
  for (const f of FACE_ORDER) r[f] = 1 / FACE_ORDER.length;
  return r;
};

/**
 * INTERLOCK layer 3 (§6.2.4): "for every named-individual fixture, assert the
 * on-chain payload contains no name, no persona label and no persona values."
 *
 * The fixtures below are the whole point of this suite. If someone adds a
 * named-subject shape later, it belongs in this array.
 */
async function namedFixtures(
  kms: KmsAdapter,
  store: ObjectStore,
): Promise<NamedIndividualSubject[]> {
  const a = await sealPortrait(kms, store, "subj_fixture_alpha", {
    // Deliberately stuffed with exactly the data that must NOT reach a chain,
    // so a leak in the builder shows up here rather than in production.
    name: "A Named Living Person",
    crowned: "prostitute",
    permanent: uniform(),
  });
  const b = await sealPortrait(kms, store, "subj_fixture_bravo", {
    name: "Another Named Living Person",
    crowned: "saint",
  });
  return [
    { kind: "named_individual", subjectRef: "subj_fixture_alpha", legIndex: 3, ciphertext: a.pointer, isSlip: true },
    { kind: "named_individual", subjectRef: "subj_fixture_bravo", legIndex: 7, ciphertext: b.pointer, isSlip: false },
  ];
}

describe("INTERLOCK layer 3 — named payloads carry no personal data", () => {
  it("emits only subjectRef, legIndex, ciphertextRef and slip", async () => {
    const kms = createLocalKmsAdapter();
    const store = createLocalObjectStore();
    for (const subject of await namedFixtures(kms, store)) {
      const payload = buildOnChainPayload(subject);
      expect(payload.track).toBe("named");
      expect(Object.keys(payload).sort()).toEqual(
        ["ciphertextRef", "legIndex", "slip", "subjectRef", "track"].sort(),
      );
      expect(personalDataLeaks(payload)).toEqual([]);
    }
  });

  it("catches a persona label smuggled into a permitted string field", () => {
    // The shape a careless refactor actually produces: right key set, wrong
    // value. A key-set assertion alone would pass this.
    const smuggled = {
      track: "named" as const,
      subjectRef: "subj_fixture_alpha",
      legIndex: 3,
      ciphertextRef: "portraits/THE PROSTITUTE/abc",
      slip: true,
    };
    expect(personalDataLeaks(smuggled).length).toBeGreaterThan(0);
  });

  it("leaves the institutional track fully verifiable, as specified", () => {
    const inst: InstitutionalSubject = {
      kind: "institution",
      subjectRef: "subj_demo_legacy_bank",
      displayName: "THE LEGACY BANK",
      legIndex: 2,
      crownedFace: "megalomaniac",
      permanent: uniform(),
      transitory: uniform(),
      divergence: 0.1,
      isSlip: false,
    };
    const payload = buildOnChainPayload(inst);
    expect(payload.track).toBe("institutional");
    // No personal data means no constraint — the full payload is the product.
    expect(personalDataLeaks(payload)).toEqual([]);
    expect(verifiabilityCopy(payload)).toMatch(/permanently/i);
  });

  it("states the narrower verifiability claim for named subjects", () => {
    // §6.2.1's honest qualifier. A collector who discovers the limitation later
    // is a collector who stops trusting the whole series.
    const copy = verifiabilityCopy({
      track: "named",
      subjectRef: "subj_fixture_alpha",
      legIndex: 1,
      ciphertextRef: "portraits/x",
      slip: false,
    });
    expect(copy).toMatch(/unreadable/i);
    expect(copy).not.toMatch(/permanently verifiable/i);
  });
});

describe("portrait vault — crypto-shredding", () => {
  it("round-trips a sealed payload and makes it unreadable after shredding", async () => {
    const kms = createLocalKmsAdapter();
    const store = createLocalObjectStore();
    const sealed = await sealPortrait(kms, store, "subj_shred_test", { name: "Someone", crowned: "saint" });

    expect(await openPortrait(kms, store, sealed.keyRef, sealed.pointer)).toEqual({
      name: "Someone",
      crowned: "saint",
    });

    const result = await shredSubject(kms, store, sealed.keyRef, [sealed.pointer]);
    expect(result.objectsDeleted).toBe(1);
    await expect(openPortrait(kms, store, sealed.keyRef, sealed.pointer)).rejects.toThrow();
  });

  it("uses ONE key per subject, so a single erasure reaches every leg", async () => {
    // Per-token keys would turn one erasure request into an unbounded sweep.
    const kms = createLocalKmsAdapter();
    const store = createLocalObjectStore();
    const leg1 = await sealPortrait(kms, store, "subj_multi_leg", { leg: 1 });
    const leg2 = await sealPortrait(kms, store, "subj_multi_leg", { leg: 2 }, leg1.keyRef);
    expect(leg2.keyRef).toBe(leg1.keyRef);
    expect(leg2.pointer).not.toBe(leg1.pointer);

    await shredSubject(kms, store, leg1.keyRef, [leg1.pointer, leg2.pointer]);
    await expect(openPortrait(kms, store, leg1.keyRef, leg2.pointer)).rejects.toThrow();
  });

  it("refuses the local adapter and immutable stores for named subjects", () => {
    expect(() => assertProductionKms(createLocalKmsAdapter())).toThrow(/HSM/);
    expect(() => assertDeletableStore(createLocalObjectStore())).not.toThrow();
    // IPFS / Arweave shaped: immutable, and therefore unshreddable.
    const immutable: ObjectStore = {
      deletable: false,
      async put(k) { return k; },
      async get() { return null; },
      async delete() {},
    };
    expect(() => assertDeletableStore(immutable)).toThrow(/deletable/);
  });

  it("publishes the destroy window as a window, never as 'immediate'", () => {
    const awsish: KmsAdapter = { ...createLocalKmsAdapter(), provider: "aws-kms", destroyWindowMs: AWS_DESTROY_WINDOW_MS };
    const copy = erasureSlaCopy(awsish);
    expect(copy).toMatch(/7 days/);
    expect(copy).toMatch(/cannot be shortened/i);
    // "requested immediately, completes within a window" is the honest claim.
    // "erasure is instant" is the one the infrastructure cannot honour.
    expect(copy).not.toMatch(/completes immediately|instantly|instant erasure/i);
  });
});

describe("§9.1 triage — hard blocks have no override", () => {
  const strongBar: EligibilityClaim = {
    bar: "public_office",
    evidence: ["parliamentary register", "national broadcast interview"],
  };

  it("blocks a minor even with the strongest eligibility claim", () => {
    const r = preScreen({ ...strongBar, isMinor: true });
    expect(r.decision).toBe("deny");
    expect(r.blockReason).toBe("minor");
    expect(r.bar).toBeNull();
  });

  it("blocks each hard-blocked category regardless of the bar", () => {
    const cases: [Partial<EligibilityClaim>, string][] = [
      [{ isMinor: true }, "minor"],
      [{ mapsProtectedClass: true }, "protected_class_mapping"],
      [{ outsidePublicRole: true }, "outside_public_role"],
      [{ isPrivateIndividual: true }, "private_individual"],
    ];
    for (const [flag, reason] of cases) {
      const r = preScreen({ ...strongBar, ...flag });
      expect(r.decision).toBe("deny");
      expect(r.blockReason).toBe(reason);
    }
  });

  it("approves only an objective bar with corroborating evidence", () => {
    expect(preScreen(strongBar).decision).toBe("approve");
    expect(preScreen({ bar: "public_office", evidence: ["one link"] }).decision).toBe("escalate");
    expect(preScreen({ evidence: ["a", "b"] }).decision).toBe("escalate");
  });

  it("routes every appeal and the highest-risk cell to a human", () => {
    const escalate = preScreen({ bar: "public_office", evidence: [] });
    expect(laneFor({ preScreen: escalate, isAppeal: true })).toBe("human");
    expect(laneFor({ preScreen: preScreen(strongBar), isAppeal: true })).toBe("human");
    expect(laneFor({ preScreen: preScreen(strongBar), highestRiskCell: true })).toBe("human");
    expect(laneFor({ preScreen: escalate })).toBe("judge");
    expect(laneFor({ preScreen: preScreen(strongBar) })).toBe("classifier");
  });

  it("gives trusted flaggers the priority lane", () => {
    const now = Date.UTC(2026, 7, 1);
    const normal = slaDueAt("listing", false, now);
    const flagged = slaDueAt("delisting", true, now);
    expect(normal - now).toBe(LISTING_SLA_HOURS * 3_600_000);
    expect(flagged - now).toBe(TRUSTED_FLAGGER_SLA_HOURS * 3_600_000);
    expect(flagged).toBeLessThan(normal);
  });
});

describe("§6.2.2 readiness — the Phase-4 gate", () => {
  const full = (over: Partial<ReadinessRow> = {}): ReadinessRow[] =>
    READINESS_WORKSTREAMS.map((workstream) => ({
      workstream,
      complete: true,
      tested: true,
      signedOffBy: "registrar",
      signedOffAt: "2026-08-01T00:00:00Z",
      ...over,
    }));

  it("is not live with no checklist at all", () => {
    const v = evaluateReadiness([]);
    expect(v.live).toBe(false);
    expect(v.outstanding.length).toBe(READINESS_WORKSTREAMS.length);
  });

  it("cannot be passed by deleting a row", () => {
    // A checklist that gets shorter when a row is removed is a checklist that
    // can be passed by removal.
    const partial = full().slice(0, 3);
    const v = evaluateReadiness(partial);
    expect(v.live).toBe(false);
    expect(v.outstanding.map((o) => o.workstream)).toContain("destruction_drill");
  });

  it("refuses complete-but-untested — untested destruction is not destruction", () => {
    const v = evaluateReadiness(full({ tested: false }));
    expect(v.live).toBe(false);
    expect(v.outstanding.every((o) => o.missing === "tested")).toBe(true);
  });

  it("refuses an unsigned row", () => {
    const v = evaluateReadiness(full({ signedOffBy: null }));
    expect(v.live).toBe(false);
    expect(v.outstanding.every((o) => o.missing === "signoff")).toBe(true);
  });

  it("is live only when all six are complete, tested and signed off", () => {
    const v = evaluateReadiness(full());
    expect(v.live).toBe(true);
    expect(v.outstanding).toEqual([]);
  });
});

describe("subject identity map — normalisation", () => {
  it("collapses case, punctuation and whitespace so the index actually indexes", () => {
    expect(normaliseIdentity("Jane  Q. Doe")).toBe("jane q doe");
    expect(normaliseIdentity("JANE Q DOE")).toBe(normaliseIdentity("jane q. doe"));
  });

  it("does not reorder names — a false hit binds two people to one ref", () => {
    expect(normaliseIdentity("Doe Jane")).not.toBe(normaliseIdentity("Jane Doe"));
  });
});

describe("the branded pointer cannot be forged", () => {
  it("only the vault produces one", async () => {
    const kms = createLocalKmsAdapter();
    const store = createLocalObjectStore();
    const sealed = await sealPortrait(kms, store, "subj_brand_check", { x: 1 });
    // This is the runtime half of the guarantee. The compile-time half is that
    // `"portraits/anything" as CiphertextPointer` does not type-check outside
    // portrait-vault.ts — which is why the named-subject variant requires one.
    const pointer: CiphertextPointer = sealed.pointer;
    expect(typeof pointer).toBe("string");
    expect(pointer).toMatch(/^portraits\/subj_brand_check\//);
  });
});
