/**
 * Generates a random integer within a given range (inclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The random integer.
 */
export function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Probabilistically rounds a floating point number.
 * For example, 1.25 becomes 1 (75% chance) or 2 (25% chance).
 * @param {number} value - The value to round.
 * @returns {number} The rounded integer.
 */
export function probabilisticRound(value) {
    const floor = Math.floor(value);
    const fraction = value - floor;
    return Math.random() < fraction ? floor + 1 : floor;
}

/**
 * Shuffles an array in place using the Fisher-Yates shuffle algorithm.
 * @param {Array} arr - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
export function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Determines the primary element(s) from an array of elements.
 * The primary element is the one that appears most frequently.
 * If there's a tie, all tied elements are returned.
 * @param {string[]} elements - The array of elements (e.g., ["Fire", "Water"]).
 * @returns {string[]} An array of the primary element(s).
 */
export function getPrimaryElements(elements) {
  if (!elements || elements.length === 0) {
    return [];
  }

  const counts = elements.reduce((acc, element) => {
    acc[element] = (acc[element] || 0) + 1;
    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(counts));

  return Object.keys(counts).filter((element) => counts[element] === maxCount);
}

/**
 * Converts an element name to its ASCII abbreviation representation.
 * @param {string} element - The element name (e.g., "Red").
 * @returns {string} The ASCII representation of the element (e.g., "(R)").
 */
export function elementToAscii(element) {
  switch (element) {
    case "Red": return "(R)";
    case "Green": return "(G)";
    case "Blue": return "(B)";
    case "White": return "(W)";
    case "Black": return "(K)";
    default: return "";
  }
}

/**
 * Converts an element name to its corresponding icon ID.
 * @param {string} element - The element name.
 * @returns {number} The icon ID of the element.
 */
export function elementToIconId(element) {
  switch (element) {
    case "Red": return 1;
    case "Green": return 2;
    case "Blue": return 3;
    case "White": return 4;
    case "Black": return 5;
    case "l_Red": return 11;
    case "l_Green": return 12;
    case "l_Blue": return 13;
    case "l_White": return 14;
    case "l_Black": return 15;
    default: return 0;
  }
}

/**
 * Gets the background position style for a specific icon ID.
 * Assumes a 10-column icon sheet with 12x12 icons.
 * @param {number} iconId - The icon ID (1-based).
 * @returns {string} The CSS background-position string.
 */
export function getIconStyle(iconId) {
  if (iconId <= 0) return '0px 0px';
  const iconIndex = iconId - 1;
  const x = (iconIndex % 10) * 12;
  const y = Math.floor(iconIndex / 10) * 12;
  return `-${x}px -${y}px`;
}

/**
 * Picks an element from an array based on weight.
 * @param {Array} options - Array of objects with a 'weight' property.
 * @returns {Object|null} The selected object.
 */
export function pickWeighted(options) {
  if (!options || options.length === 0) return null;
  const totalWeight = options.reduce((sum, opt) => sum + (opt.weight || 1), 0);
  let r = Math.random() * totalWeight;
  for (const opt of options) {
    r -= (opt.weight || 1);
    if (r <= 0) return opt;
  }
  return options[options.length - 1];
}

/**
 * @namespace Graphics
 * @description A utility class for accessing global screen/container dimensions.
 */
export const Graphics = {
  /**
   * The container element where the game is rendered.
   * @type {HTMLElement}
   * @private
   */
  _container: null,

  /**
   * Initializes the Graphics container by selecting the ".right-side" element.
   * @method _initialize
   * @private
   */
  _initialize() {
    if (!this._container && typeof document !== 'undefined') {
      this._container = document.getElementById("game-container");
    }
  },

  /**
   * Gets the width of the game container.
   * @type {number}
   */
  get width() {
    this._initialize();
    return this._container ? this._container.clientWidth : 0;
  },

  /**
   * Gets the height of the game container.
   * @type {number}
   */
  get height() {
    this._initialize();
    return this._container ? this._container.clientHeight : 0;
  },
};

/**
 * Safely evaluates a formula string.
 * @param {string} formula - The formula (e.g. "a.atk * 4").
 * @param {Object} a - The source/attacker context.
 * @param {Object} [b={}] - The target/defender context.
 * @returns {number} The result.
 */
export function evaluateFormula(formula, a, b = {}) {
    try {
        const f = new Function("a", "b", "return " + formula);
        return f(a, b);
    } catch (e) {
        console.error("Formula error:", formula, e);
        return 0;
    }
}

/**
 * Generates a human-readable description for a trait.
 * @param {Object} trait - The trait object { code, dataId, value }.
 * @returns {string} The description.
 */
export function generateTraitDescription(trait) {
    const pct = (val) => `${Math.round(val * 100)}%`;
    const val = trait.value;
    const paramNames = { maxHp: 'Max HP', atk: 'ATK', def: 'DEF', mat: 'MAT', mdf: 'MDF', agi: 'AGI', luk: 'LUK' };

    switch (trait.code) {
        case 'PARAM_PLUS':
            return `${val >= 0 ? '+' : ''}${val} ${paramNames[trait.dataId] || trait.dataId}`;
        case 'PARAM_RATE':
            return `${paramNames[trait.dataId] || trait.dataId} x${val}`;
        case 'HRG': return `HP Regen ${pct(val)}`;
        case 'EVA': return `Evasion +${pct(val)}`;
        case 'CRI': return `Crit Rate +${pct(val)}`;
        case 'CEV': return `Crit Evasion +${pct(val)}`;
        case 'HIT': return `Hit Rate +${pct(val)}`;
        case 'TGR': return `Target Rate x${pct(val)}`;
        case 'GRD': return `Guard Effect ${pct(val)}`;
        case 'REC': return `Recovery Effect ${pct(val)}`;
        case 'PHA': return `Pharmacology ${pct(val)}`;
        case 'MCV': return `MP Cost ${pct(val)}`;
        case 'TCR': return `TP Charge ${pct(val)}`;
        case 'PDR': return `Phys Dmg Taken ${pct(val)}`;
        case 'MDR': return `Mag Dmg Taken ${pct(val)}`;
        case 'FDR': return `Floor Dmg ${pct(val)}`;
        case 'EXR': return `Exp Rate ${pct(val)}`;
        case 'GDR': return `Gold Rate ${pct(val)}`;
        case 'RESTRICTION': return `Restriction: ${val}`;
        case 'ELEMENT_RATE': return `${trait.dataId} Dmg x${pct(val)}`;
        case 'DEBUFF_RATE': return `${trait.dataId} Resist ${pct(val)}`;
        case 'STATE_RATE': return `${trait.dataId} Chance ${pct(val)}`;
        case 'STATE_RESIST': return `Immune to ${trait.dataId}`;
        case 'ATTACK_ELEMENT': return `Attack Element: ${trait.dataId}`;
        case 'ATTACK_STATE': return `Attack State: ${trait.dataId} ${pct(val)}`;
        case 'SLOT_TYPE': return `Slot Type: ${val}`;
        case 'ACTION_PLUS': return `Actions +${val}`;
        case 'SPECIAL_FLAG': return `Special: ${val}`;
        case 'COLLAPSE_TYPE': return `Collapse: ${val}`;
        case 'PARTY_ABILITY': return `Party Ability: ${val}`;
        case 'ON_PERMADEATH': return "Revives once on death";
        case 'SYMBIOSIS': return "Heals neighbors";
        case 'SEE_WALLS': return "Reveals breakable walls";
        case 'SEE_TRAPS': return "Reveals traps";
        case 'INITIATIVE': return `Initiative +${val}`;
        case 'REAR_GUARD': return "Prevents sneak attacks";
        case 'GOLD_DIGGER': return `Bonus Gold +${val}`;
        case 'POST_BATTLE_HEAL': return `Post-Battle Heal ${val}`;
        case 'BATTLE_START_DAMAGE': return `Start Dmg ${val}`;
        case 'MOVE_HEAL': return `Heals on move ${val}`;
        case 'FLEE_CHANCE_BONUS': return `Flee chance +${pct(val)}`;
        default: return `${trait.code} ${val}`;
    }
}

/**
 * Generates a human-readable description for an item effect.
 * @param {string} key - The effect key (e.g., 'hp', 'recruit_egg').
 * @param {any} value - The effect value.
 * @param {import("../managers/index.js").DataManager} [dataManager] - Optional data manager for lookups.
 * @returns {string} The description.
 */
export function generateEffectDescription(key, value, dataManager) {
    switch (key) {
        case 'hp': return `Restores ${value} HP`;
        case 'maxHp': return `Max HP +${value}`;
        case 'xp': return `Grants ${value} XP`;
        case 'recruit_egg': return `Recruits a monster`;
        case 'hp_drain': return `Drains ${value} HP`;
        default: return `${key}: ${value}`;
    }
}
