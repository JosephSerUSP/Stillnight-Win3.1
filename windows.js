import { getPrimaryElements, Graphics, elementToAscii, getIconStyle, elementToIconId } from "./core.js";
import { tooltip } from "./tooltip.js";
import { SoundManager } from "./managers.js";

/**
 * Creates a DOM element representing an icon for a set of elements.
 * @param {string[]} elements - The elements.
 * @returns {HTMLElement} The icon container element.
 */
export function createElementIcon(elements) {
    const primaryElements = getPrimaryElements(elements);
    const container = document.createElement('div');

    if (primaryElements.length <= 1) {
        container.className = 'element-icon-container-name';
        const icon = document.createElement('div');
        icon.className = 'icon';
        if (primaryElements.length === 1) {
            const iconId = elementToIconId(primaryElements[0]);
            if (iconId > 0) {
                icon.style.backgroundPosition = getIconStyle(iconId);
            }
        }
        container.appendChild(icon);
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
                const icon = document.createElement('div');
                icon.className = 'element-icon';
                const iconId = elementToIconId('l_' + element);
                if (iconId > 0) {
                    icon.style.backgroundPosition = getIconStyle(iconId);
                    icon.style.top = positions[index].top;
                    icon.style.left = positions[index].left;
                    container.appendChild(icon);
                }
            }
        });
    }
    return container;
}

/**
 * Creates a large party slot DOM element (HUD style).
 * @param {import("./objects.js").Game_Battler} member - The party member.
 * @param {number} index - The index of the member.
 * @returns {HTMLElement} The slot element.
 */
export function createPartySlot(member, index) {
    const slot = document.createElement("div");
    slot.className = "party-slot";
    slot.dataset.index = index;
    slot.dataset.testid = `party-slot-${index}`;

    if (!member) {
        slot.classList.add("empty");
        slot.textContent = "(Empty)";
        return slot;
    }

    const portrait = document.createElement("div");
    portrait.className = "party-slot-portrait";
    portrait.style.backgroundImage = `url('assets/portraits/${member.spriteKey || "pixie"}.png')`;

    const info = document.createElement("div");
    info.className = "party-slot-info";

    const nameEl = document.createElement("div");
    nameEl.className = "party-slot-name";
    if (member.elements) {
        const elementIcon = createElementIcon(member.elements);
        nameEl.appendChild(elementIcon);
    }
    const nameSpan = document.createElement('span');
    nameSpan.textContent = member.name;
    nameEl.appendChild(nameSpan);

    const hpLabel = document.createElement("div");
    const row = index !== undefined ? (index <= 1 ? "Front" : "Back") : "";
    hpLabel.textContent = `Lv${member.level} ${row ? `(${row})` : ""} HP ${member.hp}/${member.maxHp}`;

    const hpBar = document.createElement("div");
    hpBar.className = "hp-bar";
    const hpFill = document.createElement("div");
    hpFill.className = "hp-fill";
    hpFill.style.width = `${Math.max(0, (member.hp / member.maxHp) * 100)}%`;
    hpBar.appendChild(hpFill);

    info.appendChild(nameEl);
    info.appendChild(hpLabel);
    info.appendChild(hpBar);

    slot.appendChild(portrait);
    slot.appendChild(info);

    return slot;
}

/**
 * Creates a compact party slot DOM element (List/Reserve style).
 * @param {import("./objects.js").Game_Battler} member - The party member.
 * @param {number} index - The index of the member.
 * @returns {HTMLElement} The slot element.
 */
export function createCompactPartySlot(member, index) {
    const slot = document.createElement("div");
    slot.className = "party-slot compact";
    slot.dataset.index = index;
    slot.style.height = "auto";
    slot.style.minHeight = "32px";

    if (!member) {
        slot.textContent = "(Empty)";
        return slot;
    }

    const icon = document.createElement("div");
    icon.className = "icon";
    icon.style.width = "24px";
    icon.style.height = "24px";
    icon.style.backgroundImage = `url('assets/portraits/${member.spriteKey || "pixie"}.png')`;
    icon.style.backgroundSize = "cover";
    icon.style.marginRight = "6px";
    icon.style.border = "1px solid #808080";

    const info = document.createElement("div");
    info.style.flex = "1";
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.justifyContent = "center";

    const line1 = document.createElement("div");
    line1.style.fontWeight = "bold";
    line1.textContent = member.name;

    const line2 = document.createElement("div");
    line2.style.fontSize = "9px";
    line2.textContent = `Lv${member.level} HP ${member.hp}/${member.maxHp}`;

    info.appendChild(line1);
    info.appendChild(line2);

    slot.appendChild(icon);
    slot.appendChild(info);

    return slot;
}

/**
 * Creates an interactive label for a game object (Skill, Passive, Item).
 */
export function createInteractiveLabel(data, type, options = {}) {
    const el = document.createElement("span");
    el.className = "interactive-label";
    el.style.display = "inline-flex";
    el.style.alignItems = "center";
    el.style.marginRight = "5px";

    if (options.className) el.classList.add(options.className);

    let iconId = data.icon;
    if (!iconId && type === 'item') iconId = 6;

    if (type === 'skill' || (data.element || data.elements)) {
        let elements = data.elements || (data.element ? [data.element] : []);
        if (options.elements) elements = options.elements;

        if (elements.length > 0) {
            const iconEl = createElementIcon(elements);
            el.appendChild(iconEl);
        } else if (iconId) {
             const icon = document.createElement("span");
             icon.className = "icon";
             if (iconId > 0) icon.style.backgroundPosition = getIconStyle(iconId);
             icon.style.marginRight = "4px";
             el.appendChild(icon);
        }
    } else if (iconId) {
        const icon = document.createElement("span");
        icon.className = "icon";
        if (iconId > 0) icon.style.backgroundPosition = getIconStyle(iconId);
        icon.style.marginRight = "4px";
        el.appendChild(icon);
    }

    const nameSpan = document.createElement("span");
    nameSpan.textContent = data.name;
    if (type === 'skill' || type === 'passive') {
         nameSpan.style.textDecoration = "underline";
         nameSpan.style.textDecorationStyle = "dotted";
    }
    el.appendChild(nameSpan);

    if (options.showTooltip !== false) {
        let text = options.tooltipText || data.description || "";
        if (!options.tooltipText) {
             let extra = "";
             if (type === 'passive' && data.effect) extra = data.effect;
             if (extra) text += `<br/><span style="color:#478174; font-size: 0.9em;">${extra}</span>`;
        }

        if (text) {
             el.style.cursor = "help";
             el.addEventListener("mouseenter", (e) => tooltip.show(e.clientX, e.clientY, null, text));
            el.addEventListener("mouseleave", () => tooltip.hide());
            el.addEventListener("mousemove", (e) => {
                if (tooltip.visible) tooltip.show(e.clientX, e.clientY, null, text);
            });
        }
    }
    return el;
}

/**
 * @class WindowLayer
 */
