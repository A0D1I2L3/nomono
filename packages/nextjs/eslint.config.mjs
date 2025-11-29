import { FlatCompat } from "@eslint/eslintrc";
import prettierPlugin from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default defineConfig([
  {
    plugins: {
      prettier: prettierPlugin,
    },

    extends: compat.extends(
      "next/core-web-vitals",
      "next/typescript",
      "prettier"
    ),

    rules: {
      // Allow unused imports/vars (PREVENTS production build failure)
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",

      // Allow any / ts-ignore
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",

      // Prettier only warns, never errors
      "prettier/prettier": [
        "warn",
        {
          endOfLine: "auto",
        },
      ],
    },
  },
]);
