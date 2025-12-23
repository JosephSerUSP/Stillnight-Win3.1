import { elementToIconId } from "../../core/utils.js";
import { Component_Icon, Component_ElementIcon, Component_Gauge, Component_InteractiveLabel } from "./components.js";

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
 * @param {Object} battlerView - The battler view model.
 * @param {Object} [options] - Configuration options.
 * @param {string} [options.evolutionStatus] - 'AVAILABLE', 'LOCKED', or 'NONE'.
 * @param {string} [options.nameElementId] - ID for the name span.
 * @returns {HTMLElement} The container element.
 */
export function createBattlerNameLabel(battlerView, options = {}) {
    const container = document.createElement("div");
    container.className = "battler-name-label";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.whiteSpace = "nowrap";

    if (battlerView.elements) {
        Component_ElementIcon(container, { elements: battlerView.elements });
    }

    const levelSpan = document.createElement("span");
    levelSpan.textContent = `Lv.${battlerView.level}`;
    levelSpan.style.margin = "0 4px";
    levelSpan.style.fontSize = "10px";
    container.appendChild(levelSpan);

    const nameSpan = document.createElement("span");
    nameSpan.textContent = battlerView.name;
    if (options.nameElementId) {
        nameSpan.id = options.nameElementId;
    }
    container.appendChild(nameSpan);

    // Prefer options.evolutionStatus if provided, otherwise check battlerView
    const evoStatus = options.evolutionStatus || battlerView.evolutionStatus;

    if (evoStatus && evoStatus !== 'NONE') {
        const iconId = evoStatus === 'AVAILABLE' ? 102 : 101;
        const tooltip = evoStatus === 'AVAILABLE' ? "Evolution Available" : "Evolution Locked";
        const evoIcon = Component_Icon(null, { iconId, tooltip });
        evoIcon.style.marginLeft = "4px";
        container.appendChild(evoIcon);
    }

    return container;
}

/**
 * Generates an ASCII-style gauge string.
 * @param {number} current
 * @param {number} max
 * @param {number} [length=15]
 * @param {string} [fillChar='#']
 * @returns {string} e.g. "[#####     ]"
 */
export function createAsciiGauge(current, max, length = 15, fillChar = '#') {
    const totalLength = length;
    let filledCount = Math.round((current / max) * totalLength);
    if (current > 0 && filledCount === 0) filledCount = 1;
    if (filledCount < 0) filledCount = 0;
    const emptyCount = totalLength - filledCount;
    if (emptyCount < 0) return `[${fillChar.repeat(totalLength)}]`;
    return `[${fillChar.repeat(filledCount)}${" ".repeat(emptyCount)}]`;
}

/**
 * Formats an ASCII HP gauge with the current HP value displayed beside it.
 * @param {number} current
 * @param {number} max
 * @param {number} length
 * @returns {string}
 */
export function formatHpGaugeText(current, max, length) {
    const gauge = createAsciiGauge(current, max, length);
    return `${gauge}・${current}`;
}

/**
 * Creates a standard battle unit display (Name + ASCII gauges).
 * @param {Object} battlerView
 * @param {Object} options
 * @param {string} [options.id] - Element ID.
 * @param {number} [options.top]
 * @param {number} [options.left]
 * @param {string} [options.width]
 * @param {string} [options.textAlign]
 * @param {boolean} [options.showMp=false]
 * @param {number} [options.gaugeLength=15]
 * @param {string} [options.evolutionStatus]
 * @param {string} [options.nameElementId] - ID for the name span (for animations).
 * @returns {HTMLElement}
 */
