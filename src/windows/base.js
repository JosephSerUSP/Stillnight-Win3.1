import { Graphics } from "../core/utils.js";
import { ConfigManager } from "../managers/index.js";

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
        let frameCounter = 0;

        const animate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            if (progress < 1) {
                // Update only every 3 frames
                if (frameCounter % 3 === 0) {
                     // No easing (constant intensity)
                     // Snap to integer to fit Win 3.1 aesthetic
                     const x = Math.round((Math.random() * 2 - 1) * intensity);
                     const y = Math.round((Math.random() * 2 - 1) * intensity);
                     element.style.transform = `translate(${x}px, ${y}px)`;
                }

                frameCounter++;
                this.activeAnimations.set(element, requestAnimationFrame(animate));
            } else {
                // Snap back to position
                element.style.transform = "";
                this.activeAnimations.delete(element);
            }
        };

        this.activeAnimations.set(element, requestAnimationFrame(animate));
    }

    /**
     * Animates window opening (growing height).
     * @param {HTMLElement} element - The window element.
     * @param {number} targetHeight - The full height of the window.
     * @param {Function} onComplete - Callback when animation finishes.
     */
    open(element, targetHeight, onComplete) {
         if (!element) return;
         if (this.activeAnimations.has(element)) {
             cancelAnimationFrame(this.activeAnimations.get(element));
         }

         // Setup initial state
         element.style.height = "0px";
         // element.style.overflow = "hidden"; // Assumed handled by CSS or logic, but let's ensure clipping if needed.
         // Actually, to hide children, we'll assume the caller manages visibility or overflow.
         // Given "reveals itself", overflow hidden on the frame is best.
         const originalOverflow = element.style.overflow;
         element.style.overflow = "hidden";

         // Hide children initially by setting opacity 0? Or just relying on height clipping?
         // "after that is finished, it draws its contents" -> suggests children are not visible until end.
         // We can toggle a class or style on children.
         // For now, let's rely on clipping + explicit child hiding by caller if needed,
         // but the prompt says "it draws its contents", which might mean making them visible.
         // Let's assume the caller (Window_Base) handles child visibility.

         let currentHeight = 0;
         let frameCounter = 0;

         const animate = () => {
             // Every 3 frames
             if (frameCounter % 3 === 0) {
                 currentHeight += 32;
                 if (currentHeight >= targetHeight) {
                     currentHeight = targetHeight;
                     element.style.height = `${currentHeight}px`;
                     element.style.overflow = originalOverflow; // Restore overflow
                     this.activeAnimations.delete(element);
                     if (onComplete) onComplete();
                     return;
                 }
                 element.style.height = `${currentHeight}px`;
             }
             frameCounter++;
             this.activeAnimations.set(element, requestAnimationFrame(animate));
         };

         this.activeAnimations.set(element, requestAnimationFrame(animate));
    }

    /**
     * Animates window closing (hides contents, waits, then closes).
     * @param {HTMLElement} element - The window element.
     * @param {Function} onComplete - Callback when animation finishes.
     */
    close(element, onComplete) {
         if (!element) return;
         if (this.activeAnimations.has(element)) {
             cancelAnimationFrame(this.activeAnimations.get(element));
         }

         let frameCounter = 0;
         const durationFrames = 5;

         const animate = () => {
             if (frameCounter >= durationFrames) {
                 this.activeAnimations.delete(element);
                 if (onComplete) onComplete();
                 return;
             }
             frameCounter++;
             this.activeAnimations.set(element, requestAnimationFrame(animate));
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

        // Store target dimensions
        this.width = width;
        this.height = height;

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

        // Internal state for restoration after close animation
        this._originalHeight = null;
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

    open() {
        if (this.overlay) {
            this.overlay.classList.add("active");

            if (ConfigManager.windowAnimations) {
                // Determine target height
                let targetHeight;
                if (this.height === 'auto') {
                    // Temporarily measure
                    const savedHeight = this.element.style.height;
                    this.element.style.height = 'auto';
                    targetHeight = this.element.getBoundingClientRect().height;
                    // If height was previously 0 due to previous close, we need to reset it to auto to measure,
                    // but the animation starts from 0.
                } else {
                    targetHeight = this.height;
                }

                // Hide contents during animation?
                // The prompt says "after that is finished, it draws its contents".
                this.setChildrenVisibility('hidden');

                this.animator.open(this.element, targetHeight, () => {
                    this.setChildrenVisibility('visible');
                    // Ensure final height state is correct
                    if (this.height === 'auto') this.element.style.height = 'auto';
                });
            } else {
                // Ensure visible if animation disabled but previously hidden
                this.setChildrenVisibility('visible');
            }
        }
    }

    close() {
        if (this.overlay) {
            if (ConfigManager.windowAnimations && this.overlay.classList.contains("active")) {
                // Hide contents immediately
                this.setChildrenVisibility('hidden');

                this.animator.close(this.element, () => {
                    this.overlay.classList.remove("active");
                    // Reset visibility/height for next open?
                    // Better to do it on open start, but let's reset height here to avoid flash
                    this.element.style.height = '';
                    if (this.height !== 'auto') this.element.style.height = `${this.height}px`;
                });
            } else {
                this.overlay.classList.remove("active");
            }
        }
    }

    setChildrenVisibility(visibility) {
        // Toggle visibility of children to simulate "drawing contents after reveal"
        // Using opacity allows layout to remain stable
        const val = visibility === 'hidden' ? '0' : '1';
        this.header.style.opacity = val;
        this.content.style.opacity = val;
        this.footer.style.opacity = val;
    }

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
