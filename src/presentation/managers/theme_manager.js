/**
 * @class ThemeManager
 * @description Manages the application of visual themes using CSS variables.
 * Handles loading themes from data and switching between them.
 */
export class ThemeManager {
  /**
   * The list of loaded themes.
   * @private
   * @type {Array}
   */
  static _themes = [];

  /**
   * The ID of the currently active theme.
   * @private
   * @type {string}
   */
  static _currentThemeId = 'original';

  /**
   * Initializes the ThemeManager with theme data.
   * @method init
   * @param {Array} themes - The array of theme objects loaded from JSON.
   */
  static init(themes) {
    if (!themes || !Array.isArray(themes)) {
      console.warn("ThemeManager: No themes loaded.");
      return;
    }
    this._themes = themes;
    this.applyTheme(this._currentThemeId);
  }

  /**
   * Applies the specified theme by updating CSS variables on the root element.
   * @method applyTheme
   * @param {string} themeId - The ID of the theme to apply.
   */
  static applyTheme(themeId) {
    const targetTheme = this._themes.find(t => t.id === themeId);
    if (!targetTheme) {
      console.warn(`ThemeManager: Theme '${themeId}' not found.`);
      return;
    }

    const defaultTheme = this._themes.find(t => t.id === 'original');
    const colors = defaultTheme ? { ...defaultTheme.colors, ...targetTheme.colors } : targetTheme.colors;

    this._currentThemeId = themeId;
    const root = document.documentElement;

    for (const [key, value] of Object.entries(colors)) {
      root.style.setProperty(`--${key}`, value);
    }
  }

  /**
   * Cycles to the next available theme.
   * @method cycleTheme
   */
  static cycleTheme() {
    if (this._themes.length === 0) return;
    const currentIndex = this._themes.findIndex(t => t.id === this._currentThemeId);
    const nextIndex = (currentIndex + 1) % this._themes.length;
    this.applyTheme(this._themes[nextIndex].id);
  }

  /**
   * Gets the current theme ID.
   * @method getCurrentThemeId
   * @returns {string} The current theme ID.
   */
  static getCurrentThemeId() {
    return this._currentThemeId;
  }

  /**
   * Gets the list of available themes.
   * @method getThemes
   * @returns {Array} List of theme objects {id, name}.
   */
  static getThemes() {
    return this._themes.map(t => ({ id: t.id, name: t.name }));
  }
}
