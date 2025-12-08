import { Window_Base } from "./base.js";
import { UI } from "./builder.js";

export class Window_Instability extends Window_Base {
    constructor(x, y) {
        super(x, y, 200, 80, { title: "Instability", closeButton: false, embedded: true });

        this.instabilityBar = null;
        this.instabilityText = null;
        this.createContent();

        // Ensure it's visible and positioned
        this.element.style.position = 'absolute';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.zIndex = '50';
        this.element.style.display = 'block'; // Make sure it's shown
    }

    createContent() {
        this.content.style.display = 'flex';
        this.content.style.flexDirection = 'column';
        this.content.style.alignItems = 'center';
        this.content.style.justifyContent = 'center';
        this.content.style.padding = '10px';

        // Gauge Container
        const gaugeContainer = UI.build(this.content, {
            type: 'panel',
            props: {
                style: {
                    width: '100%',
                    height: '20px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #4a4a4a',
                    position: 'relative',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }
            }
        });

        // Gauge Bar
        this.instabilityBar = UI.build(gaugeContainer, {
            type: 'panel',
            props: {
                style: {
                    width: '0%',
                    height: '100%',
                    backgroundColor: '#9b59b6', // Void purple
                    transition: 'width 0.5s ease-out'
                }
            }
        });

        // Text
        this.instabilityText = UI.build(this.content, {
            type: 'label',
            props: {
                text: '0%',
                style: {
                    marginTop: '5px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                }
            }
        });
    }

    refresh(instability, maxInstability) {
        const percent = Math.floor((instability / maxInstability) * 100);
        this.instabilityBar.style.width = `${percent}%`;
        this.instabilityText.textContent = `${percent}%`;

        // Dynamic Color
        if (percent > 80) {
            this.instabilityBar.style.backgroundColor = '#e74c3c'; // Red
            if (this.animator && Math.random() < 0.1) {
                this.animator.shake(this.element, 2, 200);
            }
        } else if (percent > 50) {
            this.instabilityBar.style.backgroundColor = '#9b59b6'; // Purple
        } else {
            this.instabilityBar.style.backgroundColor = '#3498db'; // Blue
        }
    }
}
