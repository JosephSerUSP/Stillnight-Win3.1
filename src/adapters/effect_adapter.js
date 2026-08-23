import { EffectSystem } from "../engine/rules/effects.js";

/** Presentation-facing access to the unified effect contract. */
export const EffectAdapter = {
    getDescription(key, value, context = {}) {
        return EffectSystem.getDescription(key, value, context);
    },

    getPreview(key, value, target, source, context = {}) {
        return EffectSystem.getPreview(key, value, target, source, context);
    },

    getDescriptionForEffect(effect, context = {}) {
        return EffectSystem.getDescription(
            effect.type,
            EffectSystem.valueFromAuthoredEffect(effect),
            context
        );
    },

    getPreviewForEffect(effect, target, source, context = {}) {
        return EffectSystem.getPreview(
            effect.type,
            EffectSystem.valueFromAuthoredEffect(effect),
            target,
            source,
            context
        );
    }
};
