import { readFileSync } from "node:fs";
import { getAddress } from "viem";
import { describe, expect, it } from "vitest";
import { MADX } from "./contracts";

/**
 * CF8 — the $MADx token address, guarded like the canon numbers.
 *
 * `gambit-game-math.test.ts` locks every constant by VALUE. The token address is not a
 * constant there: it is repeated across the app, the contracts and the docs, and was asserted
 * nowhere. That cost something real — the wrong address (`0xb61ae772…fd18`, which is ORKx, a
 * different ERC-20 called "Serpentine Orkain") was written into three files as canonical and
 * went unnoticed until someone read the chain. The founder confirmed
 * `0x6972370e1caAA3624F37D7e87C28e1089D00151f` as the real $MADx on 2026-10-26; it has already
 * been changed once. This fails if any site drifts, or the wrong address creeps back.
 *
 * Reads files OUTSIDE `verify/` (`../contracts`), so it needs the full checkout — which is what
 * the `unit-tests` workflow has.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const MADX_ADDRESS = "0x6972370e1caAA3624F37D7e87C28e1089D00151f";
const ORKX_ADDRESS_FRAGMENT = "b61ae772"; // "Serpentine Orkain", ORKx — NOT $MADx

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

/** Every file that states the address as the token's, as a path relative to this file. */
const SITES = [
  "./contracts.ts",
  "../app/api/v1/cards/route.ts",
  "../docs/CARD_CANONICAL_REFERENCE.md",
  "../../contracts/madhat-core/DEPLOYED_ADDRESSES.md",
  "../../contracts/madhat-core/RECONCILIATION_RUNBOOK.md",
  "../../contracts/madhat-core/src/tokens/MADxToken.sol",
  "../../contracts/script/Deploy.s.sol",
  "../public/pitch/index.html",
];

/** Code and investor surfaces must never carry the ORKx address at all. */
const NEVER_ORKX = [
  "./contracts.ts",
  "../app/api/v1/cards/route.ts",
  "../../contracts/madhat-core/src/tokens/MADxToken.sol",
  "../../contracts/script/Deploy.s.sol",
  "../public/pitch/index.html",
];

describe("the $MADx token address", () => {
  it("is exactly the founder-confirmed one (2026-10-26)", () => {
    expect(MADX.address).toBe(MADX_ADDRESS);
    expect(MADX.chainId).toBe(42161); // Arbitrum One
  });

  it("is a valid EIP-55 checksum address — a mistyped character fails here, not on-chain", () => {
    expect(getAddress(MADX_ADDRESS)).toBe(MADX_ADDRESS);
    expect(getAddress(MADX.address)).toBe(MADX.address);
  });

  it.each(SITES)("%s carries it", (rel) => {
    expect(read(rel)).toContain(MADX_ADDRESS);
  });

  it.each(NEVER_ORKX)("%s does not carry the ORKx address", (rel) => {
    expect(read(rel).toLowerCase()).not.toContain(ORKX_ADDRESS_FRAGMENT);
  });
});
