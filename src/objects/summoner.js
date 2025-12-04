/**
 * @class Game_Summoner
 * @description Represents the player character who commands the party.
 * Handles meta-progression, resources (Magnetite), and summoning stats.
 */
export class Game_Summoner {
  /**
   * Creates a new Game_Summoner instance.
   * @param {Object} [data] - Saved data to restore from.
   */
  constructor(data = {}) {
    /**
     * The name of the summoner.
     * @type {string}
     */
    this.name = data.name || "Summoner";

    /**
     * Current Level.
     * @type {number}
     */
    this.level = data.level || 1;

    /**
     * Current Experience.
     * @type {number}
     */
    this.exp = data.exp || 0;

    /**
     * Authority (AUT): Determines max party size (future) and max MAG.
     * @type {number}
     */
    this.authority = data.authority || 5;

    /**
     * Synchronicity (SYN): Determines action speed in battle.
     * @type {number}
     */
    this.synchronicity = data.synchronicity || 5;

    /**
     * Lucidity (LUC): Resistance to mental effects and trap avoidance.
     * @type {number}
     */
    this.lucidity = data.lucidity || 5;

    /**
     * Current Magnetite (MAG).
     * @type {number}
     */
    this.mag = data.mag !== undefined ? data.mag : this.maxMag;

    /**
     * Equipment slots.
     * @type {Object}
     */
    this.equipment = data.equipment || {
      weapon: null,
      gear: null,
      accessory: null
    };
  }

  /**
   * Gets the maximum Magnetite capacity.
   * Formula: (Level * 50) + (Authority * 100)
   * @type {number}
   */
  get maxMag() {
    return (this.level * 50) + (this.authority * 100);
  }

  /**
   * Gets the Action Speed (ASP) for battle turn order.
   * Formula: Synchronicity * 2
   * @type {number}
   */
  get asp() {
    return this.synchronicity * 2;
  }

  /**
   * Calculates XP needed for next level.
   * @returns {number}
   */
  xpNeeded() {
    return this.level * 100;
  }

  /**
   * Gains Experience and handles leveling up.
   * @param {number} amount
   * @returns {Object} { leveledUp, newLevel }
   */
  gainExp(amount) {
    this.exp += amount;
    let leveledUp = false;
    while (this.exp >= this.xpNeeded()) {
      this.exp -= this.xpNeeded();
      this.level++;
      this.authority += 1; // Simple progression for now
      this.synchronicity += 1;
      this.lucidity += 1;
      leveledUp = true;
    }
    return { leveledUp, newLevel: this.level };
  }

  /**
   * Consumes Magnetite.
   * @param {number} amount
   * @returns {boolean} True if MAG was available, False if depleted (0).
   */
  consumeMag(amount) {
    if (this.mag <= 0) return false;
    this.mag = Math.max(0, this.mag - amount);
    return true;
  }

  /**
   * Replenishes Magnetite.
   * @param {number} amount
   */
  replenishMag(amount) {
    this.mag = Math.min(this.maxMag, this.mag + amount);
  }

  /**
   * Fully restores Magnetite.
   */
  recoverAll() {
    this.mag = this.maxMag;
  }
}
