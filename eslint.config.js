import globals from "globals";
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
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
                    "group": ["../presentation/**", "../../presentation/**", "../infrastructure/**", "../../infrastructure/**"],
                    "message": "Engine must remain presentation- and browser-infrastructure-agnostic."
                }]
            }]
        }
    },
    {
        files: ["src/presentation/windows/**"],
        rules: {
            "no-restricted-imports": ["error", {
                "patterns": [{
                    "group": ["../../engine/systems/**", "../../managers/**"],
                    "message": "Presentation Windows cannot import Engine Systems or the retired root managers namespace directly. Use Selectors or Adapters."
                }]
            }]
        }
    }
];