export class WindowLayer {
  constructor() {
    this.element = document.createElement("div");
    this.element.id = "window-layer";
  }
  addChild(window) {
    this.element.appendChild(window.overlay);
  }
  appendTo(parent) {
    parent.appendChild(this.element);
  }
}

/**
 * @class WindowManager
 */
export class WindowManager {
  constructor() {
    this.stack = [];
  }
  push(window) {
    const index = this.stack.indexOf(window);
    if (index > -1) this.stack.splice(index, 1);
    this.stack.push(window);
    window.open();
    this.updateState();
  }
  pop() {
    if (this.stack.length === 0) return null;
    const window = this.stack.pop();
    window.close();
    this.updateState();
    return window;
  }
  close(window) {
    const index = this.stack.indexOf(window);
    if (index === -1) return;
    if (index === this.stack.length - 1) {
      this.pop();
    } else {
      this.stack.splice(index, 1);
      window.close();
      this.updateState();
    }
  }
  handleInput(e) {
      if (this.stack.length === 0) return false;
      const topWindow = this.stack[this.stack.length - 1];
      if (e.key === "Escape") {
          topWindow.onEscape();
          return true;
      }
      return false;
  }
  updateState() {
    this.stack.forEach((win, index) => {
      const isTop = index === this.stack.length - 1;
      win.element.style.zIndex = 10 + index * 10;
      win.overlay.style.zIndex = 10 + index * 10;
      if (isTop) {
        win.overlay.classList.remove("window--dimmed");
      } else {
        win.overlay.classList.add("window--dimmed");
      }
    });
  }
}

/**
 * @class Window_Base
 */
export class Window_Base {
    constructor(x, y, width, height) {
        this.overlay = document.createElement("div");
        this.overlay.className = "modal-overlay";
        this.element = document.createElement("div");
        this.element.className = "dialog";
        this.element.style.position = "absolute";

        const finalX = x === 'center' ? (Graphics.width - width) / 2 : x;
        const finalY = y === 'center' ? (Graphics.height - height) / 2 : y;

        this.element.style.left = `${finalX}px`;
        this.element.style.top = `${finalY}px`;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        this.element.style.zIndex = "10";

        this.overlay.appendChild(this.element);
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
    open() {
        this.overlay.classList.add("active");
    }
    close() {
        this.overlay.classList.remove("active");
    }
    onEscape() {
        this.onUserClose();
    }
    onUserClose() {
        this.close();
    }
    refresh() {}
}

/**
 * @class Window_ItemList
 */
export class Window_ItemList extends Window_Base {
    constructor(title, width = 400, height = 300) {
        super('center', 'center', width, height);
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';

        const titleBar = document.createElement("div");
        titleBar.className = "dialog-titlebar";
        this.element.appendChild(titleBar);
        this.makeDraggable(titleBar);

        const titleText = document.createElement("span");
        titleText.textContent = title;
        titleBar.appendChild(titleText);

        this.btnClose = document.createElement("button");
        this.btnClose.className = "win-btn";
        this.btnClose.textContent = "X";
        this.btnClose.onclick = () => this.onUserClose();
        titleBar.appendChild(this.btnClose);

        const content = document.createElement("div");
        content.className = "dialog-content";
        content.style.flexGrow = "1";
        content.style.overflowY = "auto";
        this.element.appendChild(content);

        this.tabNav = document.createElement("div");
        this.tabNav.className = "tab-nav";
        content.appendChild(this.tabNav);

        this.listEl = document.createElement("div");
        content.appendChild(this.listEl);

        this.emptyMsgEl = document.createElement("p");
        this.emptyMsgEl.textContent = "No items.";
        this.emptyMsgEl.style.textAlign = "center";
        this.emptyMsgEl.style.display = "none";
        content.appendChild(this.emptyMsgEl);

        const buttons = document.createElement("div");
        buttons.className = "dialog-buttons";
        this.element.appendChild(buttons);

        this.btnClose2 = document.createElement("button");
        this.btnClose2.className = "win-btn";
        this.btnClose2.textContent = "Close";
        this.btnClose2.onclick = () => this.onUserClose();
        buttons.appendChild(this.btnClose2);

        this.tabs = [];
        this.currentTab = null;
    }

    addTab(id, label) {
        const btn = document.createElement("button");
        btn.className = "tab-btn";
        btn.textContent = label;
        btn.onclick = () => this.switchTab(id);
        this.tabNav.appendChild(btn);
        this.tabs.push({ id, btn });
        if (!this.currentTab) {
            this.switchTab(id);
        }
    }

    switchTab(id) {
        this.currentTab = id;
        this.tabs.forEach(t => {
            t.btn.classList.toggle('active', t.id === id);
        });
        this.refreshList();
    }

    refreshList() {}
}

/**
 * @class Window_Inventory
 */
export class Window_Inventory extends Window_ItemList {
    constructor() {
        super("Inventory", 400, 320);
        this.element.id = "inventory-window";
        this.addTab('consumable', 'Consumables');
        this.addTab('equipment', 'Equipment');
        this.party = null;
        this.onRequestSelectTarget = null;
        this.onDiscard = null;
    }

    refresh(party, onRequestSelectTarget, onDiscard) {
        this.party = party;
        this.onRequestSelectTarget = onRequestSelectTarget;
        this.onDiscard = onDiscard;
        this.refreshList();
    }

    refreshList() {
        if (!this.party) return;
        this.listEl.innerHTML = "";

        let inventory = this.party.inventory;
        if (this.currentTab === 'consumable') {
            inventory = inventory.filter(i => i.type !== 'equipment');
        } else {
            inventory = inventory.filter(i => i.type === 'equipment');
        }

        if (inventory.length === 0) {
            this.emptyMsgEl.style.display = "block";
            this.emptyMsgEl.textContent = this.currentTab === 'consumable' ? "No consumables." : "No equipment.";
        } else {
            this.emptyMsgEl.style.display = "none";
            inventory.forEach((item) => {
                const row = document.createElement("div");
                row.className = "shop-row";

                let tooltipText = item.description;
                let effectsText = "";
                const effects = [];
                if (item.effects) {
                     if (item.effects.hp) effects.push(`Restores ${item.effects.hp} HP`);
                     if (item.effects.maxHp) effects.push(`Max HP +${item.effects.maxHp}`);
                     if (item.effects.xp) effects.push(`Grants ${item.effects.xp} XP`);
                }
                if (item.traits) {
                     item.traits.forEach(t => {
                         if (t.code === 'PARAM_PLUS') {
                             if (t.dataId === 'atk') effects.push(`Damage +${t.value}`);
                             if (t.dataId === 'maxHp') effects.push(`Max HP +${t.value}`);
                         }
                     });
                }
                if (item.damageBonus) effects.push(`Damage +${item.damageBonus}`);
                if (effects.length > 0) effectsText = effects.join(", ");
                if (effectsText) tooltipText += `<br/><span style="color:#478174; font-size: 0.9em;">${effectsText}</span>`;

                const label = createInteractiveLabel(item, 'item', { tooltipText });
                label.style.flexGrow = "1";
                row.appendChild(label);

                const btns = document.createElement("div");
                const useBtn = document.createElement("button");
                useBtn.className = "win-btn";
                useBtn.textContent = this.currentTab === 'equipment' ? "Equip" : "Use";
                useBtn.addEventListener("click", () => {
                    const mode = this.currentTab === 'equipment' ? 'equip' : 'use';
                    if (this.onRequestSelectTarget) this.onRequestSelectTarget(item, mode);
                });
                const discardBtn = document.createElement("button");
                discardBtn.className = "win-btn";
                discardBtn.textContent = "Discard";
                discardBtn.addEventListener("click", () => {
                    if (this.onDiscard) this.onDiscard(item);
                });
                btns.appendChild(useBtn);
                btns.appendChild(discardBtn);

                row.appendChild(btns);
                this.listEl.appendChild(row);
            });
        }
    }
}

/**
 * @class Window_EquipItemSelect
 */
export class Window_EquipItemSelect extends Window_ItemList {
    constructor() {
        super("Equip Item", 420, 350);
        this.element.id = "equip-select-window";
        const slots = ["Weapon", "Gun", "Armor", "Head", "Arms", "Legs", "Accessory"];
        slots.forEach(slot => this.addTab(slot, slot));
        this.party = null;
        this.member = null;
        this.onSelect = null;
    }

