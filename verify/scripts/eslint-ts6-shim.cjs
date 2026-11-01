/**
 * Lint-only shim. The app compiles with TypeScript 7, which ships no JavaScript compiler API,
 * and typescript-eslint cannot load without one. Microsoft's guidance is to run it side by
 * side on TypeScript 6. The `typescript6` devDependency is that copy; this maps the bare
 * `typescript` specifier to it for requests made from inside typescript-eslint and its plugins
 * only, so `tsc`, `next build` and everything else keep using TypeScript 7.
 */
const Module = require("node:module");

const original = Module._resolveFilename;
const ts6 = require.resolve("typescript6");
const LINTER = /\/node_modules\/(@typescript-eslint|typescript-eslint|eslint-config-next|eslint-plugin-[^/]+|ts-api-utils|tsutils)\//;

Module._resolveFilename = function (request, parent, ...rest) {
  if (request === "typescript" && parent && parent.filename) {
    // Normalise Windows separators so one pattern covers every platform.
    if (LINTER.test(parent.filename.replace(/\\/g, "/"))) return ts6;
  }
  return original.call(this, request, parent, ...rest);
};
