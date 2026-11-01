// ESLint flat config (ESLint 9+/10 no longer reads .eslintrc.json).
// Same intent as the old config: Next's core-web-vitals + TypeScript rules.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...typescript,
  // eslint-plugin-react auto-detection calls context.getFilename(), removed in ESLint 10. Pin the version.
  { settings: { react: { version: "19" } } },
  {
    // The codebase was not linted while the config was broken, so these accumulated. They are real
    // findings but fixing them is behaviour-changing refactoring, not a config job: keep them
    // visible as warnings and ratchet to "error" as each rule is cleaned up.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
  { ignores: [".next/**", ".next-dev/**", "node_modules/**", "public/**", "next-env.d.ts", "scripts/**"] },
];

export default config;
