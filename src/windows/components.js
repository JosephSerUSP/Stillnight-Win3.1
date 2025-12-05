import { getIconStyle, elementToIconId, getPrimaryElements } from "../core/utils.js";
import { generateEffectDescription, generateTraitDescription } from "../core/description_utils.js";
import { tooltip } from "../core/tooltip.js";

/**
 * Base helper to apply standard props to an element.
 * @param {HTMLElement} element
 * @param {Object} props
 */
function applyBaseProps(element, props) {
    if (props.className) {
        if (Array.isArray(props.className)) {
            element.classList.add(...props.className);
        } else if (typeof props.className === 'string') {
            // Append class to avoid overwriting existing classes (like 'icon')
            const classes = props.className.split(' ').filter(c => c.trim().length > 0);
            element.classList.add(...classes);
        }
    }
    if (props.style) {
        Object.assign(element.style, props.style);
    }
    if (props.id) {
        element.id = props.id;
    }
    if (props.dataset) {
        Object.assign(element.dataset, props.dataset);
    }
    if (props.onClick) {
        element.addEventListener("click", props.onClick);
    }
    if (props.tooltip) {
        element.title = props.tooltip; // Native tooltip fallback
        // Custom tooltip integration
        element.addEventListener("mouseenter", (e) => tooltip.show(e.clientX, e.clientY, null, props.tooltip));
        element.addEventListener("mouseleave", () => tooltip.hide());
        element.addEventListener("mousemove", (e) => {
            if (tooltip.visible) tooltip.show(e.clientX, e.clientY, null, props.tooltip);
        });
    }
    if (props.testId) {
        element.dataset.testid = props.testId;
    }
}

/**
 * Appends the element to the parent if provided.
 * @param {HTMLElement} parent
 * @param {HTMLElement} element
 */
function appendToParent(parent, element) {
    if (parent) {
        parent.appendChild(element);
    }
}

/**
 * Component: Panel (Generic Container)
 * @param {HTMLElement|null} parent
 * @param {Object} props
 * @returns {HTMLElement}
 */
export function Component_Panel(parent, props = {}) {
    const el = document.createElement("div");
    applyBaseProps(el, props);
    appendToParent(parent, el);
    return el;
}

/**
 * Component: Label (Text Wrapper)
 * @param {HTMLElement|null} parent
 * @param {Object} props
 * @param {string} props.text
 * @returns {HTMLElement}
 */
export function Component_Label(parent, props = {}) {
    const el = document.createElement(props.tag || "span");
    el.textContent = props.text || "";
    applyBaseProps(el, props);
    appendToParent(parent, el);
    return el;
}

/**
 * Component: Icon
 * @param {HTMLElement|null} parent
 * @param {Object} props
 * @param {number} props.iconId
 * @returns {HTMLElement}
 */
export function Component_Icon(parent, props = {}) {
    const el = document.createElement("span");
    el.classList.add("icon");
    applyBaseProps(el, props);

    if (props.iconId > 0) {
        el.style.backgroundPosition = getIconStyle(props.iconId);
    }

    appendToParent(parent, el);
    return el;
}

/**
 * Component: Button
 * @param {HTMLElement|null} parent
 * @param {Object} props
 * @param {string} props.label
 * @param {boolean} [props.disabled]
 * @returns {HTMLElement}
 */
export function Component_Button(parent, props = {}) {
    const el = document.createElement("button");
    el.textContent = props.label || "";
    el.type = "button"; // Default to button type to prevent form submission behavior

    applyBaseProps(el, props);

    if (props.disabled) {
        el.disabled = true;
        el.classList.add("disabled");
    }

    appendToParent(parent, el);
    return el;
}

/**
 * Component: FlexContainer
 * @param {HTMLElement|null} parent
 * @param {Object} props
 * @param {string} [props.direction='row']
 * @param {string} [props.align='stretch']
 * @param {string} [props.justify='flex-start']
 * @param {string} [props.gap='0px']
 * @returns {HTMLElement}
 */
export function Component_FlexContainer(parent, props = {}) {
    const el = document.createElement("div");
    el.style.display = "flex";
    el.style.flexDirection = props.direction || "row";
    el.style.alignItems = props.align || "stretch";
    el.style.justifyContent = props.justify || "flex-start";
    el.style.gap = props.gap || "0px";

    applyBaseProps(el, props);
    appendToParent(parent, el);
    return el;
}