    setup(slotName, party, member, onSelect) {
        this.party = party;
        this.member = member;
        this.onSelect = onSelect;
        this.switchTab(slotName);
    }

    refreshList() {
        if (!this.party || !this.member) return;
        this.listEl.innerHTML = "";

        const inventoryItems = this.party.inventory.filter(
            (i) => i.type === "equipment" && i.equipType === this.currentTab
        );
        const otherMemberItems = this.party.members
            .filter((m) => m !== this.member && m.equipmentItem && m.equipmentItem.equipType === this.currentTab)
            .map((m) => ({
                ...m.equipmentItem,
                equippedBy: m.name,
                equippedMember: m,
            }));

        const allEquipable = [...inventoryItems, ...otherMemberItems];

        if (allEquipable.length === 0) {
            this.emptyMsgEl.style.display = "block";
            this.emptyMsgEl.textContent = `No ${this.currentTab} available.`;
        } else {
            this.emptyMsgEl.style.display = "none";
            allEquipable.forEach((item) => {
                const row = document.createElement("div");
                row.className = "shop-row";
                const label = createInteractiveLabel(item, 'item');
                row.appendChild(label);

                const extraSpan = document.createElement("span");
                let text = "";
                if (item.traits) {
                     const dmg = item.traits.find(t => t.code === 'PARAM_PLUS' && t.dataId === 'atk');
                     if (dmg) text += ` (+${dmg.value} DMG)`;
                } else if (item.damageBonus) {
                     text += ` (+${item.damageBonus} DMG)`;
                }
                if (item.equippedBy) text += ` (on ${item.equippedBy})`;
                extraSpan.textContent = text;
                extraSpan.style.flexGrow = "1";
                row.appendChild(extraSpan);

                const btn = document.createElement("button");
                btn.className = "win-btn";
                btn.textContent = item.equippedBy ? "Swap" : "Equip";
                btn.addEventListener("click", () => {
                    if (this.onSelect) this.onSelect(item);
                });
                row.appendChild(btn);
                this.listEl.appendChild(row);
            });
        }
    }
}

/**
 * @class Window_PartySelect
 */
export class Window_PartySelect extends Window_Base {
    constructor() {
        super('center', 'center', 550, 400);
        this.element.id = "party-select-window";
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';

        const titleBar = document.createElement("div");
        titleBar.className = "dialog-titlebar";
        this.element.appendChild(titleBar);
        this.makeDraggable(titleBar);

        this.titleEl = document.createElement("span");
        this.titleEl.textContent = "Select Target";
        titleBar.appendChild(this.titleEl);

        this.btnClose = document.createElement("button");
        this.btnClose.className = "win-btn";
        this.btnClose.textContent = "X";
        this.btnClose.onclick = () => this.onUserClose();
        titleBar.appendChild(this.btnClose);

        const content = document.createElement("div");
        content.className = "dialog-content";
        content.style.flexGrow = "1";
        content.style.overflowY = "auto";
        this.element.appendChild(content);

        const gridLabel = document.createElement('div');
        gridLabel.className = 'formation-label';
        gridLabel.textContent = 'Active Party';
        content.appendChild(gridLabel);

        this.gridEl = document.createElement('div');
        this.gridEl.className = 'party-grid';
        this.gridEl.style.flex = "0 0 auto";
        this.gridEl.style.marginBottom = "10px";
        content.appendChild(this.gridEl);

        const reserveLabel = document.createElement('div');
        reserveLabel.className = 'formation-label';
        reserveLabel.textContent = 'Reserves';
        content.appendChild(reserveLabel);

        this.reserveListEl = document.createElement('div');
        this.reserveListEl.style.display = 'flex';
        this.reserveListEl.style.flexDirection = 'column';
        this.reserveListEl.style.gap = '4px';
        content.appendChild(this.reserveListEl);

        this.onSelect = null;
    }

    show(title, party, onSelect) {
        this.titleEl.textContent = title;
        this.onSelect = onSelect;
        this.gridEl.innerHTML = "";
        this.reserveListEl.innerHTML = "";

        party.members.slice(0, 4).forEach((member, index) => {
             const slot = createPartySlot(member, index);
             slot.style.cursor = "pointer";
             slot.addEventListener("click", () => this.selectMember(member));
             this.gridEl.appendChild(slot);
        });

        party.members.slice(4).forEach((member, index) => {
             const slot = createCompactPartySlot(member, index + 4);
             slot.style.cursor = "pointer";
             slot.addEventListener("click", () => this.selectMember(member));
             this.reserveListEl.appendChild(slot);
        });
    }

