import { getPrimaryElements, elementToAscii, getIconStyle, elementToIconId, evaluateFormula } from "../core/utils.js";
import { tooltip } from "../core/tooltip.js";
import { Component_Icon, Component_ElementIcon, Component_Gauge, Component_InteractiveLabel, Component_Label } from "./components.js";
import { ProgressionSystem } from "../managers/progression.js";

/**
 * Creates a DOM element representing a standard icon.
 * @param {number} iconId - The icon ID.
 * @param {Object} [options] - Configuration options.
 * @param {string} [options.className] - Additional CSS class.
 * @param {string} [options.tooltip] - Tooltip text.
 * @returns {HTMLElement} The icon element.
 */
export function createIcon(iconId, options = {}) {
    return Component_Icon(null, { iconId, ...options });
}

/**
 * Creates a DOM element representing an icon for a set of elements.
 * @param {string[]} elements - The elements.
 * @returns {HTMLElement} The icon container element.
 */
export function createElementIcon(elements) {
    return Component_ElementIcon(null, { elements });
}

/**
 * Renders a row of element icons.
 * @param {string[]} elements - The elements.
 * @returns {HTMLElement} The container element.
 */
export function renderElements(elements) {
    const container = document.createElement('div');
    container.className = 'element-container';
    elements.forEach(element => {
        const iconId = elementToIconId(element);
        if (iconId > 0) {
            Component_Icon(container, { iconId });
        }
    });
    return container;
}

/**
 * Creates a standardized label for a battler's name, including elemental icons and status indicators.
 * @param {import("../objects/objects.js").Game_Battler} battler - The battler.
 * @param {Object} [options] - Configuration options.
 * @param {string} [options.evolutionStatus] - 'AVAILABLE', 'LOCKED', or 'NONE'.
 * @returns {HTMLElement} The container element.
 */
export function createBattlerNameLabel(battler, options = {}) {
    const container = document.createElement("div");
    container.className = "battler-name-label";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.whiteSpace = "nowrap";

    if (battler.elements) {
        Component_ElementIcon(container, { elements: battler.elements });
    }

    const levelSpan = document.createElement("span");
    levelSpan.textContent = `Lv.${battler.level}`;
    levelSpan.style.margin = "0 4px";
    levelSpan.style.fontSize = "10px";
    container.appendChild(levelSpan);

    const nameSpan = document.createElement("span");
    nameSpan.textContent = battler.name;
    container.appendChild(nameSpan);

    if (options.evolutionStatus && options.evolutionStatus !== 'NONE') {
        const iconId = options.evolutionStatus === 'AVAILABLE' ? 102 : 101;
        const tooltip = options.evolutionStatus === 'AVAILABLE' ? "Evolution Available" : "Evolution Locked";
        const evoIcon = Component_Icon(null, { iconId, tooltip });
        evoIcon.style.marginLeft = "4px";
        container.appendChild(evoIcon);
    }

    return container;
}

/**
 * Creates a generic gauge element.
 * @param {Object} options - Configuration options.
 */
export function createGauge(options = {}) {
    // Adapter to match existing return signature { container, fill }
    // Component_Gauge returns { container, fill } so it should match.
    return Component_Gauge(null, options);
}

/**
 * Creates an interactive label for a game object (Skill, Passive, Item).
 */
export function createInteractiveLabel(data, type, options = {}) {
    return Component_InteractiveLabel(null, { data, type, ...options });
}

/**
 * Draws standard battler gauges (HP, XP) for slot displays.
 * @param {import("../objects/objects.js").Game_Battler} battler
 */
export function drawBattlerStats(battler) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.flexGrow = "1";
    container.style.minWidth = "0"; // Enable flex shrinking

    // HP Text
    const hpText = document.createElement("div");
    hpText.textContent = `HP ${battler.hp}/${battler.maxHp}`;
    hpText.style.fontSize = "10px";
    hpText.style.marginBottom = "1px";
    container.appendChild(hpText);

    // HP Gauge
    const { fill: hpFill } = Component_Gauge(container, { height: "6px", color: "var(--gauge-hp)", className: "gauge" });
    hpFill.parentElement.style.marginBottom = "2px"; // Access container via parent
    hpFill.style.width = `${Math.max(0, (battler.hp / battler.maxHp) * 100)}%`;
    hpFill.classList.add('hp-fill');

    // XP Gauge
    const xpNeeded = ProgressionSystem.xpNeeded(battler.level, battler.expGrowth);
    const xpPercent = Math.min(100, Math.max(0, ((battler.xp || 0) / xpNeeded) * 100));
    const { fill: xpFill } = Component_Gauge(container, {
        height: "4px",
        color: "#60a0ff",
        bgColor: "#333"
    });
    xpFill.style.width = `${xpPercent}%`;

    return container;
}

/**
 * Creates a standard party member slot.
 */
