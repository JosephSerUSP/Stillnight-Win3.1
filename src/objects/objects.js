import { Game_Base } from "./game_base.js";
import { Game_Battler } from "./battler.js";
import { Game_Party } from "./party.js";
import { Game_Event } from "./event.js";
import { Game_Map } from "./map.js";
import { Game_Action } from "./action.js";

export { Game_Base, Game_Battler, Game_Party, Game_Event, Game_Map, Game_Action };

// Expose classes to the window object for testing if in test mode.
if (typeof window !== 'undefined' && window.location.search.includes("test=true")) {
    window.Game_Battler = Game_Battler;
    window.Game_Party = Game_Party;
    window.Game_Map = Game_Map;
    window.Game_Event = Game_Event;
    window.Game_Base = Game_Base;
    window.Game_Action = Game_Action;
}
