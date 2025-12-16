import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.builtin, ...globals.node } },
    plugins: {
      unicorn: eslintPluginUnicorn,
      "simple-import-sort": eslintPluginSimpleImportSort,
    },
  },
  eslintConfigPrettier,
  {
    rules: {
      curly: "error",

      /* eslint-plugin-unicorn */
      "unicorn/template-indent": "error",

      /* eslint-plugin-simple-import-sort */
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // https://github.com/lydell/eslint-plugin-simple-import-sort/blob/20e25f3b83c713825f96b8494e2091e6600954d6/src/imports.js#L5-L19
            // Side effect imports.
            [String.raw`^\u0000`],
            // Remove blank lines between groups
            // https://github.com/lydell/eslint-plugin-simple-import-sort#how-do-i-remove-all-blank-lines-between-imports
            [
              // Node.js builtins prefixed with `node:`.
              "^node:",
              // Packages.
              // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
              String.raw`^@?\w`,
              // Absolute imports and other imports such as Vue-style `@/foo`.
              // Anything not matched in another group.
              "^",
              // Relative imports.
              // Anything that starts with a dot.
              String.raw`^\.`,
            ],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  { ignores: ["running", "repositories", "reports"] },
);
