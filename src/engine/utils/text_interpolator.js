/**
 * Interpolates variables into text strings.
 * Supports syntax:
 * - ${variableName} -> Replaces with value of party.getVariable(variableName)
 * - ${party.gold} -> Replaces with party.gold
 * - ${hero.name} -> Replaces with name of first party member
 *
 * @param {string} text - The text to interpolate.
 * @param {Object} session - The game session.
 * @returns {string} The interpolated text.
 */
export function interpolateText(text, session) {
    if (!text || typeof text !== 'string') return text;

    return text.replace(/\${(.*?)}/g, (match, key) => {
        const parts = key.split('.');

        // Handle party properties
        if (parts[0] === 'party') {
            if (parts[1] === 'gold') return session.party.gold;
            if (parts[1] === 'level') return session.party.averageLevel || 1; // Assuming averageLevel exists or handled
        }

        // Handle hero/actor properties
        if (parts[0] === 'hero' && session.party.members.length > 0) {
            const hero = session.party.members[0];
            if (parts[1] === 'name') return hero.name;
        }

        // Handle variables (default)
        const val = session.party.getVariable(key);
        if (val !== undefined) return val;

        // Fallback: return match if not found, or empty string?
        // Let's return match to show it's broken, or maybe "???"
        return match;
    });
}
