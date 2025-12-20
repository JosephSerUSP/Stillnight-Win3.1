import { ExplorationSystem } from "../engine/systems/exploration.js";

/**
 * Adapter to bridge Scene_Map (legacy View/Controller) with ExplorationSystem (pure Engine).
 * Implements interfaces of both Game_Map and ExplorationEngine.
 */
export class ExplorationAdapter {
    /**
     * @param {import("../objects/party.js").Game_Party} party
     * @param {import("../engine/session/exploration_state.js").ExplorationState} [state]
     */
    constructor(party, state = null) {
        this.system = new ExplorationSystem();
        this.state = state;
        this.party = party;
    }

    // --- Game_Map State Interface ---

    get floors() { return this.state ? this.state.floors : []; }

    get floorIndex() { return this.state ? this.state.floorIndex : 0; }
    set floorIndex(v) { if(this.state) this.state.floorIndex = v; }

    get playerX() { return this.state ? this.state.playerX : 0; }
    set playerX(v) { if(this.state) this.state.playerX = v; }

    get playerY() { return this.state ? this.state.playerY : 0; }
    set playerY(v) { if(this.state) this.state.playerY = v; }

    get maxReachedFloorIndex() { return this.state ? this.state.maxReachedFloorIndex : 0; }
    set maxReachedFloorIndex(v) { if(this.state) this.state.maxReachedFloorIndex = v; }

    get MAX_W() { return this.state ? this.state.config.MAX_W : 19; }
    get MAX_H() { return this.state ? this.state.config.MAX_H : 19; }

    // --- Game_Map Logic Interface ---

    initFloors(mapData, eventDefs, npcData, party, actors) {
        this.state = this.system.createSession(mapData, { eventDefs, npcData, party, actors });
    }

    revealAroundPlayer(radius = 1) {
        if(this.state) this.system.revealAroundPlayer(this.state, radius);
    }

    checkFloorExploration() {
        return this.state ? this.system.checkFloorExploration(this.state) : false;
    }

    revealCurrentFloor(updateVisited) {
        if(this.state) this.system.revealCurrentFloor(this.state, updateVisited);
    }

    removeEvent(floorIndex, x, y) {
        if(this.state) this.system.removeEvent(this.state, floorIndex, x, y);
    }

    // --- ExplorationEngine Interface ---

    tryMove(dx, dy) {
        if(!this.state) return { type: 'BLOCKED', reason: 'no_state' };
        return this.system.move(this.state, dx, dy, this.party);
    }

    handleTileInteraction(x, y) {
        if(!this.state) return { type: 'BLOCKED', reason: 'no_state' };
        return this.system.interact(this.state, x, y, this.party);
    }

    updateEntities() {
         if(!this.state) return [];
         return this.system.updateEntities(this.state, this.party);
    }
}
