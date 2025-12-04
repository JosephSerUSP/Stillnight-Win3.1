import { Game_Battler } from "../objects/battler.js";

/**
 * @class EncounterManager
 * @description Handles encounter logic like initiative and sneak attacks.
 */
export class EncounterManager {

    /**
     * Determines initiative and modifies eventData accordingly.
     * @param {import("../objects/objects.js").Game_Party} party
     * @param {Object} eventData
     * @param {Array} actors
     */
    static determineInitiative(party, eventData, actors) {
        if (!party || !eventData) return;

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
            if (Math.random() < partyInitChance / totalInit) {
                partyWins = true;
            } else {
                enemyWins = true;
            }
        } else if (partyInitChance > 0) {
            if (Math.random() < partyInitChance) {
                partyWins = true;
            }
        } else if (enemyInitChance > 0) {
            if (Math.random() < enemyInitChance) {
                enemyWins = true;
            }
        }

        if (enemyWins) {
            eventData.isSneakAttack = true;
            eventData.hidden = true;
        } else if (partyWins) {
            eventData.isPlayerFirstStrike = true;
        }
    }
}
