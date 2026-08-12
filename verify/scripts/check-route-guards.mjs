#!/usr/bin/env node
/**
 * Fails (report-only for now — see ci.yml) if a mutating API route handler
 * (POST/PUT/PATCH/DELETE) has no recognizable auth/rate-limit guard.
 *
 * Why this exists: an audit found 33 of 53 mutating routes under app/api had
 * no protection at all, not by decision — each route.ts is independently
 * responsible for remembering to call a guard, and most didn't. This makes
 * that failure mode visible in CI instead of only in a manual audit.
 *
 * A route is considered guarded if its source calls one of the recognized
 * guard functions (works for both the withRouteGuard wrapper and the older
 * direct-call style already used by the routes that were already correct —
 * this script does not require migrating those). A route that is
 * deliberately public — a pure calculator with no persistence, for
 * example — opts out with a `// PUBLIC-ROUTE: <reason>` comment anywhere in
 * the file, so the exemption is visible in review, not silent.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "app", "api");

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
const GUARD_CALLS = [
  "requireMadxRouteAuth(",
  "requireBearerSecret(",
  "enforceRateLimit(",
  "withRouteGuard(",
];
const OPT_OUT = "// PUBLIC-ROUTE:";

async function findRouteFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findRouteFiles(full)));
    } else if (entry.name === "route.ts") {
      files.push(full);
    }
  }
  return files;
}

function exportsMutatingMethod(source) {
  return MUTATING_METHODS.filter((method) => {
    const patterns = [
      new RegExp(`export\\s+async\\s+function\\s+${method}\\b`),
      new RegExp(`export\\s+function\\s+${method}\\b`),
      new RegExp(`export\\s+const\\s+${method}\\s*=`),
      new RegExp(`export\\s*\\{[^}]*\\bas\\s+${method}\\b`),
    ];
    return patterns.some((re) => re.test(source));
  });
}

async function main() {
  const files = await findRouteFiles(API_DIR);
  const unguarded = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const methods = exportsMutatingMethod(source);
    if (methods.length === 0) continue;

    const hasGuard = GUARD_CALLS.some((call) => source.includes(call));
    const hasOptOut = source.includes(OPT_OUT);
    if (!hasGuard && !hasOptOut) {
      unguarded.push({ file: path.relative(process.cwd(), file), methods });
    }
  }

  if (unguarded.length === 0) {
    console.log(`✅ route-guard check: all mutating routes are guarded or explicitly marked public (${files.length} route files scanned).`);
    return;
  }

  console.warn(`⚠️  route-guard check: ${unguarded.length} mutating route(s) have no guard call and no PUBLIC-ROUTE marker:\n`);
  for (const { file, methods } of unguarded) {
    console.warn(`   ${file}  [${methods.join(", ")}]`);
  }
  console.warn(
    "\nEach of these needs either a call to requireMadxRouteAuth / requireBearerSecret / " +
      "enforceRateLimit / withRouteGuard, or a `// PUBLIC-ROUTE: <reason>` comment if the " +
      "openness is intentional.",
  );
  process.exitCode = 1;
}

main().catch((err) => {
  console.error("route-guard check crashed:", err);
  process.exitCode = 1;
});
