/**
 * MAD Gambit — the portrait vault (FIVE FACES §6.2.1, §6.2.2).
 * ────────────────────────────────────────────────────────────────
 * Envelope encryption for named-subject portrait payloads, and INTERLOCK
 * layer 2 — the type-level barrier.
 *
 * THE ASYMMETRY THIS MODULE EXISTS FOR: off-chain data can be crypto-shredded;
 * on-chain data cannot be deleted, ever. So the barrier lives on the side where
 * recovery is impossible, and it is not procedural.
 *
 * `CiphertextPointer` is BRANDED with a symbol that is not exported. No module
 * outside this file can construct one — not by casting a string, not by object
 * literal, not by `as`. `portrait-metadata.ts` requires one on the named-subject
 * variant, so a named portrait that has not been through a confirmed key write
 * does not compile. That is layer 2 of four; the chain-level revert is layer 1
 * and is deliberately the LAST line rather than the only one.
 *
 * KEY MATERIAL NEVER LEAVES THE KMS. This module holds a KMS *adapter*: the
 * data key is generated and unwrapped by the provider, and what crosses this
 * boundary is a handle. `destroy()` is the crypto-shredding primitive; it
 * returns a WINDOW, not a completion, because managed KMS destroy carries a
 * mandatory waiting period (~7–30d AWS, 24h GCP) that is a deliberate safety
 * net and is not removable. Promising "immediate" would be a commitment the
 * infrastructure cannot honour.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/* ────────────────────────────────────────────────────────────────
 * The branded pointer — INTERLOCK layer 2
 * ──────────────────────────────────────────────────────────────── */

declare const CIPHERTEXT_BRAND: unique symbol;

/**
 * An object-store pointer to an encrypted payload whose key is confirmed
 * written. Constructible only by this module. Do not add an exported factory,
 * a cast helper, or a `fromString` — each of those reduces the barrier to a
 * comment, and the comment is not what stops a named portrait reaching a chain.
 */
export type CiphertextPointer = string & { readonly [CIPHERTEXT_BRAND]: true };

/* ────────────────────────────────────────────────────────────────
 * KMS adapter
 * ──────────────────────────────────────────────────────────────── */

export interface KmsDataKey {
  /** Handle for the wrapped key. Persisted; never secret material. */
  keyRef: string;
  /** Plaintext data key, in memory only, for this one operation. */
  plaintext: Buffer;
}

export interface KmsDestroyResult {
  keyRef: string;
  requestedAt: number;
  /** Earliest instant the provider guarantees the material is unrecoverable. */
  irreversibleFrom: number;
  provider: string;
}

/**
 * The provider contract. §6.2.2 workstream 1 requires FIPS 140-2 L3 backing, an
 * irreversible destroy primitive, and immutable audit logging of every
 * destruction — properties of the implementation, asserted at go-live by the
 * readiness checklist rather than by this interface.
 */
export interface KmsAdapter {
  readonly provider: string;
  /** Mandatory destroy waiting period, in ms. Not removable; state it honestly. */
  readonly destroyWindowMs: number;
  generateDataKey(subjectRef: string): Promise<KmsDataKey>;
  unwrapDataKey(keyRef: string): Promise<Buffer>;
  destroyKey(keyRef: string): Promise<KmsDestroyResult>;
}

/** AWS KMS: 7–30 days. GCP: 24h. The published SLA must state a window. */
export const AWS_DESTROY_WINDOW_MS = 7 * 24 * 3_600_000;
export const GCP_DESTROY_WINDOW_MS = 24 * 3_600_000;

/**
 * In-memory adapter for local development and the destruction drill. It is NOT
 * a KMS and says so: `provider` reads "insecure-local" precisely so a readiness
 * check cannot mistake it for one, and `assertProductionKms` refuses it.
 */
export function createLocalKmsAdapter(): KmsAdapter {
  const keys = new Map<string, Buffer>();
  let n = 0;
  return {
    provider: "insecure-local",
    destroyWindowMs: 0,
    // Both accessors return a COPY. The caller scrubs its plaintext key after
    // use — as it should — and handing out the only reference would mean the
    // first seal zeroes the stored key and every later read fails its auth tag.
    // A real KMS has this property for free; the local stand-in has to be
    // written to match it or it is a stand-in for something else.
    async generateDataKey(subjectRef: string) {
      const keyRef = `local:${subjectRef}:${++n}`;
      const plaintext = randomBytes(32);
      keys.set(keyRef, plaintext);
      return { keyRef, plaintext: Buffer.from(plaintext) };
    },
    async unwrapDataKey(keyRef: string) {
      const k = keys.get(keyRef);
      if (!k) throw new Error("key destroyed or unknown — payload is unreadable");
      return Buffer.from(k);
    },
    async destroyKey(keyRef: string) {
      keys.delete(keyRef);
      const now = Date.now();
      return { keyRef, requestedAt: now, irreversibleFrom: now, provider: "insecure-local" };
    },
  };
}

/** Go-live gate: a local adapter must never back a named-subject portrait. */
export function assertProductionKms(kms: KmsAdapter): void {
  if (kms.provider === "insecure-local") {
    throw new Error("named-subject portraits require an HSM-backed KMS, not the local adapter");
  }
}