    selectMember(member) {
        if (this.onSelect) this.onSelect(member);
        this.onUserClose();
    }
}

/**
 * @class Window_Battle
 */
export class Window_Battle extends Window_Base {
  constructor() {
    super('center', 'center', 528, 360);
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);
    const titleText = document.createElement("span");
    titleText.textContent = "Battle – Stillnight";
    titleBar.appendChild(titleText);
    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);
    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    this.element.appendChild(content);
    const terminal = document.createElement("div");
    terminal.className = "terminal";
    content.appendChild(terminal);
    this.viewportEl = document.createElement("div");
    this.viewportEl.className = "terminal-viewport";
    terminal.appendChild(this.viewportEl);
    this.logEl = document.createElement("div");
    this.logEl.className = "terminal-log";
    terminal.appendChild(this.logEl);
    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    content.appendChild(buttons);
    this.btnRound = document.createElement("button");
    this.btnRound.className = "win-btn";
    this.btnRound.textContent = "Resolve Round";
    buttons.appendChild(this.btnRound);
    this.btnFlee = document.createElement("button");
    this.btnFlee.className = "win-btn";
    this.btnFlee.textContent = "Flee";
    buttons.appendChild(this.btnFlee);
    this.btnVictory = document.createElement("button");
    this.btnVictory.className = "win-btn";
    this.btnVictory.textContent = "Claim Spoils";
    this.btnVictory.style.display = "none";
    buttons.appendChild(this.btnVictory);
  }
  onUserClose() {
      this.element.classList.add("shake");
      setTimeout(() => this.element.classList.remove("shake"), 500);
  }
  appendLog(msg) {
    const div = document.createElement("div");
    div.textContent = msg;
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
  logEnemyEmergence(enemies, terms) {
    this.logEl.textContent = "";
    this.appendLog(terms.enemies_emerge);
    enemies.forEach((e) => {
        const primaryElements = getPrimaryElements(e.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');
        this.appendLog(` - ${e.name} (${e.role}, ${elementAscii})`);
    });
  }
  refresh(battlers, party) {
    this.viewportEl.innerHTML = "";
    const header = document.createElement("div");
    header.textContent = "== BATTLE ==";
    header.style.textAlign = "center";
    header.style.padding = "5px 0";
    this.viewportEl.appendChild(header);
    battlers.forEach((e, idx) => {
        const top = 30 + (idx % 2) * 40;
        const left = 20 + Math.floor(idx / 2) * 220;
        const hp = e.hp;
        const primaryElements = getPrimaryElements(e.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');
        const nameStr = `<span id="battler-enemy-${idx}">${e.name}</span>`;
        const el = document.createElement("div");
        el.className = 'battler-container';
        el.style.position = "absolute";
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        el.style.whiteSpace = "pre";
        el.innerHTML = `<div class="battler-name">${elementAscii}${nameStr} (HP ${hp}/${e.maxHp})</div><div class="battler-hp">${this.createHpGauge(hp, e.maxHp)}</div>`;
        this.viewportEl.appendChild(el);
    });
    party.forEach((p, idx) => {
        const top = 140 + (idx % 2) * 40;
        const left = 20 + Math.floor(idx / 2) * 220;
        const hp = p.hp;
        const primaryElements = getPrimaryElements(p.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');
        const nameStr = `<span id="battler-party-${idx}">${p.name}</span>`;
        const el = document.createElement("div");
        el.className = 'battler-container';
        el.style.position = "absolute";
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        el.style.whiteSpace = "pre";
        el.innerHTML = `<div class="battler-name">${elementAscii}${nameStr} (HP ${hp}/${p.maxHp})</div><div class="battler-hp">${this.createHpGauge(hp, p.maxHp)}</div>`;
        this.viewportEl.appendChild(el);
    });
  }
  createHpGauge(hp, maxHp) {
    const totalLength = 15;
    let filledCount = Math.round((hp / maxHp) * totalLength);
    if (hp > 0 && filledCount === 0) filledCount = 1;
    if (filledCount < 0) filledCount = 0;
    const emptyCount = totalLength - filledCount;
    if (emptyCount < 0) return `[${"#".repeat(totalLength)}]`;
    return `[${"#".repeat(filledCount)}${" ".repeat(emptyCount)}]`;
  }
  getBattlerId(index, isEnemy) {
      return isEnemy ? `battler-enemy-${index}` : `battler-party-${index}`;
  }
  getBattlerElement(index, isEnemy) {
      return this.viewportEl.querySelector(`#${this.getBattlerId(index, isEnemy)}`);
  }
  getHpElement(index, isEnemy) {
      const el = this.getBattlerElement(index, isEnemy);
      if (!el) return null;
      const container = el.closest('.battler-container');
      if (!container) return null;
      return container.querySelector('.battler-hp');
  }
}

/**
 * @class Window_Inspect
 */
export class Window_Inspect extends Window_Base {
  constructor() {
    super('center', 'center', 480, 320);
    this.element.id = "inspect-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);
    const titleText = document.createElement("span");
    titleText.textContent = "Creature – Stillnight";
    titleBar.appendChild(titleText);
    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);
    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    this.element.appendChild(content);
    const inspectBody = document.createElement('div');
    inspectBody.className = 'inspect-body';
    content.appendChild(inspectBody);
    const layout = document.createElement('div');
    layout.className = 'inspect-layout';
    inspectBody.appendChild(layout);
    this.spriteEl = document.createElement('div');
    this.spriteEl.className = 'inspect-sprite';
    layout.appendChild(this.spriteEl);
    const fields = document.createElement('div');
    fields.className = 'inspect-fields';
    layout.appendChild(fields);
    this.nameEl = this._createField(fields, "Name");
    this.levelEl = this._createField(fields, "Level");
    this.rowPosEl = this._createField(fields, "Row");
    this.hpEl = this._createField(fields, "HP");
    this.xpEl = this._createField(fields, "XP");
    this.elementEl = this._createField(fields, "Element");
    this.equipEl = this._createField(fields, "Equipment", true);
    this.passiveEl = this._createField(fields, "Passive");
    this.skillsEl = this._createField(fields, "Skills");
    this.flavorEl = this._createField(fields, "Flavor");
    this.notesEl = document.createElement('div');
    this.notesEl.className = 'inspect-notes';
    inspectBody.appendChild(this.notesEl);
    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    this.element.appendChild(buttons);
    this.btnSacrifice = document.createElement("button");
    this.btnSacrifice.className = "win-btn";
    this.btnSacrifice.style.marginRight = "auto";
    this.btnSacrifice.textContent = "Sacrifice";
    this.btnSacrifice.style.display = "none";
    buttons.appendChild(this.btnSacrifice);
    this.btnEvolve = document.createElement("button");
    this.btnEvolve.className = "win-btn";
    this.btnEvolve.textContent = "Evolution";
    this.btnEvolve.style.display = "none";
    this.btnEvolve.style.marginRight = "8px";
    buttons.appendChild(this.btnEvolve);
    this.btnOk = document.createElement("button");
    this.btnOk.className = "win-btn";
    this.btnOk.textContent = "OK";
    buttons.appendChild(this.btnOk);
  }
  _createField(parent, label, isButton = false) {
    const row = document.createElement('div');
    row.className = 'inspect-row';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'inspect-label';
    labelSpan.textContent = label;
    row.appendChild(labelSpan);
    const valueEl = isButton ? document.createElement('button') : document.createElement('span');
    valueEl.className = isButton ? 'win-btn inspect-value' : 'inspect-value';
    row.appendChild(valueEl);
    parent.appendChild(row);
    return valueEl;
  }
}

/**
 * @class Window_Evolution
 */
export class Window_Evolution extends Window_Base {
  constructor() {
    super('center', 'center', 700, 400);
    this.element.id = "evolution-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);
    const titleText = document.createElement("span");
    titleText.textContent = "Evolution – Stillnight";
    titleBar.appendChild(titleText);
    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);
    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    this.element.appendChild(content);
    const body = document.createElement('div');
    body.className = 'evolution-body';
    body.style.display = 'flex';
    body.style.flexGrow = '1';
    body.style.justifyContent = 'space-between';
    body.style.alignItems = 'center';
    body.style.padding = '10px';
    content.appendChild(body);
    this.leftPane = document.createElement('div');
    this.leftPane.className = 'evolution-pane';
    this.leftPane.style.flex = '1';
    body.appendChild(this.leftPane);
    const arrow = document.createElement('div');
    arrow.textContent = "➔";
    arrow.className = "evolution-arrow";
    body.appendChild(arrow);
    this.rightPane = document.createElement('div');
    this.rightPane.className = 'evolution-pane';
    this.rightPane.style.flex = '1';
    body.appendChild(this.rightPane);
    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    this.element.appendChild(buttons);
    this.btnConfirm = document.createElement("button");
    this.btnConfirm.className = "win-btn";
    this.btnConfirm.textContent = "Confirm Evolution";
    buttons.appendChild(this.btnConfirm);
    this.btnReturn = document.createElement("button");
    this.btnReturn.className = "win-btn";
    this.btnReturn.textContent = "Return";
    this.btnReturn.onclick = () => this.onUserClose();
    buttons.appendChild(this.btnReturn);
  }
  setup(current, next) {
      this.renderPane(this.leftPane, current);
      this.renderPane(this.rightPane, next);
  }
  renderPane(container, battler) {
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
      if (battler.elements) {
          nameVal.appendChild(createElementIcon(battler.elements));
      }
      nameVal.appendChild(document.createTextNode(battler.name));
      createRow('Name', nameVal);
      const levelVal = document.createElement('span');
      levelVal.textContent = battler.level;
      createRow('Level', levelVal);
      const roleVal = document.createElement('span');
      roleVal.textContent = battler.role || "—";
      createRow('Role', roleVal);
      const hpVal = document.createElement('span');
      hpVal.textContent = `${battler.maxHp}`;
      createRow('Max HP', hpVal);
      const passiveVal = document.createElement('span');
      if (battler.passives && battler.passives.length > 0) {
          battler.passives.forEach((p, i) => {
              const el = createInteractiveLabel(p, 'passive');
              passiveVal.appendChild(el);
              if (i < battler.passives.length - 1) passiveVal.appendChild(document.createTextNode(", "));
          });
      } else {
          passiveVal.textContent = "—";
      }
      createRow('Passive', passiveVal);
  }
}

/**
 * @class Window_Shop
 */
export class Window_Shop extends Window_Base {
  constructor() {
    super('center', 'center', 420, 320);
    this.element.id = "shop-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);
    const titleText = document.createElement("span");
    titleText.textContent = "Shop – Stillnight";
    titleBar.appendChild(titleText);
    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);
    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    this.element.appendChild(content);
    const shopBody = document.createElement('div');
    shopBody.className = 'shop-body';
    content.appendChild(shopBody);
    const goldRow = document.createElement('div');
    goldRow.className = 'shop-row';
    goldRow.textContent = 'Current gold: ';
    this.goldLabelEl = document.createElement('span');
    this.goldLabelEl.className = 'shop-gold';
    goldRow.appendChild(this.goldLabelEl);
    shopBody.appendChild(goldRow);
    this.listContainer = document.createElement('div');
    shopBody.appendChild(this.listContainer);
    this.messageEl = document.createElement('div');
    this.messageEl.className = 'shop-row';
    this.messageEl.style.marginTop = '6px';
    this.messageEl.style.fontSize = '10px';
    shopBody.appendChild(this.messageEl);
    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    this.element.appendChild(buttons);
    this.btnLeave = document.createElement("button");
    this.btnLeave.className = "win-btn";
    this.btnLeave.textContent = "Leave";
    buttons.appendChild(this.btnLeave);
  }
  setup(gold, message, items, buyCallback) {
    this.goldLabelEl.textContent = `${gold}G`;
    this.messageEl.textContent = message;
    this.renderItems(items, buyCallback);
  }
  renderItems(items, buyCallback) {
    this.listContainer.innerHTML = "";
    items.forEach((tpl) => {
      const row = document.createElement("div");
      row.className = "shop-row";
      const label = createInteractiveLabel(tpl, 'item');
      row.appendChild(label);
      const costSpan = document.createElement("span");
      costSpan.textContent = ` (${tpl.cost}G)`;
      costSpan.style.marginRight = "auto";
      row.appendChild(costSpan);
      const btn = document.createElement("button");
      btn.className = "win-btn";
      btn.textContent = "Buy";
      btn.addEventListener("click", () => {
        buyCallback(tpl.id);
      });
      row.appendChild(btn);
      this.listContainer.appendChild(row);
    });
  }
}

