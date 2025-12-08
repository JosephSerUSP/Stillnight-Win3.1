import { Scene_Base } from "./base.js";
import { Window_TuneUp } from "../windows/tuneup.js";
import { SoundManager } from "../managers/sound.js";

export class Scene_TuneUp extends Scene_Base {
    constructor(dataManager, sceneManager, windowManager, party) {
        super(dataManager, windowManager);
        this.sceneManager = sceneManager;
        this.party = party;

        this.tuneUpWindow = new Window_TuneUp();
        this.windowManager.push(this.tuneUpWindow);

        this.tuneUpWindow.onUserClose = () => {
            this.sceneManager.pop();
        };

        this.tuneUpWindow.setup(this.party.inventory, (source, traitIdx, target) => this.performTuneUp(source, traitIdx, target));
    }

    performTuneUp(source, traitIdx, target) {
        // Check for "Tool"
        const toolIdx = this.party.inventory.findIndex(i => i.id === 'tool');
        if (toolIdx === -1) {
            this.tuneUpWindow.statusLabel.textContent = "You need a 'Tool' to tune up.";
            SoundManager.play('UI_ERROR');
            return;
        }

        // Remove Tool
        this.party.inventory.splice(toolIdx, 1);

        // Move Trait
        const trait = source.traits[traitIdx];
        source.traits.splice(traitIdx, 1);

        if (!target.traits) target.traits = [];
        target.traits.push(trait);

        SoundManager.play('EQUIP');
        this.tuneUpWindow.statusLabel.textContent = "Tune up successful!";

        // Refresh
        this.tuneUpWindow.setup(this.party.inventory, (s, tI, t) => this.performTuneUp(s, tI, t));
    }
}
