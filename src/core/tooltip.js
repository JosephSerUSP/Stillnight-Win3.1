/**
 * @class Tooltip
 * @description Manages a global tooltip element used to display information on hover.
 */
export class Tooltip {
  /**
   * Creates a new Tooltip instance and appends it to the document body.
   */
  constructor() {
    /**
     * The DOM element representing the tooltip.
     * @type {HTMLElement}
     */
    this.element = document.createElement("div");
    this.element.id = "tooltip";
    document.body.appendChild(this.element);

    /**
     * Whether the tooltip is currently visible.
     * @type {boolean}
     */
    this.visible = false;
  }

  /**
   * Displays the tooltip at the specified coordinates.
   * Adjusts position to prevent overflow off the screen.
   * @param {number} x - The x-coordinate for the tooltip.
   * @param {number} y - The y-coordinate for the tooltip.
   * @param {string} [title] - Optional title for the tooltip.
   * @param {string} text - The main text content of the tooltip.
   */
  show(x, y, title, text) {
    if (!text) return; // Don't show empty tooltips

    let html = "";
    if (title) {
        html += `<div class="tooltip-title">${title}</div>`;
    }
    html += `<div class="tooltip-text">${text}</div>`;

    this.element.innerHTML = html;
    this.element.style.display = "block";
    this.visible = true;

    const rect = this.element.getBoundingClientRect();
    let finalX = x + 10;
    let finalY = y + 10;

    // Prevent overflow
    if (finalX + rect.width > window.innerWidth) {
        finalX = x - rect.width - 5;
    }
    if (finalY + rect.height > window.innerHeight) {
        finalY = y - rect.height - 5;
    }

    this.element.style.left = `${finalX}px`;
    this.element.style.top = `${finalY}px`;
  }

  /**
   * Hides the tooltip.
   */
  hide() {
    this.element.style.display = "none";
    this.visible = false;
  }
}

/**
 * The global singleton instance of the Tooltip class.
 * @type {Tooltip}
 */
export const tooltip = new Tooltip();
