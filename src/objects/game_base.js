/**
 * @class Game_Base
 * @description The base class for all game units.
 */
export class Game_Base {
  /**
   * Creates a new Game_Base instance.
   * @param {Object} unitData - The data for the unit.
   * @param {string} unitData.name - The name of the unit.
   * @param {number} unitData.maxHp - The maximum HP of the unit.
   * @param {number} unitData.level - The level of the unit.
   * @param {string[]} [unitData.elements] - The elemental affinities of the unit.
   */
  constructor(unitData) {
    /**
     * The unique ID of the unit (if available).
     * @type {string|null}
     */
    this.id = unitData.id || null;

    /**
     * The name of the unit.
     * @type {string}
     */
    this.name = unitData.name;

    /**
     * The base maximum HP of the unit.
     * @type {number}
     * @protected
     */
    this._baseMaxHp = unitData.maxHp;

    /**
     * The current HP of the unit.
     * @type {number}
     */
    this.hp = unitData.maxHp;

    /**
     * The level of the unit.
     * @type {number}
     */
    this.level = unitData.level !== undefined ? unitData.level : 1;

    /**
     * The elemental affinities of the unit.
     * @type {string[]}
     */
    this._baseElements = unitData.elements || [];

    /**
     * The base maximum MP of the unit.
     * @type {number}
     * @protected
     */
    this._baseMaxMp = unitData.maxMp || 0;

    /**
     * The current MP of the unit.
     * @type {number}
     */
    this.mp = unitData.maxMp || 0;
  }

  /**
   * Gets the elemental affinities of the unit.
   * @type {string[]}
   */
  get elements() {
      return this._baseElements;
  }

  /**
   * Gets the effective maximum HP, including traits.
   * @type {number}
   */
  get maxHp() {
      return this._baseMaxHp;
  }
}
