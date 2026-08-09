#!/usr/bin/env node
/**
 * Regenerates lib/card-art.ts's CARD_ART_COUNT from the PNGs present in
 * public/cards/ (files named NNN.png). Run after dropping a new batch of
 * card art so the tiling widens automatically:
 *   node scripts/gen-card-art.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cardsDir = join(root, "public", "cards");
const libFile = join(root, "lib", "card-art.ts");

const count = readdirSync(cardsDir).filter((f) => /^\d{3}\.png$/.test(f)).length;
const src = readFileSync(libFile, "utf8");
const next = src.replace(
  /export const CARD_ART_COUNT = \d+;/,
  `export const CARD_ART_COUNT = ${count};`
);
if (next !== src) {
  writeFileSync(libFile, next);
  console.log(`CARD_ART_COUNT -> ${count}`);
} else {
  console.log(`CARD_ART_COUNT already ${count}`);
}
