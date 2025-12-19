import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  // Global settings
  {
    languageOptions: {
      globals: globals.browser
    }
  },
  // Recommended rules ONLY for new architecture
  {
    files: ["src/engine/**/*.js", "src/presentation/**/*.js"],
    ...pluginJs.configs.recommended
  },
  // Import Bans
  {
    files: ["src/engine/**/*.js"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [{
          "group": ["**/presentation/**"],
          "message": "Engine cannot import from Presentation layer."
        }]
      }]
    }
  },
  {
    files: ["src/presentation/windows/**/*.js"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [{
          "group": ["**/engine/systems/**"],
          "message": "Windows cannot import directly from Engine Systems. Use Selectors."
        }]
      }]
    }
  }
];
