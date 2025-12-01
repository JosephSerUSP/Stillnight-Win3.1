import { Graphics } from "../core/utils.js";

/**
 * @class WindowAnimator
 * @description Handles procedural animations for windows.
 */
export class WindowAnimator {
    constructor() {
        this.activeAnimations = new Map();
    }

    /**
     * Shakes a window element.
     * @param {HTMLElement} element - The element to shake.
     * @param {number} [intensity=5] - Max pixel offset.
     * @param {number} [duration=300] - Duration in ms.
     */
    shake(element, intensity = 5, duration = 300) {
        if (!element) return;
        if (this.activeAnimations.has(element)) {
            cancelAnimationFrame(this.activeAnimations.get(element));
        }

        const startTime = performance.now();

        const animate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            if (progress < 1) {
                // Damping shake
                const currentIntensity = intensity * (1 - progress);
                const x = (Math.random() * 2 - 1) * currentIntensity;
                const y = (Math.random() * 2 - 1) * currentIntensity;

                // Snap to integer to fit Win 3.1 aesthetic
                const intX = Math.round(x);
                const intY = Math.round(y);

                element.style.transform = `translate(${intX}px, ${intY}px)`;

                this.activeAnimations.set(element, requestAnimationFrame(animate));
            } else {
                element.style.transform = "";
                this.activeAnimations.delete(element);
            }
        };

        this.activeAnimations.set(element, requestAnimationFrame(animate));
    }
}

/**
 * @class Window_Base
 * @description The base class for all UI windows. Defines the standard structure
 * (Frame, Header, Content, Footer) and handles drag/drop and lifecycle.
 */
export class Window_Base {
    /**
     * @param {number|string} x
     * @param {number|string} y
     * @param {number} width
     * @param {number|string} height
     * @param {Object} options
     * @param {string} [options.title]
     * @param {boolean} [options.closeButton=true]
     */
    constructor(x, y, width, height, options = {}) {
        this.embedded = options.embedded || false;
        this.animator = new WindowAnimator();

        if (this.embedded) {
            this.element = document.createElement("div");
            this.element.className = "window-frame";
            if (options.id) this.element.id = options.id;
            this.element.style.position = "relative";
            if (width !== 'auto') this.element.style.width = `${width}px`;
            if (height !== 'auto') this.element.style.height = `${height}px`;
        } else {
            this.overlay = document.createElement("div");
            this.overlay.className = "modal-overlay";
            this.overlay.addEventListener("mousedown", (e) => {
                if (e.target === this.overlay) {
                    this.onUserClose();
                }
            });

            this.element = document.createElement("div");
            this.element.className = "window-frame";
            if (options.id) this.element.id = options.id;
            this.element.style.position = "absolute";

            const finalX = x === 'center' ? (Graphics.width - width) / 2 : x;
            const finalY = y === 'center' ? (Graphics.height - height) / 2 : y;

            this.element.style.left = `${finalX}px`;
            this.element.style.top = `${finalY}px`;
            this.element.style.width = `${width}px`;

            if (height === 'auto') {
                this.element.style.height = 'auto';
                this.element.style.maxHeight = '90vh';
            } else {
                this.element.style.height = `${height}px`;
            }
            this.element.style.zIndex = "10";

            this.overlay.appendChild(this.element);
        }

        // 1. Header
        this.header = document.createElement("div");
        this.header.className = "window-header";
        this.element.appendChild(this.header);

        this.titleEl = document.createElement("span");
        this.titleEl.textContent = options.title || "";
        this.header.appendChild(this.titleEl);

        if (!this.embedded) {
            this.makeDraggable(this.header);
        }

        if (options.closeButton !== false && !this.embedded) {
            this.btnClose = document.createElement("button");
            this.btnClose.className = "win-btn";
            this.btnClose.textContent = "X";
            this.btnClose.onclick = () => this.onUserClose();
            this.header.appendChild(this.btnClose);
        }

        // 2. Content
        this.content = document.createElement("div");
        this.content.className = "window-content";
        this.element.appendChild(this.content);

        // 3. Footer
        this.footer = document.createElement("div");
        this.footer.className = "window-footer";
        // Check if footer needs to be visible? CSS handles padding.
        this.element.appendChild(this.footer);

        this._dragStart = null;
        this._onDragHandler = this._onDrag.bind(this);
        this._onDragEndHandler = this._onDragEnd.bind(this);
    }

    makeDraggable(titleBar) {
        titleBar.addEventListener("mousedown", (e) => {
            this._dragStart = {
                x: e.clientX - this.element.offsetLeft,
                y: e.clientY - this.element.offsetTop,
            };
            document.addEventListener("mousemove", this._onDragHandler);
            document.addEventListener("mouseup", this._onDragEndHandler);
        });
    }

    _onDrag(e) {
        if (this._dragStart) {
            this.element.style.left = `${e.clientX - this._dragStart.x}px`;
            this.element.style.top = `${e.clientY - this._dragStart.y}px`;
        }
    }

    _onDragEnd() {
        this._dragStart = null;
        document.removeEventListener("mousemove", this._onDragHandler);
        document.removeEventListener("mouseup", this._onDragEndHandler);
    }

    open() { if (this.overlay) this.overlay.classList.add("active"); }
    close() { if (this.overlay) this.overlay.classList.remove("active"); }
    onEscape() { this.onUserClose(); }
    onUserClose() { this.close(); }
    refresh() {}

    /**
     * Updates the window title.
     * @param {string} text
     */
    setTitle(text) {
        this.titleEl.textContent = text;
    }

    /**
     * Adds a button to the footer.
     * @param {string} label
     * @param {Function} onClick
     * @returns {HTMLButtonElement}
     */
    addButton(label, onClick) {
        const btn = document.createElement("button");
        btn.className = "win-btn";
        btn.textContent = label;
        btn.onclick = onClick;
        this.footer.appendChild(btn);
        return btn;
    }

    /**
     * Creates a standard panel inside the content.
     * @returns {HTMLElement}
     */
    createPanel() {
        const panel = document.createElement("div");
        panel.className = "window-panel";
        this.content.appendChild(panel);
        return panel;
    }
}