/**
 * @class Window_Formation
 */
export class Window_Formation extends Window_Base {
  constructor() {
    super('center', 'center', 520, 360);
    this.element.id = "formation-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';

    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);

    const titleText = document.createElement("span");
    titleText.textContent = "Formation – Stillnight";
    titleBar.appendChild(titleText);

    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);

    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    this.element.appendChild(content);

    const formationBody = document.createElement('div');
    formationBody.className = 'formation-body';
    content.appendChild(formationBody);

    const label = document.createElement('div');
    label.className = 'formation-label';
    label.textContent = 'Drag and drop to rearrange. Active party is the first 4 members.';
    formationBody.appendChild(label);

    this.gridEl = document.createElement('div');
    this.gridEl.className = 'party-grid';
    this.gridEl.style.marginBottom = "10px";
    formationBody.appendChild(this.gridEl);

    const reserveLabel = document.createElement('div');
    reserveLabel.className = 'formation-label';
    reserveLabel.textContent = 'Reserve';
    formationBody.appendChild(reserveLabel);

    this.reserveGridEl = document.createElement('div');
    this.reserveGridEl.className = 'formation-reserve-grid';
    this.reserveGridEl.style.display = 'flex';
    this.reserveGridEl.style.flexDirection = 'column';
    this.reserveGridEl.style.gap = '4px';

    formationBody.appendChild(this.reserveGridEl);

    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    this.element.appendChild(buttons);

    this.btnOk = document.createElement("button");
    this.btnOk.className = "win-btn";
    this.btnOk.textContent = "OK";
    this.btnOk.onclick = () => this.onUserClose();
    buttons.appendChild(this.btnOk);

    this.btnCancel = document.createElement("button");
    this.btnCancel.className = "win-btn";
    this.btnCancel.textContent = "Cancel";
    this.btnCancel.onclick = () => this.onUserClose();
    buttons.appendChild(this.btnCancel);

    this.draggedIndex = null;
    this.party = null;
    this.onChange = null;
  }

  refresh(party, onChange) {
      this.party = party;
      if (onChange) this.onChange = onChange;
      this.renderFormationGrid();
  }

  renderFormationGrid() {
    this.gridEl.innerHTML = "";
    this.reserveGridEl.innerHTML = "";

    if (!this.party) return;

    this.party.members.forEach((m, index) => {
      let slot;
      if (index < 4) {
          slot = createPartySlot(m, index);
      } else {
          slot = createCompactPartySlot(m, index);
      }

      slot.draggable = true;
      slot.style.cursor = "move";

      slot.addEventListener("dragstart", this.onDragStart.bind(this));
      slot.addEventListener("dragover", this.onDragOver.bind(this));
      slot.addEventListener("drop", this.onDrop.bind(this));
      slot.addEventListener("dragend", this.onDragEnd.bind(this));

      if (index < 4) {
        this.gridEl.appendChild(slot);
      } else {
        this.reserveGridEl.appendChild(slot);
      }
    });

    for (let i = this.party.members.length; i < 4; i++) {
        const slot = createPartySlot(null, i);
        slot.draggable = true;
        slot.addEventListener("dragstart", this.onDragStart.bind(this));
        slot.addEventListener("dragover", this.onDragOver.bind(this));
        slot.addEventListener("drop", this.onDrop.bind(this));
        slot.addEventListener("dragend", this.onDragEnd.bind(this));
        this.gridEl.appendChild(slot);
    }
  }

  onDragStart(e) {
    const idx = parseInt(e.target.dataset.index, 10);
    this.draggedIndex = idx;
    e.target.classList.add("dragging");
  }

  onDragOver(e) {
    e.preventDefault();
    const target = e.target.closest(".party-slot");
    if (target) {
      target.classList.add("drag-over");
    }
  }

  onDrop(e) {
    e.preventDefault();
    const targetSlot = e.target.closest(".party-slot");
    if (!targetSlot) return;

    const targetIndex = parseInt(targetSlot.dataset.index, 10);
    if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;

    if (this.party.reorderMembers(this.draggedIndex, targetIndex)) {
        this.draggedIndex = null;
        this.renderFormationGrid();
        SoundManager.beep(500, 80);
        if (this.onChange) this.onChange();
    }
  }

  onDragEnd(e) {
    const allSlots = this.element.querySelectorAll(".party-slot");
    allSlots.forEach((s) => s.classList.remove("dragging", "drag-over"));
  }
}

