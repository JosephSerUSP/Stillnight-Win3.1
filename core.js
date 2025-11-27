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
      this._container = document.querySelector(".right-side");
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
