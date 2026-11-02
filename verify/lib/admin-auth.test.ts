import { describe, it, expect } from "vitest";
import {
  can, isStaffEmail, DUMMY_HASH, generatePassword, hashPassword, masterConfig, newSession, normaliseEmail, passwordProblem,
  safeAdminNext, sessionSecret, signSession, SUBORDINATE_ROLES, verifyPassword, verifySession, isSubordinateRole,
} from "@/lib/admin-auth";

const SECRET = "x".repeat(40);

describe("passwords", () => {
  it("hashes with scrypt and verifies, rejecting a wrong password", async () => {
    const h = await hashPassword("correct horse battery staple");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", h)).toBe(true);
    expect(await verifyPassword("correct horse battery stapl3", h)).toBe(false);
  });
  it("salts, so the same password hashes differently", async () => {
    expect(await hashPassword("same-password-123")).not.toBe(await hashPassword("same-password-123"));
  });
  it("never throws on garbage, and the dummy hash never verifies", async () => {
    for (const bad of [null, undefined, "", "nope", "scrypt$x$y$z$a$b", "bcrypt$1$2$3$4$5"]) expect(await verifyPassword("pw", bad as string)).toBe(false);
    expect(await verifyPassword("anything at all", DUMMY_HASH)).toBe(false);
  });
  it("enforces a minimum policy", () => {
    expect(passwordProblem("short")).toMatch(/at least 12/);
    expect(passwordProblem("aaaaaaaaaaaaaaaa")).toMatch(/varied/);
    expect(passwordProblem("a-Good-Passphrase-77")).toBeNull();
    expect(passwordProblem(undefined)).toBeTruthy();
  });
  it("generates strong, distinct passwords that pass its own policy", () => {
    const a = generatePassword();
    expect(a).toHaveLength(20);
    expect(a).not.toBe(generatePassword());
    expect(passwordProblem(a)).toBeNull();
    expect(a).not.toMatch(/[0OIl1]/); // no look-alikes
  });
});

describe("sessions", () => {
  const now = 1_800_000_000_000;
  it("round-trips a signed session", () => {
    const s = newSession("nick@madgambit.fun", "master", now);
    expect(verifySession(signSession(s, SECRET), SECRET, now + 1000)).toEqual(s);
  });
  it("rejects a tampered body, a wrong secret, an expired session and malformed tokens", () => {
    const s = newSession("a@b.co", "viewer", now);
    const tok = signSession(s, SECRET);
    const [v, , sig] = tok.split(".");
    const forged = Buffer.from(JSON.stringify({ ...s, role: "master" })).toString("base64url");
    expect(verifySession(`${v}.${forged}.${sig}`, SECRET, now)).toBeNull();
    expect(verifySession(tok, "y".repeat(40), now)).toBeNull();
    expect(verifySession(tok, SECRET, now + 9 * 3600 * 1000)).toBeNull();
    for (const bad of ["", "abc", "v1.x", "v2.a.b", null, undefined]) expect(verifySession(bad as string, SECRET, now)).toBeNull();
    expect(verifySession(tok, "short", now)).toBeNull(); // a weak secret is no secret
  });
  it("needs a 32+ character secret to be configured at all", () => {
    expect(sessionSecret({ ADMIN_SESSION_SECRET: "short" })).toBeNull();
    expect(sessionSecret({ ADMIN_SESSION_SECRET: SECRET })).toBe(SECRET);
  });
});

describe("roles", () => {
  it("only the master manages admins", () => {
    expect(can("master", "admins:manage")).toBe(true);
    expect(can("admin", "admins:manage")).toBe(false);
    expect(can("viewer", "admins:manage")).toBe(false);
  });
  it("a viewer reads reports and nothing else", () => {
    expect(can("viewer", "reports:read")).toBe(true);
    for (const p of ["reports:export", "assistant:use", "audit:read", "admins:manage"] as const) expect(can("viewer", p)).toBe(false);
  });
  it("an admin reads, exports and uses the assistant, but never sees the audit log or manages admins", () => {
    expect(can("admin", "reports:export")).toBe(true);
    expect(can("admin", "assistant:use")).toBe(true);
    expect(can("admin", "audit:read")).toBe(false);
  });
  it("a subordinate can never be given the master role", () => {
    expect([...SUBORDINATE_ROLES]).toEqual(["admin", "support", "dev", "viewer"]);
    expect(isSubordinateRole("master")).toBe(false);
    expect(isSubordinateRole("admin")).toBe(true);
  });
});

describe("staff separation", () => {
  it("support staff see only the user lane; developers only the dev and staff lanes", () => {
    expect(can("support", "support:user")).toBe(true);
    expect(can("support", "support:dev")).toBe(false);
    expect(can("support", "reports:read")).toBe(false);
    expect(can("dev", "support:dev")).toBe(true);
    expect(can("dev", "support:user")).toBe(false);
    expect(can("dev", "beta:manage")).toBe(false);
    expect(can("admin", "beta:manage")).toBe(true);
    expect(can("admin", "admins:manage")).toBe(false);
  });
});

describe("inputs", () => {
  it("normalises emails and rejects junk", () => {
    expect(normaliseEmail("  Nick@MadGambit.fun ")).toBe("nick@madgambit.fun");
    for (const bad of ["", "no-at", "a@b", "a b@c.de", 5, null]) expect(normaliseEmail(bad)).toBeNull();
  });
  it("only redirects to admin destinations on this site", () => {
    expect(safeAdminNext("/dashboard")).toBe("/dashboard");
    expect(safeAdminNext("/admin/admins")).toBe("/admin/admins");
    for (const bad of ["https://evil.example", "//evil.example", "/admin//x", "/profile", "javascript:alert(1)", undefined]) expect(safeAdminNext(bad)).toBe("/admin");
  });
  it("reads the master from the environment only when both parts are set, on a company domain", () => {
    expect(masterConfig({ ADMIN_MASTER_EMAIL: "nick@madgambit.fun" })).toBeNull();
    expect(masterConfig({ ADMIN_MASTER_EMAIL: " Nick@MadGambit.fun ", ADMIN_MASTER_PASSWORD_HASH: "h" })).toEqual({ email: "nick@madgambit.fun", hash: "h" });
    expect(masterConfig({ ADMIN_MASTER_EMAIL: "nick@gmail.com", ADMIN_MASTER_PASSWORD_HASH: "h" })).toBeNull();
  });
  it("ties staff accounts strictly to madgambit.fun and madgambit.io", () => {
    for (const ok of ["nick@madgambit.fun", "ops@madgambit.io", "Dev@MADGAMBIT.IO"]) expect(isStaffEmail(ok), ok).toBe(true);
    for (const bad of ["nick@gmail.com", "x@madgambit.fun.evil.com", "x@evil-madgambit.fun", "x@sub.madgambit.fun", "x@madgambit.com", "madgambit.fun", "", null]) expect(isStaffEmail(bad), String(bad)).toBe(false);
  });
});