/**
 * @class Window_Recruit
 */
export class Window_Recruit extends Window_Base {
  constructor() {
    super('center', 'center', 480, 320);
    this.element.id = "recruit-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);
    const titleText = document.createElement("span");
    titleText.textContent = "Recruit – Stillnight";
    titleBar.appendChild(titleText);
    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);
    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    this.element.appendChild(content);
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'inspect-body';
    content.appendChild(this.bodyEl);
    this.buttonsEl = document.createElement("div");
    this.buttonsEl.className = "dialog-buttons";
    this.element.appendChild(this.buttonsEl);
  }
}

/**
 * @class Window_Event
 */
export class Window_Event extends Window_Base {
  constructor() {
    super('center', 'center', 520, 'auto');
    this.element.id = "event-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.maxHeight = '90vh';
    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);
    this.titleEl = document.createElement("span");
    titleBar.appendChild(this.titleEl);
    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);
    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    this.element.appendChild(content);
    this.imageContainer = document.createElement("div");
    this.imageContainer.className = "event-image-container";
    this.imageContainer.style.textAlign = "center";
    this.imageContainer.style.marginBottom = "8px";
    this.imageContainer.style.backgroundColor = "#222";
    this.imageContainer.style.display = "none";
    this.imageEl = document.createElement("img");
    this.imageEl.style.maxWidth = "100%";
    this.imageEl.style.maxHeight = "208px";
    this.imageEl.style.border = "1px solid #478174";
    this.imageEl.style.imageRendering = "pixelated";
    this.imageEl.onerror = () => {
        if (this.imageEl.src.indexOf("default.png") === -1) {
             this.imageEl.src = `assets/eventArt/default.png`;
        }
    };
    this.imageContainer.appendChild(this.imageEl);
    content.appendChild(this.imageContainer);
    const eventBody = document.createElement('div');
    eventBody.className = 'event-body';
    eventBody.style.flexGrow = "1";
    eventBody.style.display = "flex";
    eventBody.style.flexDirection = "column";
    content.appendChild(eventBody);
    this.descriptionEl = document.createElement('div');
    this.descriptionEl.className = 'event-description';
    this.descriptionEl.style.marginBottom = "10px";
    eventBody.appendChild(this.descriptionEl);
    this.choicesEl = document.createElement('div');
    this.choicesEl.className = 'event-choices dialog-buttons';
    this.choicesEl.style.marginTop = "auto";
    eventBody.appendChild(this.choicesEl);
  }
  show(data) {
      this.titleEl.textContent = data.title || "Event";
      const imgName = data.image || "default.png";
      this.imageEl.src = `assets/eventArt/${imgName}`;
      this.imageContainer.style.display = "block";
      if (data.style === 'terminal') {
          this.descriptionEl.className = "event-description terminal-style";
          this.descriptionEl.style.fontFamily = "monospace";
          this.descriptionEl.style.backgroundColor = "#000";
          this.descriptionEl.style.color = "#ccc";
          this.descriptionEl.style.padding = "10px";
          this.descriptionEl.style.height = "150px";
          this.descriptionEl.style.overflowY = "auto";
          this.descriptionEl.style.whiteSpace = "pre-wrap";
          this.descriptionEl.style.border = "1px inset #444";
          this.descriptionEl.textContent = "";
          if (data.description) {
              if (Array.isArray(data.description)) {
                  data.description.forEach(line => this.appendLog(line));
              } else {
                  this.appendLog(data.description);
              }
          }
      } else {
          this.descriptionEl.className = "event-description";
          this.descriptionEl.style = "";
          this.descriptionEl.style.marginBottom = "10px";
          this.descriptionEl.innerHTML = "";
          if (data.description) {
              if (Array.isArray(data.description)) {
                  data.description.forEach(line => {
                      if (line instanceof Node) {
                          this.descriptionEl.appendChild(line);
                      } else {
                          const p = document.createElement("div");
                          p.textContent = line;
                          this.descriptionEl.appendChild(p);
                      }
                  });
              } else if (data.description instanceof Node) {
                  this.descriptionEl.appendChild(data.description);
              } else {
                  this.descriptionEl.textContent = data.description;
              }
          }
      }
      this.updateChoices(data.choices);
  }
  appendLog(msg) {
      const p = document.createElement('div');
      if (msg instanceof Node) {
          p.appendChild(msg);
      } else {
          p.textContent = msg;
      }
      this.descriptionEl.appendChild(p);
      this.descriptionEl.scrollTop = this.descriptionEl.scrollHeight;
  }
  updateImage(imageName) {
       this.imageEl.src = `assets/eventArt/${imageName}`;
  }
  updateChoices(choices) {
      this.choicesEl.innerHTML = "";
      if (choices) {
          choices.forEach(ch => {
              const btn = document.createElement("button");
              btn.className = "win-btn";
              btn.textContent = ch.label;
              btn.onclick = ch.onClick;
              this.choicesEl.appendChild(btn);
          });
      }
  }
}

/**
 * @class Window_Confirm
 */
