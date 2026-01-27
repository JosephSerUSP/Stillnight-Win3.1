import { EffectSystem } from "../rules/effects.js";

/**
 * Adapter for effect previews.
 * Uses the pure EffectSystem to generate preview strings.
 */
export const EffectAdapter = {
    getPreview(key, value, target, source) {
        return EffectSystem.getPreview(key, value, target, source);
    }
};