/* ────────────────────────────────────────────────────────────────
 * Object store
 * ──────────────────────────────────────────────────────────────── */

/**
 * The ciphertext store must be DELETABLE (§6.2.2 workstream 2): object-lock off,
 * versioning off or lifecycle-purged, no CDN edge caching. Explicitly NOT IPFS,
 * Arweave or any content-addressed immutable store — those would recreate the
 * exact problem on a different substrate.
 */
export interface ObjectStore {
  readonly deletable: boolean;
  put(key: string, body: Buffer): Promise<string>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

export function createLocalObjectStore(): ObjectStore {
  const objects = new Map<string, Buffer>();
  return {
    deletable: true,
    async put(key, body) {
      objects.set(key, body);
      return key;
    },
    async get(key) {
      return objects.get(key) ?? null;
    },
    async delete(key) {
      objects.delete(key);
    },
  };
}

export function assertDeletableStore(store: ObjectStore): void {
  if (!store.deletable) {
    throw new Error("ciphertext store must be deletable — immutable stores cannot be shredded");
  }
}

/* ────────────────────────────────────────────────────────────────
 * Seal and open
 * ──────────────────────────────────────────────────────────────── */

export interface SealedPortrait {
  subjectRef: string;
  keyRef: string;
  /** The only way to obtain one of these. */
  pointer: CiphertextPointer;
}

const ALGO = "aes-256-gcm";

/**
 * Encrypt a named-subject payload and write it. Returns the branded pointer —
 * and only after both the key write and the object write have resolved, which
 * is what makes the brand mean "a confirmed key write" rather than "a string".
 *
 * Keys are PER SUBJECT, not per token (§6.2.1): one erasure request must reach
 * every portrait of that person across every leg in one operation. Per-token
 * keys would turn a single request into an unbounded sweep and guarantee a miss.
 */
export async function sealPortrait(
  kms: KmsAdapter,
  store: ObjectStore,
  subjectRef: string,
  payload: unknown,
  existingKeyRef?: string,
): Promise<SealedPortrait> {
  assertDeletableStore(store);

  let keyRef: string;
  let dek: Buffer;
  if (existingKeyRef) {
    keyRef = existingKeyRef;
    dek = await kms.unwrapDataKey(existingKeyRef);
  } else {
    const generated = await kms.generateDataKey(subjectRef);
    keyRef = generated.keyRef;
    dek = generated.plaintext;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, dek, iv);
  const body = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(payload), "utf8")),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // iv ‖ tag ‖ ciphertext — self-describing, so opening needs only the key.
  const blob = Buffer.concat([iv, tag, body]);

  const objectKey = `portraits/${subjectRef}/${randomBytes(8).toString("hex")}`;
  const stored = await store.put(objectKey, blob);
  dek.fill(0); // scrub the plaintext key from memory once it has been used

  return { subjectRef, keyRef, pointer: stored as CiphertextPointer };
}

/**
 * Read a sealed payload back. Throws once the key is destroyed — which is the
 * whole point, and the honest qualifier §6.2.1 insists on stating: after erasure
 * the token is provably part of the series and provably unreadable.
 */
export async function openPortrait(
  kms: KmsAdapter,
  store: ObjectStore,
  keyRef: string,
  pointer: CiphertextPointer,
): Promise<unknown> {
  const blob = await store.get(pointer);
  if (!blob) throw new Error("ciphertext not found — payload has been erased");
  const dek = await kms.unwrapDataKey(keyRef);
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const body = blob.subarray(28);
  const decipher = createDecipheriv(ALGO, dek, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(body), decipher.final()]);
  dek.fill(0);
  return JSON.parse(plain.toString("utf8"));
}

export interface ShredResult {
  keyRef: string;
  requestedAt: number;
  irreversibleFrom: number;
  provider: string;
  objectsDeleted: number;
}

/**
 * CRYPTO-SHREDDING. Destroys the key AND deletes the ciphertext.
 *
 * Both, deliberately. Key destruction alone is recognised as valid erasure by
 * EDPB, the ICO and CNIL given strong encryption and auditability — but leaving
 * the ciphertext in a bucket means the erasure rests entirely on a cryptographic
 * assumption with no expiry date on it. Deleting both costs nothing and does not.
 */
export async function shredSubject(
  kms: KmsAdapter,
  store: ObjectStore,
  keyRef: string,
  pointers: readonly CiphertextPointer[],
): Promise<ShredResult> {
  let objectsDeleted = 0;
  for (const p of pointers) {
    await store.delete(p);
    objectsDeleted += 1;
  }
  const destroyed = await kms.destroyKey(keyRef);
  return { ...destroyed, objectsDeleted };
}

/** The published SLA window, stated as a window because it is one. */
export function erasureSlaCopy(kms: KmsAdapter): string {
  if (kms.destroyWindowMs <= 0) return "Key destruction is immediate on this adapter.";
  const days = kms.destroyWindowMs / 86_400_000;
  const window = days >= 1 ? `${Math.round(days)} day${days >= 2 ? "s" : ""}` : `${Math.round(kms.destroyWindowMs / 3_600_000)} hours`;
  return `Erasure is requested immediately and completes within ${window}. The provider's destruction waiting period is a safety net against malicious deletion and cannot be shortened; the audit log records both the request and the irreversible-destruction time.`;
}