export class Window_Confirm extends Window_Base {
  constructor() {
    super('center', 'center', 320, 'auto');
    this.element.id = "confirm-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.height = 'fit-content';
    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);
    this.titleEl = document.createElement("span");
    titleBar.appendChild(this.titleEl);
    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);
    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    this.element.appendChild(content);
    this.messageEl = document.createElement('div');
    this.messageEl.style.marginBottom = '8px';
    content.appendChild(this.messageEl);
    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    content.appendChild(buttons);
    this.btnOk = document.createElement("button");
    this.btnOk.className = "win-btn";
    this.btnOk.textContent = "OK";
    buttons.appendChild(this.btnOk);
    this.btnCancel = document.createElement("button");
    this.btnCancel.className = "win-btn";
    this.btnCancel.textContent = "Cancel";
    this.btnCancel.onclick = () => this.onUserClose();
    buttons.appendChild(this.btnCancel);
  }
}

/**
 * @class Window_HUD
 */
export class Window_HUD {
    constructor() {
        this.container = document.getElementById("game-container");
        this.createUI();
        this.getDomElements();
    }
    createUI() {
        this.container.innerHTML = `
      <div class="stack-nav panel">
        <h1>Stillnight Stack</h1>
        <div class="group-box">
          <legend>Run</legend>
          <div class="stack-nav-buttons">
            <button class="win-btn" id="btn-new-run">New Run</button>
            <button class="win-btn" id="btn-reveal-all">Reveal</button>
          </div>
          <div style="margin-top:4px;">
            <div>Card: <span id="card-index-label">1 / 1</span></div>
            <div>Floor depth: <span id="card-depth-label">1</span></div>
          </div>
        </div>
        <div class="group-box">
          <legend>Cards (Floors)</legend>
          <div class="card-list" id="card-list"></div>
        </div>
        <div class="group-box">
          <legend>Short Help</legend>
          <div class="info-box">
            • Each floor is a card.<br>
            • ☺ is your party (highlighted).<br>
            • Click adjacent tiles to move.<br>
            • E triggers a battle.<br>
            • R heals, S descends.<br>
            • ¥ opens a shop.<br>
            • Front row hits harder,<br>
            &nbsp;&nbsp;back row is safer.<br>
            • Floors are reachable only<br>
            &nbsp;&nbsp;if you've reached their<br>
            &nbsp;&nbsp;stairs at least once.<br>
            • Shrines may offer<br>
            &nbsp;&nbsp;mysterious events.<br>
            • Boss awaits at the deepest floor.
          </div>
        </div>
      </div>
      <div class="right-side">
        <div class="card-area">
          <div class="card-main panel">
            <div class="card-header">
              <div>
                <span class="card-header-title" id="card-title">Floor 1</span>
              </div>
              <div>
                <span class="label">Mode:</span>
                <span id="mode-label">Exploration</span>
              </div>
            </div>
            <div class="exploration-frame panel">
              <div class="exploration-grid" id="exploration-grid"></div>
              <div class="legend">
                <span>☺ = Party</span>
                <span>█ = Wall</span>
                <span>E = Enemy</span>
                <span>R = Recovery</span>
                <span>S = Stairs</span>
                <span>♱ = Shrine</span>
                <span>¥ = Shop</span>
                <span>? = Unseen</span>
                <span>U = Recruit</span>
              </div>
            </div>
          </div>
          <div class="card-side-panels">
            <div class="party-panel panel">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>Party Status (click to inspect)</span>
                <button class="win-btn" style="font-size:10px; padding:0 6px;" id="btn-formation">
                  Formation...
                </button>
                <button class="win-btn" style="font-size:10px; padding:0 6px;" id="btn-inventory">
                  Inventory...
                </button>
              </div>
              <div class="party-grid" id="party-grid"></div>
            </div>
            <div class="log-panel panel">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>Event Log</span>
                <button class="win-btn" style="font-size:10px; padding:0 6px;" id="btn-clear-log">
                  Clear
                </button>
              </div>
              <div class="log-content" id="log-content"></div>
            </div>
          </div>
        </div>
        <div class="status-bar">
          <div>
            <span id="status-message">Ready.</span>
          </div>
          <div>
            <span>Gold: <span id="status-gold">0</span></span>
            <span>| Floor: <span id="status-floor">1</span></span>
            <span>| Cards: <span id="status-cards">1</span></span>
            <span>| Run: <span id="status-run">Active</span></span>
            <span>| Items: <span id="status-items">0</span></span>
          </div>
        </div>
      </div>
    `;
    }
    getDomElements() {
        this.explorationGridEl = document.getElementById("exploration-grid");
        this.cardTitleEl = document.getElementById("card-title");
        this.cardIndexLabelEl = document.getElementById("card-index-label");
        this.cardDepthLabelEl = document.getElementById("card-depth-label");
        this.cardListEl = document.getElementById("card-list");
        this.partyGridEl = document.getElementById("party-grid");
        this.logEl = document.getElementById("log-content");
        this.statusMessageEl = document.getElementById("status-message");
        this.statusGoldEl = document.getElementById("status-gold");
        this.statusFloorEl = document.getElementById("status-floor");
        this.statusCardsEl = document.getElementById("status-cards");
        this.statusRunEl = document.getElementById("status-run");
        this.statusItemsEl = document.getElementById("status-items");
        this.modeLabelEl = document.getElementById("mode-label");
        this.btnNewRun = document.getElementById("btn-new-run");
        this.btnRevealAll = document.getElementById("btn-reveal-all");
        this.btnClearLog = document.getElementById("btn-clear-log");
        this.btnFormation = document.getElementById("btn-formation");
        this.btnInventory = document.getElementById("btn-inventory");
    }
    updateCardHeader(floor, index, total) {
        this.cardTitleEl.textContent = floor.title;
        this.cardIndexLabelEl.textContent = `${index + 1} / ${total}`;
        this.cardDepthLabelEl.textContent = floor.depth;
        this.statusFloorEl.textContent = floor.depth;
        this.statusCardsEl.textContent = total;
    }
    updateCardList(floors, currentIndex, maxReachedIndex, onSelect) {
        this.cardListEl.innerHTML = "";
        floors.forEach((f, idx) => {
            const item = document.createElement("div");
            let cls = "card-item";
            if (idx === currentIndex) cls += " selected";
            if (!f.discovered) cls += " disabled";
            item.className = cls;
            const title = f.discovered ? f.title : "Unknown Floor";
            item.textContent = `${idx + 1}. ${title}`;
            if (f.discovered && idx <= maxReachedIndex) {
                item.addEventListener("click", () => onSelect(idx));
            }
            this.cardListEl.appendChild(item);
        });
    }
    updateParty(party, onInspect) {
        this.partyGridEl.innerHTML = "";
        party.members.slice(0, 4).forEach((member, index) => {
            const slot = createPartySlot(member, index);
            slot.addEventListener("click", () => onInspect(member, index));
            this.partyGridEl.appendChild(slot);
            const hpFill = slot.querySelector(".hp-fill");
            if (hpFill) {
                this.animateHpGauge(
                    hpFill,
                    member.prevHp || member.hp,
                    member.hp,
                    member.maxHp,
                    500
                );
            }
            member.prevHp = member.hp;
        });
        for (let i = party.members.length; i < 4; i++) {
             const slot = createPartySlot(null, i);
             this.partyGridEl.appendChild(slot);
        }
    }
    animateHpGauge(element, startHp, endHp, maxHp, duration) {
        const startTime = performance.now();
        const startWidth = (startHp / maxHp) * 100;
        const endWidth = (endHp / maxHp) * 100;
        const frame = (currentTime) => {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          const currentWidth = startWidth + (endWidth - startWidth) * progress;
          element.style.width = `${currentWidth}%`;
          if (progress < 1) {
            requestAnimationFrame(frame);
          }
        };
        requestAnimationFrame(frame);
    }
}

