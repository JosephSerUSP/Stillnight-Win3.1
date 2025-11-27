export class Tooltip {
  constructor() {
    this.element = document.createElement("div");
    this.element.id = "tooltip";
    document.body.appendChild(this.element);
    this.visible = false;
  }

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

  hide() {
    this.element.style.display = "none";
    this.visible = false;
  }
}

// Singleton instance
export const tooltip = new Tooltip();
