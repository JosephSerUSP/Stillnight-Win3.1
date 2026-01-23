import { Game_Battler } from "../../objects/battler.js";
import { random } from "../../core/utils.js";

/**
 * @namespace EncounterRules
 * @description Pure functions for encounter logic like initiative.
 */
export const EncounterRules = {

    /**
     * Determines initiative and returns flags.
     * @param {import("../../objects/party.js").Game_Party} party
     * @param {Object} eventData - The event data containing encounter info.
     * @param {Array} actors - The list of actor data definitions.
     * @returns {Object} An object containing initiative flags (isSneakAttack, hidden, isPlayerFirstStrike).
     */
    determineInitiative(party, eventData, actors) {
        const result = {};
        if (!party || !eventData) return result;

        // Player Initiative
        const partyInitChance = party.members.reduce((sum, m) => sum + m.getPassiveValue("INITIATIVE"), 0);

        // Enemy Initiative
        let enemyInitChance = 0;
        const get_actor_data = (id) => actors.find(a => a.id === id);

        if (eventData.encounterData && eventData.encounterData.enemies) {
            eventData.encounterData.enemies.forEach(enemyId => {
                const enemyActorData = get_actor_data(enemyId);
                if (enemyActorData) {
                    const tempEnemyBattler = new Game_Battler(enemyActorData);
                    enemyInitChance += tempEnemyBattler.getPassiveValue("INITIATIVE");
                }
            });
        }

        // Rear Guard negates enemy initiative
        // Check active members in back row (index 2 and 3)
        const hasRearGuard = party.activeMembers.some((m, idx) => idx >= 2 && m.getPassiveValue("REAR_GUARD") > 0);
        if (hasRearGuard) {
            enemyInitChance = 0;
        }

        let partyWins = false;
        let enemyWins = false;

        if (partyInitChance > 0 && enemyInitChance > 0) {
            const totalInit = partyInitChance + enemyInitChance;
            if (random() < partyInitChance / totalInit) {
                partyWins = true;
            } else {
                enemyWins = true;
            }
        } else if (partyInitChance > 0) {
            if (random() < partyInitChance) {
                partyWins = true;
            }
        } else if (enemyInitChance > 0) {
            if (random() < enemyInitChance) {
                enemyWins = true;
            }
        }

        if (enemyWins) {
            result.isSneakAttack = true;
            result.hidden = true;
        } else if (partyWins) {
            result.isPlayerFirstStrike = true;
        }

        return result;
    }
};