/**
 * Component: GridContainer
 * @param {HTMLElement|null} parent
 * @param {Object} props
 * @param {number} [props.columns]
 * @param {string} [props.templateColumns]
 * @param {string} [props.gap='0px']
 * @returns {HTMLElement}
 */
export function Component_GridContainer(parent, props = {}) {
    const el = document.createElement("div");
    el.style.display = "grid";
    if (props.templateColumns) {
        el.style.gridTemplateColumns = props.templateColumns;
    } else if (props.columns) {
        el.style.gridTemplateColumns = `repeat(${props.columns}, 1fr)`;
    }
    el.style.gap = props.gap || "0px";

    applyBaseProps(el, props);
    appendToParent(parent, el);
    return el;
}

/**
 * Component: Gauge
 * @param {HTMLElement|null} parent
 * @param {Object} props
 * @param {number} [props.value=0] - Current value (0-100) or decimal (0.0-1.0) if rawValue is true? No, let's assume 0-100 for now or stick to creating the container structure.
 *                                  Actually, existing logic takes width/height/color.
 * @param {string|number} [props.width] - Width in px or string
 * @param {string} [props.height="6px"]
 * @param {string} [props.color] - Fill color
 * @param {string} [props.bgColor] - Background color
 * @returns {Object} { container, fill }
 */
export function Component_Gauge(parent, props = {}) {
    const container = document.createElement("div");
    container.className = "gauge"; // Base class

    applyBaseProps(container, props);

    if (props.width) {
        container.style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
    }
    container.style.height = props.height || "6px";
    if (props.bgColor) container.style.backgroundColor = props.bgColor;

    const fill = document.createElement("div");
    fill.className = "gauge-fill";
    if (props.color) {
        fill.style.backgroundColor = props.color;
    }

    container.appendChild(fill);

    appendToParent(parent, container);
    return { container, fill };
}

/**
 * Component: ElementIcon
 * @param {HTMLElement|null} parent
 * @param {Object} props
 * @param {string[]} props.elements
 * @returns {HTMLElement}
 */
export function Component_ElementIcon(parent, props = {}) {
    const elements = props.elements || [];
    const primaryElements = getPrimaryElements(elements);
    const container = document.createElement('div');

    if (primaryElements.length <= 1) {
        container.className = 'element-icon-container-name';
        if (primaryElements.length === 1) {
            const iconId = elementToIconId(primaryElements[0]);
            container.appendChild(Component_Icon(null, { iconId }));
        } else {
            const icon = document.createElement('div');
            icon.className = 'icon';
            container.appendChild(icon);
        }
    } else {
        container.className = 'element-icon-container';
        const positions = [
            { top: '0px', left: '0px' },
            { top: '6px', left: '6px' },
            { top: '0px', left: '6px' },
            { top: '6px', left: '0px' },
        ];
        primaryElements.forEach((element, index) => {
            if (index < 4) {
                const iconId = elementToIconId('l_' + element);
                const icon = Component_Icon(null, { iconId, className: 'element-icon' });
                icon.style.top = positions[index].top;
                icon.style.left = positions[index].left;
                container.appendChild(icon);
            }
        });
    }

    applyBaseProps(container, props);
    appendToParent(parent, container);
    return container;
}

/**
 * Component: InteractiveLabel
 * @param {HTMLElement|null} parent
 * @param {Object} props
 * @param {Object} props.data - The data object (item, skill, etc)
 * @param {string} props.type - 'item', 'skill', 'passive'
 * @param {boolean} [props.showTooltip=true]
 * @param {string} [props.tooltipText] - Override tooltip text
 * @param {string[]} [props.elements] - Override elements
 */
export function Component_Overlay(parent, props = {}) {
    const el = document.createElement("div");
    el.className = "modal-overlay";
    applyBaseProps(el, props);
    appendToParent(parent, el);
    return el;
}

export function Component_CloseButton(parent, props = {}) {
    const defaultProps = {
        className: 'win-btn',
        label: 'X',
        ...props
    };
    return Component_Button(parent, defaultProps);
}

