import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".test-runtime/**",
    "pocketbase/pb_data/**",
    "test-results/**",
  ]),
  { rules: { "@next/next/no-img-element": "off" } },
  {
    files: ["pocketbase/pb_migrations/*.js"],
    rules: { "@typescript-eslint/triple-slash-reference": "off" },
  },
]);

export default eslintConfig;