/**
 * Helper to render creature info (Sprite, Name, Level, HP, etc).
 */
export function renderCreatureInfo(container, battler, title) {
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
    if (battler.elements) {
        nameVal.appendChild(createElementIcon(battler.elements));
    }
    nameVal.appendChild(document.createTextNode(battler.name));
    createRow('Name', nameVal);
    const levelVal = document.createElement('span');
    levelVal.textContent = battler.level;
    createRow('Level', levelVal);
    const hpVal = document.createElement('span');
    hpVal.textContent = `${battler.hp} / ${battler.maxHp}`;
    createRow('HP', hpVal);
    if (battler.role) {
        const roleVal = document.createElement('span');
        roleVal.textContent = battler.role;
        createRow('Role', roleVal);
    }
}

/**
 * @class Window_EquipConfirm
 */
export class Window_EquipConfirm extends Window_Base {
    constructor() {
        super('center', 'center', 500, 420);
        this.element.id = "equip-confirm-window";
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        const titleBar = document.createElement("div");
        titleBar.className = "dialog-titlebar";
        this.element.appendChild(titleBar);
        this.makeDraggable(titleBar);
        const titleText = document.createElement("span");
        titleText.textContent = "Equip Item";
        titleBar.appendChild(titleText);
        this.btnClose = document.createElement("button");
        this.btnClose.className = "win-btn";
        this.btnClose.textContent = "X";
        this.btnClose.onclick = () => this.onUserClose();
        titleBar.appendChild(this.btnClose);
        const content = document.createElement("div");
        content.className = "dialog-content";
        content.style.flexGrow = "1";
        this.element.appendChild(content);
        this.infoPanel = document.createElement("div");
        this.infoPanel.className = "inspect-body";
        this.infoPanel.style.marginBottom = "8px";
        content.appendChild(this.infoPanel);
        this.changePanel = document.createElement("div");
        this.changePanel.className = "group-box";
        this.changePanel.style.padding = "10px";
        content.appendChild(this.changePanel);
        const leg = document.createElement("legend");
        leg.textContent = "Changes";
        this.changePanel.appendChild(leg);
        this.slotChangeEl = document.createElement("div");
        this.slotChangeEl.style.marginBottom = "8px";
        this.slotChangeEl.style.fontWeight = "bold";
        this.slotChangeEl.style.display = "flex";
        this.slotChangeEl.style.alignItems = "center";
        this.changePanel.appendChild(this.slotChangeEl);
        this.traitListEl = document.createElement("div");
        this.traitListEl.style.fontSize = "10px";
        this.traitListEl.style.whiteSpace = "pre-wrap";
        this.changePanel.appendChild(this.traitListEl);
        const buttons = document.createElement("div");
        buttons.className = "dialog-buttons";
        this.element.appendChild(buttons);
        this.btnConfirm = document.createElement("button");
        this.btnConfirm.className = "win-btn";
        this.btnConfirm.textContent = "Confirm";
        buttons.appendChild(this.btnConfirm);
        this.btnCancel = document.createElement("button");
        this.btnCancel.className = "win-btn";
        this.btnCancel.textContent = "Cancel";
        this.btnCancel.onclick = () => this.onUserClose();
        buttons.appendChild(this.btnCancel);
    }
    setup(member, newItem, oldItem, slotName, onConfirm) {
        renderCreatureInfo(this.infoPanel, member);
        this.slotChangeEl.innerHTML = "";
        const arrow = document.createElement("span");
        arrow.textContent = " ➔ ";
        arrow.style.margin = "0 8px";
        const createItemSpan = (item) => {
             const span = document.createElement("span");
             span.style.display = "inline-flex";
             span.style.alignItems = "center";
             if (item) {
                 span.appendChild(createInteractiveLabel(item, 'item', { showTooltip: true }));
             } else {
                 span.textContent = "None";
                 span.style.color = "#808080";
             }
             return span;
        };
        const slotLabel = document.createElement("span");
        slotLabel.textContent = slotName + ": ";
        this.slotChangeEl.appendChild(slotLabel);
        this.slotChangeEl.appendChild(createItemSpan(oldItem));
        this.slotChangeEl.appendChild(arrow);
        this.slotChangeEl.appendChild(createItemSpan(newItem));
        this.traitListEl.innerHTML = "";
        const diffs = this.calculateDiff(member, newItem, oldItem);
        diffs.forEach(diff => {
            const div = document.createElement("div");
            div.textContent = diff;
            this.traitListEl.appendChild(div);
        });
        this.btnConfirm.onclick = onConfirm;
    }
    calculateDiff(member, newItem, oldItem) {
        const diffs = [];
        const oldTraits = oldItem ? (oldItem.traits || []) : [];
        const newTraits = newItem ? (newItem.traits || []) : [];
        const getTraitVal = (traits, code, dataId) => {
             return traits.filter(t => t.code === code && t.dataId === dataId)
                          .reduce((sum, t) => sum + t.value, 0);
        };
        const checkParamDynamic = (name, getterProp, code, dataId) => {
             const oldVal = getTraitVal(oldTraits, code, dataId);
             const newVal = getTraitVal(newTraits, code, dataId);
             if (oldVal !== newVal) {
                 const currentTotal = member[getterProp];
                 const newTotal = currentTotal - oldVal + newVal;
                 const sign = newTotal > currentTotal ? "+" : "";
                 const change = newTotal - currentTotal;
                 diffs.push(`${name}: ${sign}${change} (${currentTotal} -> ${newTotal})`);
             }
        };
        checkParamDynamic("Max HP", "maxHp", "PARAM_PLUS", "maxHp");
        checkParamDynamic("Atk", "atk", "PARAM_PLUS", "atk");
        const oldDmg = oldItem ? (oldItem.damageBonus || 0) : 0;
        const newDmg = newItem ? (newItem.damageBonus || 0) : 0;
        if (oldDmg !== newDmg) {
             diffs.push(`Damage Bonus: ${newDmg > oldDmg ? "+" : ""}${newDmg - oldDmg}`);
        }
        if (diffs.length === 0) {
            diffs.push("No stat changes.");
        }
        return diffs;
    }
}