export function createPartySlot(battler, index, options = {}) {
    const slot = document.createElement("div");
    slot.className = "party-slot";
    slot.style.width = "100%"; // Changed from fixed 124px to 100%
    slot.style.height = "116px";
    slot.style.display = "flex";
    slot.style.flexDirection = "column";
    slot.style.boxSizing = "border-box";

    if (options.className) slot.classList.add(options.className);
    slot.dataset.index = index;
    if (options.testId) slot.dataset.testid = options.testId;

    if (options.draggable) {
        slot.draggable = true;
        if (options.onDragStart) slot.addEventListener("dragstart", (e) => options.onDragStart(e, index));
        if (options.onDragOver) slot.addEventListener("dragover", options.onDragOver);
        if (options.onDrop) slot.addEventListener("drop", (e) => options.onDrop(e, index));
        if (options.onDragEnd) slot.addEventListener("dragend", options.onDragEnd);
    }

    if (options.onClick) {
        slot.addEventListener("click", (e) => options.onClick(battler, index, e));
    }

    if (!battler) {
        const emptyLabel = document.createElement("div");
        emptyLabel.textContent = "(Empty)";
        emptyLabel.style.textAlign = "center";
        emptyLabel.style.marginTop = "auto";
        emptyLabel.style.marginBottom = "auto";
        slot.appendChild(emptyLabel);
        return slot;
    }

    const header = document.createElement("div");
    header.className = "party-slot-header";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "2px";

    const nameEl = document.createElement("div");
    nameEl.className = "party-slot-name";
    nameEl.style.display = "flex";
    nameEl.style.alignItems = "center";
    nameEl.style.justifyContent = "flex-start";
    nameEl.style.flexGrow = "1";
    nameEl.style.overflow = "hidden";

    const label = createBattlerNameLabel(battler, { evolutionStatus: options.evolutionStatus });
    label.style.overflow = "hidden";
    nameEl.appendChild(label);

    const rowIndicator = document.createElement("div");
    let rowText = "";
    if (index <= 1) rowText = "Fr";
    else if (index <= 3) rowText = "Bk";
    rowIndicator.textContent = rowText;

    header.appendChild(nameEl);
    if (rowText) header.appendChild(rowIndicator);
    slot.appendChild(header);

    const body = document.createElement("div");
    body.className = "party-slot-body";
    body.style.display = "flex";
    body.style.flexGrow = "1";
    body.style.marginBottom = "2px";

    const portrait = document.createElement("div");
    portrait.className = "party-slot-portrait";
    portrait.style.backgroundImage = `url('assets/portraits/${battler.spriteKey || "pixie"}.png')`;
    portrait.style.width = "48px";
    portrait.style.height = "48px";
    portrait.style.flexShrink = "0";
    body.appendChild(portrait);

    const stats = drawBattlerStats(battler);
    stats.style.marginLeft = "4px";
    body.appendChild(stats);
    slot.appendChild(body);

    const footer = document.createElement("div");
    footer.className = "party-slot-footer";
    footer.style.fontSize = "10px";
    footer.style.display = "flex";
    footer.style.alignItems = "center";

    if (battler.equipmentItem) {
        const itemLabel = Component_InteractiveLabel(null, { data: battler.equipmentItem, type: 'item' });
        footer.appendChild(itemLabel);
    } else {
        const none = document.createElement("span");
        none.textContent = "-";
        footer.appendChild(none);
    }
    slot.appendChild(footer);

    return slot;
}

/**
 * Creates a compact slot for reserve members.
 */
export function createReserveSlot(battler, index, options = {}) {
    const slot = document.createElement("div");
    slot.className = "party-slot";
    slot.style.width = "100%";
    slot.style.height = "54px"; // 48px + padding/border
    slot.style.display = "flex";
    slot.style.boxSizing = "border-box";
    slot.style.padding = "2px";
    slot.style.alignItems = "center";

    if (options.className) slot.classList.add(options.className);
    slot.dataset.index = index;
    if (options.testId) slot.dataset.testid = options.testId;

    if (options.onClick) {
        slot.addEventListener("click", (e) => options.onClick(battler, index, e));
    }

    if (!battler) {
        const empty = document.createElement("div");
        empty.textContent = "(Empty)";
        empty.style.margin = "auto";
        slot.appendChild(empty);
        return slot;
    }

    // Portrait
    const portrait = document.createElement("div");
    portrait.className = "party-slot-portrait";
    portrait.style.backgroundImage = `url('assets/portraits/${battler.spriteKey || "pixie"}.png')`;
    portrait.style.width = "48px";
    portrait.style.height = "48px";
    portrait.style.flexShrink = "0";
    slot.appendChild(portrait);

    // Info
    const info = document.createElement("div");
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.marginLeft = "6px";
    info.style.justifyContent = "center";
    info.style.overflow = "hidden";
    info.style.flexGrow = "1";
    info.style.whiteSpace = "nowrap";

    // Label
    const label = createBattlerNameLabel(battler, { evolutionStatus: options.evolutionStatus });
    label.style.overflow = "hidden";
    label.style.textOverflow = "ellipsis";
    label.style.marginBottom = "2px";
    info.appendChild(label);

    // Gauges
    const gauges = drawBattlerStats(battler);
    info.appendChild(gauges);

    slot.appendChild(info);

    return slot;
}

