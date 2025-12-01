import { Window_Battle } from "./windows/battle.js";
import { Window_Shop } from "./windows/shop.js";
import { Window_Formation } from "./windows/formation.js";
import { Window_Inventory } from "./windows/inventory.js";
import { Window_ConfirmEffect } from "./windows/confirm.js";
import { Window_PartySelect } from "./windows/party_select.js";
import { Window_EquipItemSelect } from "./windows/equip_select.js";
import { Window_Help, Window_Options } from "./windows/misc.js";
import { Window_Desktop } from "./windows/desktop.js";

export * from "./windows/utils.js";
export * from "./windows/base.js";
export * from "./windows/manager.js";
export * from "./windows/selectable.js";
export * from "./windows/battle.js";
export * from "./windows/desktop.js";
export * from "./windows/shop.js";
export * from "./windows/formation.js";
export * from "./windows/inventory.js";
export * from "./windows/event.js";
export * from "./windows/confirm.js";
export * from "./windows/party_select.js";
export * from "./windows/equip_select.js";
export * from "./windows/details.js";
export * from "./windows/misc.js";

if (typeof window !== 'undefined' && window.location.search.includes("test=true")) {
    window.Window_Formation = Window_Formation;
    window.Window_Inventory = Window_Inventory;
    window.Window_Shop = Window_Shop;
    window.Window_Help = Window_Help;
    window.Window_Desktop = Window_Desktop;
    window.Window_ConfirmEffect = Window_ConfirmEffect;
    window.Window_PartySelect = Window_PartySelect;
    window.Window_EquipItemSelect = Window_EquipItemSelect;
    window.Window_Battle = Window_Battle;
    window.Window_Options = Window_Options;
}
