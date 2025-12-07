/**
 * @class Game_Action
 * @description Encapsulates a battle action (attack, skill, item, etc.).
 * Handles target selection, execution requirements, and effect application.
 */
export class Game_Action {
    /**
     * @param {Object} subjectContext - The context of the battler performing the action ({battler, index, isEnemy}).
     */
    constructor(subjectContext) {
        this._subjectContext = subjectContext;
        this._target = null;
        this._skillId = null;
        this._type = 'attack'; // Default to attack, matching legacy structure
    }

    /**
     * The battler performing the action.
     * @returns {import("./battler.js").Game_Battler}
     */
    get subject() {
        return this._subjectContext.battler;
    }

    /**
     * The full context of the subject.
     * @returns {Object}
     */
    get sourceContext() {
        return this._subjectContext;
    }

    /**
     * Sets the target of the action.
     * @param {import("./battler.js").Game_Battler} target
     */
    setTarget(target) {
        this._target = target;
    }

    /**
     * The target of the action.
     * @returns {import("./battler.js").Game_Battler}
     */
    get target() {
        return this._target;
    }

    /**
     * Sets the target (for compatibility with property assignment).
     * @param {import("./battler.js").Game_Battler} target
     */
    set target(target) {
        this.setTarget(target);
    }

    /**
     * Sets the skill to be used.
     * @param {number} skillId
     */
    setSkill(skillId) {
        this._skillId = skillId;
        this._type = 'skill';
    }

    /**
     * Sets the action to be a basic attack.
     */
    setAttack() {
        this._skillId = null;
        this._type = 'attack';
    }

    /**
     * Determines if this is a skill action.
     * @returns {boolean}
     */
    isSkill() {
        return this._type === 'skill';
    }

    /**
     * Determines if this is a basic attack.
     * @returns {boolean}
     */
    isAttack() {
        return this._type === 'attack';
    }

    /**
     * Gets the ID of the skill being used, if any.
     * @returns {number|null}
     */
    get skillId() {
        return this._skillId;
    }

    /**
     * Returns the type of action as a string ('attack' or 'skill').
     * Useful for compatibility with legacy code.
     * @returns {string}
     */
    get type() {
        return this._type;
    }
}