export function Component_Image(parent, props = {}) {
    const el = document.createElement("img");
    if (props.src) el.src = props.src;
    applyBaseProps(el, props);
    appendToParent(parent, el);
    return el;
}

export function makeDraggable(element, handle) {
    let dragStart = null;
    const onDrag = (e) => {
        if (dragStart) {
            element.style.left = `${e.clientX - dragStart.x}px`;
            element.style.top = `${e.clientY - dragStart.y}px`;
        }
    };
    const onDragEnd = () => {
        dragStart = null;
        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("mouseup", onDragEnd);
    };

    handle.addEventListener("mousedown", (e) => {
        dragStart = {
            x: e.clientX - element.offsetLeft,
            y: e.clientY - element.offsetTop,
        };
        document.addEventListener("mousemove", onDrag);
        document.addEventListener("mouseup", onDragEnd);
    });
}

export function Component_InteractiveLabel(parent, props = {}) {
    const { data, type } = props;
    const container = document.createElement("span");
    container.className = "interactive-label";
    container.style.display = "inline-flex";
    container.style.alignItems = "center";
    container.style.marginRight = "5px";

    // Standard props (className, etc)
    applyBaseProps(container, props);

    // Explicit override for tooltip behavior since we handle it specifically below
    // But applyBaseProps handles generic tooltips.
    // We will attach the specific game-logic tooltip manually.

    // Icon / Elements
    let iconId = data.icon;
    if (!iconId && type === 'item') {
        iconId = 6; // Default placeholder for items
    }

    if (type === 'skill' || (data.element || data.elements)) {
        let elements = data.elements || (data.element ? [data.element] : []);
        if (props.elements) elements = props.elements;

        if (elements.length > 0) {
            Component_ElementIcon(container, { elements });
        } else if (iconId) {
             const icon = Component_Icon(container, { iconId });
             icon.style.marginRight = "4px";
        }
    } else if (iconId) {
        const icon = Component_Icon(container, { iconId });
        icon.style.marginRight = "4px";
    }

    const nameSpan = document.createElement("span");
    nameSpan.textContent = data.name;
    if (type === 'skill' || type === 'passive') {
         nameSpan.style.textDecoration = "underline";
         nameSpan.style.textDecorationStyle = "dotted";
    }
    container.appendChild(nameSpan);

    // Tooltip Logic
    if (props.showTooltip !== false) {
        let text = props.tooltipText || data.description || "";

        if (!props.tooltipText) {
             let functionalText = "";

             // Traits (Equipment, Passives, States)
             if (data.traits && Array.isArray(data.traits)) {
                 const traitDescs = data.traits.map(t => generateTraitDescription(t)).filter(Boolean);
                 if (traitDescs.length > 0) {
                     functionalText += traitDescs.join("<br/>");
                 }
             }

             // Effects (Consumables)
            if (data.effects && typeof data.effects === 'object' && !Array.isArray(data.effects)) {
                  const effectDescs = Object.entries(data.effects).map(([k, v]) => generateEffectDescription(k, v)).filter(Boolean);
                  if (effectDescs.length > 0) {
                      if (functionalText) functionalText += "<br/>";
                      functionalText += effectDescs.join("<br/>");
                  }
             }

             // Legacy/Manual 'effect' string (e.g. for Passives if they still use it)
             if (data.effect && typeof data.effect === 'string') {
                  if (functionalText) functionalText += "<br/>";
                  functionalText += data.effect;
             }

             // Append to main text
             if (functionalText) {
                 text += `<br/><span class="text-functional" style="font-size: 0.9em;">${functionalText}</span>`;
             }
        }

        if (text) {
             container.style.cursor = "help";
             // Remove any listeners added by applyBaseProps for 'tooltip' prop if they conflict?
             // Actually, applyBaseProps uses props.tooltip. Here we use constructed text.

             container.addEventListener("mouseenter", (e) => {
                tooltip.show(e.clientX, e.clientY, null, text);
            });
            container.addEventListener("mouseleave", () => {
                tooltip.hide();
            });
            container.addEventListener("mousemove", (e) => {
                if (tooltip.visible) {
                    tooltip.show(e.clientX, e.clientY, null, text);
                }
            });
        }
    }

    appendToParent(parent, container);
    return container;
}