export function createBattleUnitSlot(battlerView, options = {}) {
    const container = document.createElement("div");
    container.className = "battler-container";
    if (options.id) container.id = options.id;

    container.style.position = "absolute";
    if (options.top !== undefined) container.style.top = `${options.top}px`;
    if (options.left !== undefined) container.style.left = `${options.left}px`;
    if (options.width) container.style.width = options.width;
    if (options.textAlign) container.style.textAlign = options.textAlign;

    // Style consistency
    container.style.whiteSpace = "pre";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    if (options.textAlign === 'center') {
        container.style.alignItems = 'center';
    }

    const gaugeLength = options.gaugeLength || 15;

    // Name
    const nameLabel = createBattlerNameLabel(battlerView, {
        nameElementId: options.nameElementId,
        evolutionStatus: options.evolutionStatus
    });

    const nameWrapper = document.createElement("div");
    nameWrapper.className = "battler-name";
    nameWrapper.appendChild(nameLabel);
    container.appendChild(nameWrapper);

    // HP Gauge
    const hpDiv = document.createElement("div");
    hpDiv.className = "battler-hp";
    hpDiv.textContent = formatHpGaugeText(battlerView.hp, battlerView.maxHp, gaugeLength);
    container.appendChild(hpDiv);

    // MP Gauge (Optional)
    if (options.showMp) {
        const mpDiv = document.createElement("div");
        mpDiv.className = "battler-mp";
        // Use * for MP to distinguish from HP
        mpDiv.textContent = createAsciiGauge(battlerView.mp, battlerView.maxMp, gaugeLength, '*');
        container.appendChild(mpDiv);
    }

    // Action Preview
    if (options.actionPreview) {
        const previewDiv = document.createElement("div");
        previewDiv.className = "action-preview-container";
        previewDiv.style.color = "#ffaa00";
        previewDiv.style.fontSize = "10px";
        previewDiv.style.whiteSpace = "nowrap";
        previewDiv.style.marginTop = "2px";

        const actionSpan = document.createElement("span");
        actionSpan.className = "action-name-arrow";
        actionSpan.dataset.actionName = options.actionPreview.actionName;
        actionSpan.textContent = `${options.actionPreview.actionName} --> `;
        previewDiv.appendChild(actionSpan);

        if (options.actionPreview.target) {
            // Use createBattlerNameLabel for the target if available
            const targetLabel = createBattlerNameLabel(options.actionPreview.target, { evolutionStatus: 'NONE' });
            targetLabel.style.display = "inline-flex";
            targetLabel.classList.add("action-preview-target");
            previewDiv.appendChild(targetLabel);
        } else {
            const unknownSpan = document.createElement("span");
            unknownSpan.textContent = "Unknown";
            previewDiv.appendChild(unknownSpan);
        }

        container.appendChild(previewDiv);
    }

    return container;
}

/**
 * Creates a generic gauge element.
 * @param {Object} options - Configuration options.
 */
export function createGauge(options = {}) {
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
 * @param {Object} battlerView - The battler view model. Must contain hp, maxHp, xpPercent.
 */
export function drawBattlerStats(battlerView) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.flexGrow = "1";
    container.style.minWidth = "0"; // Enable flex shrinking

    // HP Text
    const hpText = document.createElement("div");
    hpText.textContent = `HP ${battlerView.hp}/${battlerView.maxHp}`;
    hpText.style.fontSize = "10px";
    hpText.style.marginBottom = "1px";
    container.appendChild(hpText);

    // HP Gauge
    const { fill: hpFill } = Component_Gauge(container, { height: "6px", color: "var(--gauge-hp)", className: "gauge" });
    hpFill.parentElement.style.marginBottom = "2px"; // Access container via parent
    hpFill.style.width = `${Math.max(0, (battlerView.hp / battlerView.maxHp) * 100)}%`;
    hpFill.classList.add('hp-fill');

    // XP Gauge
    // xpPercent is expected to be calculated by selector.
    // Fallback to 0 if not provided (e.g. legacy calls)
    const xpPercent = battlerView.xpPercent !== undefined ? battlerView.xpPercent : 0;

    const { fill: xpFill } = Component_Gauge(container, {
        height: "4px",
        color: "#60a0ff",
        bgColor: "#333"
    });
    xpFill.style.width = `${xpPercent}%`;

    return container;
}

/**
 * Creates a Commander (Summoner) slot.
 * @param {Object} summonerView - View model for Summoner.
 * @param {Object} options
 */
