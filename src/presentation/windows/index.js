import { Window_Battle } from "./battle.js";
import { Window_Shop } from "./shop.js";
import { Window_Formation } from "./formation.js";
import { Window_Inventory } from "./inventory.js";
import { Window_Confirm, Window_ConfirmEffect } from "./confirm.js";
import { Window_PartySelect } from "./party_select.js";
import { Window_EquipItemSelect } from "./equip_select.js";
import { Window_Help, Window_Options, Window_Info } from "./misc.js";
import { Window_Desktop } from "./desktop.js";
import { Window_QuestLog, Window_Quest } from "./quest.js";

export * from "./utils.js";
export * from "./base.js";
export * from "./manager.js";
export * from "./selectable.js";
export * from "./battle.js";
export * from "./desktop.js";
export * from "./shop.js";
export * from "./formation.js";
export * from "./inventory.js";
export * from "./event.js";
export * from "./confirm.js";
export * from "./party_select.js";
export * from "./equip_select.js";
export * from "./details.js";
export * from "./misc.js";
export * from "./builder.js";
export * from "./audio_player.js";
export * from "./quest.js";

if (typeof window !== 'undefined' && window.location.search.includes("test=true")) {
    window.Window_Formation = Window_Formation;
    window.Window_Inventory = Window_Inventory;
    window.Window_Shop = Window_Shop;
    window.Window_Help = Window_Help;
    window.Window_Info = Window_Info;
    window.Window_Desktop = Window_Desktop;
    window.Window_Confirm = Window_Confirm;
    window.Window_ConfirmEffect = Window_ConfirmEffect;
    window.Window_PartySelect = Window_PartySelect;
    window.Window_EquipItemSelect = Window_EquipItemSelect;
    window.Window_Battle = Window_Battle;
    window.Window_Options = Window_Options;
    window.Window_QuestLog = Window_QuestLog;
    window.Window_Quest = Window_Quest;
}
