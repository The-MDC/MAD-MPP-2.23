/**
 * MAD Gambit — the subject identity map (§6.2.2 workstream 4).
 * ────────────────────────────────────────────────────────────────
 * The real-person ↔ subjectRef binding. Off-chain, mutable, and with its own
 * erasure path.
 *
 * The sheet calls this one "easy to miss and fatal if missed", and it is:
 * destroying the payload key while retaining the identity map still leaves
 * personal data on the books. So the map is bound to the SAME per-subject key
 * as the portrait payload — one destruction erases both, and there is no code
 * path here that erases one without the other.
 *
 * WHY HMAC AND NOT A HASH. The lookup index has to answer "do we already have a
 * ref for this person?" without storing the person. A plain SHA-256 of a name
 * is reversible by dictionary attack in seconds — the space of public figures
 * is small enough to enumerate over lunch — so a hashed-name column is personal
 * data wearing a thin disguise. An HMAC under a server-side pepper that never
 * leaves the environment is not enumerable by anyone who only has the database.
 *
 * The pepper is therefore a secret with real consequences: leaking it converts
 * every row in this table back into personal data. It is read from the
 * environment and never persisted, logged or returned.
 */
import { createHmac, timingSafeEqual } from "crypto";
import type { Pool } from "pg";
import { sealPortrait, type KmsAdapter, type ObjectStore } from "@/lib/portrait-vault";

const PEPPER_ENV_KEYS = ["SUBJECT_MAP_PEPPER", "REGISTRAR_PEPPER"] as const;

export function getPepper(): string | undefined {
  for (const k of PEPPER_ENV_KEYS) {
    const v = process.env[k];
    if (v) return v;
  }
  return undefined;
}

export function hasPepper(): boolean {
  return Boolean(getPepper());
}

/**
 * Normalise before hashing so "Jane  Q. Doe" and "jane q. doe" collide, which
 * is the point of a lookup index. Deliberately conservative: it lowercases,
 * collapses whitespace and strips punctuation, and does nothing clever with
 * name order — a false miss creates a duplicate queue entry a human resolves,
 * while a false hit silently binds two people to one ref.
 */
