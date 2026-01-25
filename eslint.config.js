import globals from "globals";
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            },
            sourceType: "module",
            ecmaVersion: 2022
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }],
            "no-undef": "error"
        },
        ignores: ["tests/**"]
    },
    {
        files: ["src/engine/**"],
        rules: {
            "no-restricted-imports": ["error", {
                "patterns": [{
                    "group": ["../presentation/**", "../../presentation/**"],
                    "message": "Engine must remain presentation-agnostic."
                }]
            }]
        }
    },
    {
        files: ["src/presentation/windows/**"],
        rules: {
            "no-restricted-imports": ["error", {
                "patterns": [{
                    "group": ["../../engine/systems/**", "../../managers/progression.js"],
                    "message": "Presentation Windows cannot import from Engine Systems directly. Use Selectors."
                }]
            }]
        }
    }
];
