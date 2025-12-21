import { Graphics } from "../../core/utils.js";
import { UI } from "./builder.js";
import { SettingsAdapter } from "../../adapters/settings_adapter.js";
import { makeDraggable } from "./components.js";

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

         element.style.height = "0px";
         const originalOverflow = element.style.overflow;
         element.style.overflow = "hidden";

         // 1. Calculate the dynamic growth rate based on target height
         let growthRate = 64;
         if (targetHeight > 320) {
             const extraSpeed = Math.floor((targetHeight - 320) / 32) * 10;
             growthRate += extraSpeed;
         }

         let currentHeight = 0;
         let frameCounter = 0;

         const animate = () => {
             // Every 3 frames
             if (frameCounter % 3 === 0) {
                 currentHeight += growthRate;

                 if (currentHeight >= targetHeight) {
                     currentHeight = targetHeight;
                     element.style.height = `${currentHeight}px`;
                     element.style.overflow = originalOverflow;
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
         const durationFrames = 8;

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
     * @param {string} [options.id]
     * @param {boolean} [options.embedded]
     * @param {boolean} [options.showTitleBar=true]
     */
    constructor(x, y, width, height, options = {}) {
        this.embedded = options.embedded || false;
        this.animator = new WindowAnimator();
        this.isFullyOpen = false;
        this.showTitleBar = options.showTitleBar !== false;

        // Store target dimensions
        this.width = width;
        this.height = height;

        // --- Refactoring to use UI.build more extensively ---

        // Main Element Construction
        const elementProps = {
            className: "window-frame",
            id: options.id || undefined,
            style: {}
        };

        if (this.embedded) {
            elementProps.style.position = "relative";
            if (width !== 'auto') elementProps.style.width = `${width}px`;
            if (height !== 'auto') elementProps.style.height = `${height}px`;
        } else {
            elementProps.style.position = "absolute";
            const finalX = x === 'center' ? (Graphics.width - width) / 2 : x;
            const finalY = y === 'center' ? (Graphics.height - height) / 2 : y;
            elementProps.style.left = `${finalX}px`;
            elementProps.style.top = `${finalY}px`;
            elementProps.style.width = `${width}px`;
            elementProps.style.height = height === 'auto' ? 'auto' : `${height}px`;
            if (height === 'auto') elementProps.style.maxHeight = '90vh';
            elementProps.style.zIndex = "10";
            elementProps.style.display = "none";
        }

        // Build main element
        this.element = UI.build(null, {
            type: 'panel', // 'panel' creates a div
            props: elementProps
        });

        // Overlay Construction (if not embedded)
        if (!this.embedded) {
            this.overlay = UI.build(null, {
                type: 'overlay',
                props: {
                    onClick: (e) => {
                         if (e.target === this.overlay) {
                             this.onUserClose();
                         }
                    }
                }
            });
        }

        // 1. Header Construction
        const headerChildren = [
            { type: 'label', props: { text: options.title || "" } }
        ];

        if (options.closeButton !== false && !this.embedded) {
            headerChildren.push({
                type: 'close-button',
                props: {
                    onClick: () => this.onUserClose()
                }
            });
        }

        const headerStruct = {
            type: 'panel',
            props: { className: 'window-header' },
            children: headerChildren
        };
        this.header = UI.build(this.element, headerStruct);
        this.titleEl = this.header.querySelector("span");

        if (!this.showTitleBar) {
            this.header.style.display = "none";
        }

        if (!this.embedded) {
            makeDraggable(this.element, this.header);
        }

        // 2. Content Construction
        this.content = UI.build(this.element, {
            type: 'panel',
            props: { className: 'window-content' }
        });

        // 3. Footer Construction
        this.footer = UI.build(this.element, {
            type: 'panel',
            props: { className: 'window-footer' }
        });
    }

    open() {
        if (this.overlay) {
            this.overlay.classList.add("active");
            this.element.style.display = "";
            this.isFullyOpen = false;

            if (SettingsAdapter.windowAnimations) {
                let targetHeight;
                if (this.height === 'auto') {
                    const savedHeight = this.element.style.height;
                    this.element.style.height = 'auto';
                    targetHeight = this.element.scrollHeight; // Use scrollHeight for reliability
                    if (targetHeight === 0) targetHeight = this.element.getBoundingClientRect().height;
                } else {
                    targetHeight = this.height;
                }

                this.setChildrenVisibility('hidden');

                this.animator.open(this.element, targetHeight, () => {
                    this.setChildrenVisibility('visible');
                    if (this.height === 'auto') this.element.style.height = 'auto';
                    this.isFullyOpen = true;
                    this.onOpenComplete();
                });
            } else {
                this.setChildrenVisibility('visible');
                this.isFullyOpen = true;
                this.onOpenComplete();
            }
        }
    }

    close() {
        if (this.overlay) {
            this.isFullyOpen = false;
            if (SettingsAdapter.windowAnimations && this.overlay.classList.contains("active")) {
                this.setChildrenVisibility('hidden');

                this.animator.close(this.element, () => {
                    this.overlay.classList.remove("active");
                    this.element.style.display = "none";
                    this.element.style.height = '';
                    if (this.height !== 'auto') this.element.style.height = `${this.height}px`;
                });
            } else {
                this.overlay.classList.remove("active");
                this.element.style.display = "none";
            }
        }
    }

    setChildrenVisibility(visibility) {
        const val = visibility === 'hidden' ? '0' : '1';
        this.header.style.opacity = val;
        this.content.style.opacity = val;
        this.footer.style.opacity = val;
    }

    onEscape() { this.onUserClose(); }
    onUserClose() { this.close(); }
    refresh() {}
    onOpenComplete() {}

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
        const structure = {
            type: 'button',
            props: {
                className: 'win-btn',
                label: label,
                onClick: onClick
            }
        };
        const btn = UI.build(this.footer, structure);
        return btn;
    }

    /**
     * Creates a standard panel inside the content.
     * @returns {HTMLElement}
     */
    createPanel() {
        const structure = {
            type: 'panel',
            props: { className: 'window-panel' }
        };
        const panel = UI.build(this.content, structure);
        return panel;
    }
}