export function createCommanderSlot(summonerView, options = {}) {
    const slot = document.createElement("div");
    slot.className = "party-slot commander-slot";
    slot.style.width = "100%";
    slot.style.height = "64px"; // Slightly taller to fit rows comfortably
    slot.style.display = "flex";
    slot.style.flexDirection = "row"; // Main axis is row
    slot.style.boxSizing = "border-box";
    slot.style.padding = "4px";
    slot.style.gap = "6px";

    if (options.onClick) {
        slot.style.cursor = "pointer";
        slot.addEventListener("click", (e) => options.onClick(e));
    }

    // Portrait (Left)
    const portrait = document.createElement("div");
    portrait.className = "party-slot-portrait";
    portrait.style.backgroundImage = `url('assets/portraits/${summonerView.spriteKey || "egg"}.png')`;
    portrait.style.width = "48px";
    portrait.style.height = "48px";
    portrait.style.flexShrink = "0";
    slot.appendChild(portrait);

    // Info Column (Right)
    const infoCol = document.createElement("div");
    infoCol.style.flexGrow = "1";
    infoCol.style.display = "flex";
    infoCol.style.flexDirection = "column";
    infoCol.style.justifyContent = "space-between";
    slot.appendChild(infoCol);

    // Row 1: Name (Left) + Equip (Right)
    const row1 = document.createElement("div");
    row1.style.display = "flex";
    row1.style.justifyContent = "space-between";
    row1.style.alignItems = "center";

    const nameLabel = createBattlerNameLabel(summonerView, { evolutionStatus: 'NONE' });
    row1.appendChild(nameLabel);

    const equipContainer = document.createElement("div");
    equipContainer.style.fontSize = "10px";
    equipContainer.style.color = "var(--text-muted)";

    if (summonerView.equipmentItem) {
        const itemLabel = Component_InteractiveLabel(null, { data: summonerView.equipmentItem, type: 'item' });
        // Override label style to fit small slot
        itemLabel.style.marginRight = "0";
        equipContainer.appendChild(itemLabel);
    } else {
        equipContainer.textContent = "-";
    }
    row1.appendChild(equipContainer);

    infoCol.appendChild(row1);

    // Row 2: HP and MP Gauges (Side by Side)
    const row2 = document.createElement("div");
    row2.style.display = "flex";
    row2.style.gap = "4px";
    row2.style.alignItems = "center";
    row2.style.fontSize = "9px";

    const createMiniGauge = (label, current, max, color) => {
         const wrapper = document.createElement("div");
         wrapper.style.display = "flex";
         wrapper.style.alignItems = "center";
         wrapper.style.flex = "1";

         const text = document.createElement("span");
         text.textContent = `${label} ${current}/${max}`;
         text.style.marginRight = "4px";
         text.style.whiteSpace = "nowrap";
         wrapper.appendChild(text);

         const gaugeBg = document.createElement("div");
         gaugeBg.style.flexGrow = "1";
         gaugeBg.style.height = "5px";
         gaugeBg.style.backgroundColor = "#333";
         gaugeBg.style.border = "1px solid #555";
         gaugeBg.style.position = "relative";

         const fill = document.createElement("div");
         fill.style.height = "100%";
         fill.style.backgroundColor = color;
         fill.style.width = `${Math.max(0, (current / max) * 100)}%`;
         fill.className = label === 'HP' ? 'hp-fill' : 'mp-fill';

         gaugeBg.appendChild(fill);
         wrapper.appendChild(gaugeBg);
         return wrapper;
    };

    row2.appendChild(createMiniGauge("HP", summonerView.hp, summonerView.maxHp, "var(--gauge-hp)"));
    row2.appendChild(createMiniGauge("MP", summonerView.mp, summonerView.maxMp, "#60a0ff"));

    infoCol.appendChild(row2);

    // Row 3: XP Gauge (Under both)
    const row3 = document.createElement("div");
    row3.style.display = "flex";
    row3.style.alignItems = "center";
    row3.style.height = "4px";

    const xpPercent = summonerView.xpPercent !== undefined ? summonerView.xpPercent : 0;

    const xpGaugeBg = document.createElement("div");
    xpGaugeBg.style.width = "100%";
    xpGaugeBg.style.height = "100%";
    xpGaugeBg.style.backgroundColor = "#333";

    const xpFill = document.createElement("div");
    xpFill.style.height = "100%";
    xpFill.style.backgroundColor = "#ffd700"; // Gold for XP
    xpFill.style.width = `${xpPercent}%`;

    xpGaugeBg.appendChild(xpFill);
    row3.appendChild(xpGaugeBg);

    infoCol.appendChild(row3);

    return slot;
}

/**
 * Creates a standard party member slot.
 * @param {Object} battlerView - View model.
 * @param {number} index
 * @param {Object} options
 */