/**
 * Helper to render creature info.
 * @param {HTMLElement} container - Target container.
 * @param {import("../objects/objects.js").Game_Battler} battler - The creature.
 * @param {Object} [options] - Options for what to display.
 * @param {boolean} [options.showSkills=false]
 * @param {boolean} [options.showPassives=false]
 * @param {boolean} [options.showEquipment=false]
 * @param {boolean} [options.showFlavor=false]
 * @param {boolean} [options.showElement=false]
 * @param {import("../managers/index.js").DataManager} [options.dataManager] - Required for skills/passives.
 */
export function renderCreatureInfo(container, battler, options = {}) {
    container.innerHTML = "";
    const layout = document.createElement('div');
    layout.className = 'inspect-layout';
    container.appendChild(layout);

    const sprite = document.createElement('div');
    sprite.className = 'inspect-sprite';
    sprite.style.backgroundImage = `url('assets/portraits/${battler.spriteKey || "pixie"}.png')`;
    layout.appendChild(sprite);

    const fields = document.createElement('div');
    fields.className = 'inspect-fields';
    layout.appendChild(fields);

    const createRow = (label, valueEl) => {
        const row = document.createElement('div');
        row.className = 'inspect-row';
        const lbl = document.createElement('span');
        lbl.className = 'inspect-label';
        lbl.textContent = label;
        row.appendChild(lbl);
        valueEl.classList.add('inspect-value');
        row.appendChild(valueEl);
        fields.appendChild(row);
    };

    const nameVal = document.createElement('span');
    nameVal.appendChild(createBattlerNameLabel(battler));
    createRow('Name', nameVal);

    const levelVal = document.createElement('span');
    levelVal.textContent = battler.level;
    createRow('Level', levelVal);

    if (battler.role) {
        const roleVal = document.createElement('span');
        roleVal.textContent = battler.role;
        createRow('Role', roleVal);
    }

    const hpVal = document.createElement('span');
    if (battler.hp !== undefined) {
         hpVal.textContent = `${battler.hp} / ${battler.maxHp}`;
    } else {
         hpVal.textContent = `${battler.maxHp}`;
    }
    createRow('HP', hpVal);

    if (options.showElement) {
        const elementVal = document.createElement('span');
        if (battler.elements && battler.elements.length > 0) {
            Component_ElementIcon(elementVal, { elements: battler.elements });
        } else {
            elementVal.textContent = "—";
        }
        createRow('Element', elementVal);
    }

    if (options.showEquipment) {
        const equipVal = document.createElement('span');
        equipVal.textContent = battler.equipment || (battler.equipmentItem ? battler.equipmentItem.name : "—");
        createRow('Equipment', equipVal);
    }

    if (options.showPassives) {
        const passiveVal = document.createElement('span');
        if (battler.passives && battler.passives.length > 0) {
            battler.passives.forEach((pData, i) => {
                let def = pData;
                if (options.dataManager && options.dataManager.passives) {
                     const code = pData.code || pData.id;
                     const found = Object.values(options.dataManager.passives).find(p => p.id === code || p.code === code);
                     if (found) def = found;
                }
                const el = Component_InteractiveLabel(null, { data: def, type: 'passive' });
                passiveVal.appendChild(el);
                if (i < battler.passives.length - 1) passiveVal.appendChild(document.createTextNode(", "));
            });
        } else {
            passiveVal.textContent = "—";
        }
        createRow('Passive', passiveVal);
    }

    if (options.showSkills) {
        const skillVal = document.createElement('span');
        if (battler.skills && battler.skills.length > 0) {
            battler.skills.forEach((sId, i) => {
                let skill = null;
                if (options.dataManager) {
                     skill = options.dataManager.skills[sId];
                }
                if (skill) {
                    const el = Component_InteractiveLabel(null, { data: skill, type: 'skill' });
                    skillVal.appendChild(el);
                } else {
                    skillVal.appendChild(document.createTextNode(sId));
                }
                if (i < battler.skills.length - 1) {
                    skillVal.appendChild(document.createTextNode(", "));
                }
            });
        } else {
            skillVal.textContent = "—";
        }
        createRow('Skills', skillVal);
    }

    if (options.showFlavor) {
        const flavorVal = document.createElement('span');
        flavorVal.textContent = battler.flavor || "—";
        createRow('Flavor', flavorVal);
    }
}

/**
 * Creates a toggle switch element.
 * @param {string} labelText - Text label for the toggle.
 * @param {boolean} initialValue - Initial state.
 * @param {Function} onChange - Callback when changed (receives new boolean value).
 * @returns {HTMLElement} The container element with label and switch.
 */
export function createToggleSwitch(labelText, initialValue, onChange) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "6px";

    const label = document.createElement("span");
    label.textContent = labelText;
    container.appendChild(label);

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "toggle-switch";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!initialValue;
    checkbox.addEventListener("change", (e) => {
        if (onChange) onChange(e.target.checked);
    });
    toggleLabel.appendChild(checkbox);

    const slider = document.createElement("span");
    slider.className = "toggle-slider";
    toggleLabel.appendChild(slider);

    container.appendChild(toggleLabel);

    // Attach checkbox to container for external access if needed (e.g. testing)
    container.checkbox = checkbox;

    return container;
}
