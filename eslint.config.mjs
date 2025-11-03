import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import globals from "globals";

export default defineConfig(
  { languageOptions: { globals: { ...globals.builtin, ...globals.node } } },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {"ignores":["build"]}
);
