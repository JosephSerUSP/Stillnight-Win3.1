/**
 * Generates a random integer within a given range.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The random integer.
 */
export function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Shuffles an array in place.
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
 * @param {string[]} elements - The array of elements.
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
 * @namespace Graphics
 * @description A utility class for accessing screen dimensions.
 */
export const Graphics = {
  /**
   * @type {HTMLElement}
   * @private
   */
  _container: null,

  /**
   * @method _initialize
   * @private
   * @description Initializes the Graphics container.
   */
  _initialize() {
    if (!this._container && typeof document !== 'undefined') {
      this._container = document.querySelector(".right-side");
    }
  },

  /**
   * The width of the game container.
   * @type {number}
   */
  get width() {
    this._initialize();
    return this._container ? this._container.clientWidth : 0;
  },

  /**
   * The height of the game container.
   * @type {number}
   */
  get height() {
    this._initialize();
    return this._container ? this._container.clientHeight : 0;
  },
};
