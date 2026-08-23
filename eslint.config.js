import globals from "globals";
import js from "@eslint/js";

const retiredManagersMessage = "The root src/managers namespace is retired. Import the owning data, infrastructure, presentation, engine, or adapter module instead.";

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
        files: ["src/*.js"],
        rules: {
            "no-restricted-imports": ["error", {
                "patterns": [{ "group": ["./managers/**"], "message": retiredManagersMessage }]
            }]
        }
    },
    {
        files: ["src/adapters/**", "src/core/**", "src/data/**", "src/generators/**", "src/infrastructure/**", "src/objects/**"],
        rules: {
            "no-restricted-imports": ["error", {
                "patterns": [{ "group": ["../managers/**", "../../managers/**"], "message": retiredManagersMessage }]
            }]
        }
    },
    {
        files: ["src/presentation/*.js"],
        rules: {
            "no-restricted-imports": ["error", {
                "patterns": [{ "group": ["../managers/**"], "message": retiredManagersMessage }]
            }]
        }
    },
    {
        files: ["src/presentation/*/**"],
        rules: {
            "no-restricted-imports": ["error", {
                "patterns": [{ "group": ["../../managers/**"], "message": retiredManagersMessage }]
            }]
        }
    },
    {
        files: ["src/engine/**"],
        rules: {
            "no-restricted-imports": ["error", {
                "patterns": [{
                    "group": ["../presentation/**", "../../presentation/**", "../infrastructure/**", "../../infrastructure/**", "../managers/**", "../../managers/**"],
                    "message": "Engine must remain presentation- and browser-infrastructure-agnostic; the root managers namespace is retired."
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