export function createPartySlot(battlerView, index, options = {}) {
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
        // Pass source if available (for game logic), otherwise the view itself
        const source = battlerView && battlerView.source ? battlerView.source : battlerView;
        slot.addEventListener("click", (e) => options.onClick(source, index, e));
    }

    if (!battlerView) {
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

    // Use view's evolution status if option not explicit
    const label = createBattlerNameLabel(battlerView, { evolutionStatus: options.evolutionStatus });
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
    portrait.style.backgroundImage = `url('assets/portraits/${battlerView.spriteKey || "pixie"}.png')`;
    portrait.style.width = "48px";
    portrait.style.height = "48px";
    portrait.style.flexShrink = "0";
    body.appendChild(portrait);

    const stats = drawBattlerStats(battlerView);
    stats.style.marginLeft = "4px";
    body.appendChild(stats);
    slot.appendChild(body);

    const footer = document.createElement("div");
    footer.className = "party-slot-footer";
    footer.style.fontSize = "10px";
    footer.style.display = "flex";
    footer.style.alignItems = "center";

    if (battlerView.equipmentItem) {
        // equipmentItem is { name, description } in view model usually
        // But createInteractiveLabel expects data.
        // We might need a proper object or let interactive label handle view.
        // For now, assume it's view data. Interactive label might need real item for tooltip.
        // If battlerView.equipmentItem is a plain object with name/desc, component might fail if it expects ID or specific structure for advanced tooltip.
        // But let's try.
        const itemLabel = Component_InteractiveLabel(null, { data: battlerView.equipmentItem, type: 'item' });
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
export function createReserveSlot(battlerView, index, options = {}) {
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
        const source = battlerView && battlerView.source ? battlerView.source : battlerView;
        slot.addEventListener("click", (e) => options.onClick(source, index, e));
    }

    if (!battlerView) {
        const empty = document.createElement("div");
        empty.textContent = "(Empty)";
        empty.style.margin = "auto";
        slot.appendChild(empty);
        return slot;
    }

    // Portrait
    const portrait = document.createElement("div");
    portrait.className = "party-slot-portrait";
    portrait.style.backgroundImage = `url('assets/portraits/${battlerView.spriteKey || "pixie"}.png')`;
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
    const label = createBattlerNameLabel(battlerView, { evolutionStatus: options.evolutionStatus });
    label.style.overflow = "hidden";
    label.style.textOverflow = "ellipsis";
    label.style.marginBottom = "2px";
    info.appendChild(label);

    // Gauges
    const gauges = drawBattlerStats(battlerView);
    info.appendChild(gauges);

    slot.appendChild(info);

    return slot;
}

/**
 * Helper to render creature info.
 * @param {HTMLElement} container - Target container.
 * @param {Object} battler - The creature (Can be View or Game Object, as long as props exist).
 * @param {Object} [options] - Options for what to display.
 */
/**
 * Sets the portrait on a target element, handling spritesheets vs single images.
 * @param {HTMLElement} element - The portrait container/element.
 * @param {string} spriteKey - The sprite key (e.g., 'NPC_Alicia', 'pixie').
 * @param {string} [emotion='neutral'] - Emotion for NPCs (neutral, approval, disapproval, laughter, shock).
 */
export function setPortrait(element, spriteKey, emotion = 'neutral') {
    if (!element) return;

    // Reset background
    element.style.backgroundImage = `url('assets/portraits/${spriteKey}.png')`;
    element.style.backgroundRepeat = 'no-repeat';

    // Determine type based on key convention
    const isNPC = spriteKey.startsWith('NPC_');

    if (isNPC) {
        // NPC Sheet: 5 Columns (640x192), each 128x192.
        const emotionMap = {
            'neutral': 0,
            'approval': 1,
            'disapproval': 2,
            'laughter': 3,
            'shock': 4
        };
        const colIndex = emotionMap[emotion] || 0;

        element.style.backgroundSize = 'auto';
        element.style.backgroundPosition = `-${colIndex * 128}px 0px`;
    } else {
        // Single Image: Use contain to ensure fit
        element.style.backgroundSize = 'contain';
        element.style.backgroundPosition = 'center';
    }
}

export function renderCreatureInfo(container, battler, options = {}) {
    container.innerHTML = "";
    const layout = document.createElement('div');
    layout.className = 'inspect-layout';
    container.appendChild(layout);

    const sprite = document.createElement('div');
    sprite.className = 'inspect-sprite';
    setPortrait(sprite, battler.spriteKey || "pixie");
    layout.appendChild(sprite);

    const fields = document.createElement('div');
    fields.className = 'inspect-fields';
    layout.appendChild(fields);

    const createRow = (label, valueEl) => {
        const row = document.createElement('div');
        row.className = 'inspect-row';
        const lbl = document.createElement('span');
        lbl.textContent = label;
        lbl.className = 'inspect-label';
        row.appendChild(lbl);
        valueEl.classList.add('inspect-value');
        row.appendChild(valueEl);
        fields.appendChild(row);
    };

    const nameVal = document.createElement('span');
    // createBattlerNameLabel expects a view model, but battler usually has compatible props
    // We might need to fake the view if it's a raw object
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
        if (battler.equipmentItem) {
             const label = Component_InteractiveLabel(null, { data: battler.equipmentItem, type: 'item' });
             equipVal.appendChild(label);
        } else {
             equipVal.textContent = battler.equipment || "—";
        }
        createRow('Equipment', equipVal);
    }

    if (options.showPassives) {
        const passiveVal = document.createElement('span');
        if (battler.passives && battler.passives.length > 0) {
            battler.passives.forEach((pData, i) => {
                let def = pData;
                if (options.dataManager && options.dataManager.passives) {
                     let code = pData.code || pData.id;
                     if (typeof pData === 'string') code = pData;
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
