import {
    Component_Panel,
    Component_Label,
    Component_Icon,
    Component_Button,
    Component_FlexContainer,
    Component_GridContainer,
    Component_Gauge,
    Component_ElementIcon,
    Component_InteractiveLabel,
    Component_Overlay,
    Component_CloseButton,
    Component_Image
} from "./components.js";

const COMPONENT_MAP = {
    'panel': Component_Panel,
    'label': Component_Label,
    'icon': Component_Icon,
    'button': Component_Button,
    'flex': Component_FlexContainer,
    'grid': Component_GridContainer,
    'gauge': Component_Gauge,
    'element-icon': Component_ElementIcon,
    'interactive-label': Component_InteractiveLabel,
    'overlay': Component_Overlay,
    'close-button': Component_CloseButton,
    'image': Component_Image
};

export const UI = {
    /**
     * Builds a DOM tree from a declarative structure.
     * @param {HTMLElement|null} parent - The parent element to append to.
     * @param {Object} structure - The structure definition.
     * @param {string} structure.type - The component type (e.g., 'panel', 'label').
     * @param {Object} [structure.props] - Properties to pass to the component.
     * @param {string} [structure.ref] - Key to store the component reference in the refs object.
     * @param {Array<Object>} [structure.children] - Child structures.
     * @param {Object} [refs={}] - Mutable object to store named references.
     * @returns {HTMLElement|Object} - The created element (or object for complex components).
     */
    build(parent, structure, refs = {}) {
        if (!structure || !structure.type) {
            console.warn("UI.build: Invalid structure", structure);
            return null;
        }

        const componentFn = COMPONENT_MAP[structure.type];
        if (!componentFn) {
            console.warn(`UI.build: Unknown component type '${structure.type}'`);
            return null;
        }

        // Create the element
        const result = componentFn(parent, structure.props || {});

        // Store reference if requested
        if (structure.ref) {
            refs[structure.ref] = result;
        }

        // Handle complex components that return an object { container, fill } instead of just element
        // Convention: If an object is returned and has a 'container' property, use that as the parent for children.
        // Otherwise, assume the result itself is the element.
        let element = result;
        if (result && result.container instanceof HTMLElement) {
             element = result.container;
        }

        // Process children
        if (structure.children && Array.isArray(structure.children)) {
            structure.children.forEach(child => {
                this.build(element, child, refs);
            });
        }

        return result;
    }
};