// Punctuation is REMOVED rather than letters being whitelisted. A `\p{L}`
// whitelist would need the `u` flag (unavailable at this compile target) and,
// more importantly, would silently strip characters from any script nobody
// thought to check. Deleting a known punctuation set leaves every alphabet
// alone, which is the safer direction to be wrong in.
const IDENTITY_PUNCTUATION = /[.,'’‘"“”`´^~!?:;()[\]{}<>\\/|@#$%&*+=_\-–—]/g;

export function normaliseIdentity(input: string): string {
  return (input ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(IDENTITY_PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** HMAC(pepper, normalised identity). Throws without a pepper — see above. */
export function lookupHmac(identity: string): string {
  const pepper = getPepper();
  if (!pepper) {
    throw new Error("SUBJECT_MAP_PEPPER is required — a bare hash of a name is personal data");
  }
  return createHmac("sha256", pepper).update(normaliseIdentity(identity)).digest("hex");
}

/** Constant-time compare, so the index cannot be probed by timing. */
export function hmacEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Derive an opaque subjectRef from the lookup HMAC. Stable for a given identity
 * and pepper, so re-submitting the same subject resolves to the same ref rather
 * than forking the queue — but not invertible without the pepper.
 *
 * Prefixed and truncated to satisfy `assertOpaqueSubjectRef`: 8–64 chars of
 * [a-z0-9_-], starting alphanumeric.
 */
export function deriveSubjectRef(identity: string): string {
  return `subj_${lookupHmac(identity).slice(0, 24)}`;
}

export interface IdentityBindingRow {
  subjectRef: string;
  lookupHmac: string;
  bindingRef: string | null;
  keyRef: string;
  status: "held" | "erased";
  erasedAt: string | null;
}

function mapRow(r: Record<string, unknown>): IdentityBindingRow {
  const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : String(v));
  return {
    subjectRef: String(r.subject_ref),
    lookupHmac: String(r.lookup_hmac),
    bindingRef: (r.binding_ref as string | null) ?? null,
    keyRef: String(r.key_ref),
    status: (r.status as "held" | "erased") ?? "held",
    erasedAt: iso(r.erased_at),
  };
}

/**
 * Bind an identity to a subjectRef. The identity itself is encrypted under the
 * subject's key and written to deletable storage; only the pointer and the HMAC
 * index land in Postgres.
 *
 * `identity` is a parameter and never a column. If you find yourself wanting to
 * store it "just for the queue UI", that is the exact mistake workstream 4 is
 * written to prevent — the registrar reads it by decrypting, or not at all.
 */
export async function bindIdentity(
  pool: Pool,
  kms: KmsAdapter,
  store: ObjectStore,
  input: { identity: string; keyRef: string; subjectRef?: string },
): Promise<IdentityBindingRow> {
  const hmac = lookupHmac(input.identity);
  const subjectRef = input.subjectRef ?? deriveSubjectRef(input.identity);

  // The binding travels through the same seal path as the portrait payload, so
  // it inherits the same key and therefore the same erasure.
  const sealed = await sealPortrait(
    kms,
    store,
    subjectRef,
    { identity: normaliseIdentity(input.identity), boundAt: new Date().toISOString() },
    input.keyRef,
  );

  const res = await pool.query(
    `INSERT INTO subject_identity_map (subject_ref, lookup_hmac, binding_ref, key_ref)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (subject_ref) DO UPDATE SET
       lookup_hmac = EXCLUDED.lookup_hmac,
       binding_ref = EXCLUDED.binding_ref,
       key_ref = EXCLUDED.key_ref,
       updated_at = now()
     RETURNING *`,
    [subjectRef, hmac, sealed.pointer, input.keyRef],
  );
  return mapRow(res.rows[0] as Record<string, unknown>);
}

/** Resolve an existing ref for an identity without storing the identity. */
export async function findSubjectRef(pool: Pool, identity: string): Promise<string | null> {
  const res = await pool.query(
    `SELECT subject_ref FROM subject_identity_map WHERE lookup_hmac = $1 AND status = 'held' LIMIT 1`,
    [lookupHmac(identity)],
  );
  return res.rows[0] ? String(res.rows[0].subject_ref) : null;
}

export async function getBinding(pool: Pool, subjectRef: string): Promise<IdentityBindingRow | null> {
  const res = await pool.query(`SELECT * FROM subject_identity_map WHERE subject_ref = $1`, [subjectRef]);
  return res.rows[0] ? mapRow(res.rows[0] as Record<string, unknown>) : null;
}

export interface IdentityErasure {
  subjectRef: string;
  bindingDeleted: boolean;
  hmacCleared: boolean;
}

/**
 * Erase the identity binding. Called as part of subject erasure, never alone.
 *
 * Three things happen and all three matter: the ciphertext is deleted, the
 * pointer is nulled, and THE HMAC IS OVERWRITTEN. Leaving the HMAC would keep a
 * queryable "is this person in our system" oracle alive for anyone who later
 * obtains the pepper — a smaller leak than a name, but still a leak, and still
 * one an erasure request is entitled to close.
 */
export async function eraseIdentity(
  pool: Pool,
  store: ObjectStore,
  subjectRef: string,
): Promise<IdentityErasure> {
  const binding = await getBinding(pool, subjectRef);
  if (!binding) return { subjectRef, bindingDeleted: false, hmacCleared: false };

  if (binding.bindingRef) await store.delete(binding.bindingRef);

  await pool.query(
    `UPDATE subject_identity_map
        SET binding_ref = NULL,
            lookup_hmac = 'erased:' || subject_ref,
            status = 'erased',
            erased_at = now(),
            updated_at = now()
      WHERE subject_ref = $1`,
    [subjectRef],
  );
  return { subjectRef, bindingDeleted: Boolean(binding.bindingRef), hmacCleared: true };
}
