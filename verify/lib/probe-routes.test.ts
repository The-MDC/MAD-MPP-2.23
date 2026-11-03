import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isProbePath } from "@/lib/bot-guard";

// The scanner tarpit (lib/bot-guard.ts) 404s before any route runs, so a probe word that matches a real route
// silently takes that route down. Bare "admin" did exactly that to the admin suite. Walk every page, route handler
// and public file the app serves, and check none of them looks like a probe.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const toUrl = (segments: string[]) =>
  "/" +
  segments
    .filter((s) => !/^\(.*\)$/.test(s)) // route groups add no URL segment
    .map((s) => (/^\[.*\]$/.test(s) ? "x" : s)) // dynamic segments
    .join("/");

const appRoutes = walk(path.join(root, "app"))
  .filter((f) => /[\\/](page|route)\.tsx?$/.test(f))
  .map((f) => path.relative(path.join(root, "app"), path.dirname(f)).split(path.sep).filter(Boolean))
  .filter((segs) => !segs.some((s) => s.startsWith("_"))) // private folders are not routes
  .map(toUrl);

const publicFiles = walk(path.join(root, "public")).map(
  (f) => "/" + path.relative(path.join(root, "public"), f).split(path.sep).join("/"),
);

describe("no real route is treated as a scanner probe", () => {
  it("finds the routes it checks", () => {
    expect(appRoutes.length).toBeGreaterThan(50);
    expect(appRoutes).toContain("/admin/sign-in");
    expect(publicFiles.length).toBeGreaterThan(5);
  });

  it("leaves every page and API route alone", () => {
    expect(appRoutes.filter(isProbePath)).toEqual([]);
  });

  it("leaves every public file alone", () => {
    expect(publicFiles.filter(isProbePath)).toEqual([]);
  });
});
