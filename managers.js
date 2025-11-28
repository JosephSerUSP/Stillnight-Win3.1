import { randInt, elementToAscii } from "./core.js";

/**
 * @class DataManager
 * @description Central manager for loading and accessing game data.
 * Loads static JSON data and dynamic JS data modules.
 */
export class DataManager {
  /**
   * Creates a new DataManager instance.
   */
  constructor() {
    /**
     * The actor data loaded from actors.json.
     * @type {Object|null}
     */
    this.actors = null;

    /**
     * The element data loaded from elements.json.
     * @type {Object|null}
     */
    this.elements = null;

    /**
     * The event data loaded from events.json.
     * @type {Array|null}
     */
    this.events = null;

    /**
     * The map data loaded from maps.json.
     * @type {Array|null}
     */
    this.maps = null;

    /**
     * The item data loaded from items.json.
     * @type {Array|null}
     */
    this.items = null;

    /**
     * The NPC data loaded from npcs.json.
     * @type {Array|null}
     */
    this.npcs = null;

    /**
     * The terms/strings data loaded from terms.json.
     * @type {Object|null}
     */
    this.terms = null;

    /**
     * The skill data loaded from skills.js.
     * @type {Object|null}
     */
    this.skills = null;

    /**
     * The passive data loaded from passives.js.
     * @type {Object|null}
     */
    this.passives = null;

    /**
     * The starting party data loaded from party.js.
     * @type {Object|null}
     */
    this.startingParty = null;

    /**
     * The animation data loaded from animations.js.
     * @type {Object|null}
     */
    this.animations = null;
  }

  /**
   * Loads all game data from JSON and JS files.
   * @async
   */
  async loadData() {
    const dataSources = {
      actors: "data/actors.json",
      elements: "data/elements.json",
      events: "data/events.json",
      maps: "data/maps.json",
      items: "data/items.json",
      npcs: "data/npcs.json",
      terms: "data/terms.json",
    };

    try {
      const { skills } = await import("./data/skills.js");
      this.skills = skills;
      const { passives } = await import("./data/passives.js");
      this.passives = passives;
      const { startingParty } = await import("./data/party.js");
      this.startingParty = startingParty;
    } catch (error) {
      console.error("Failed to load skills.js or passives.js:", error);
    }

    for (const [key, src] of Object.entries(dataSources)) {
      try {
        const response = await fetch(src);
        this[key] = await response.json();
      } catch (error) {
        console.error(`Failed to load ${src}:`, error);
      }
    }

    // Load Animations
    try {
        const { animations } = await import("./data/animations.js");
        this.animations = animations;
    } catch (error) {
        console.error("Failed to load animations.js:", error);
    }
  }
}

/**
 * @class SoundManager
 * @description A static class for handling audio playback.
 * This encapsulates the AudioContext and provides a simple interface
 * for playing sound effects. This prevents the need to create a new
 * AudioContext for each sound and keeps audio-related logic in one place.
 */
export class SoundManager {
  /**
   * The global AudioContext instance.
   * @private
   * @type {AudioContext}
   */
  static _audioCtx = null;

  /**
   * Initializes the AudioContext if it hasn't been initialized yet.
   * @method _initialize
   * @private
   */
  static _initialize() {
    if (!this._audioCtx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  /**
   * Plays a simple square wave beep sound.
   * @method beep
   * @param {number} [frequency=440] - The frequency of the beep in Hz.
   * @param {number} [duration=120] - The duration of the beep in ms.
   */
  static beep(frequency = 440, duration = 120) {
    this._initialize();
    if (!this._audioCtx) return;

    try {
      const oscillator = this._audioCtx.createOscillator();
      const gainNode = this._audioCtx.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.05;
      oscillator.connect(gainNode);
      gainNode.connect(this._audioCtx.destination);
      oscillator.start();
      oscillator.stop(this._audioCtx.currentTime + duration / 1000);
    } catch (e) {
      // Fail silently if audio context fails.
    }
  }
}

/**
 * @class BattleManager
 * @description Manages the state and flow of a single battle instance.
 * Handles turn order, action execution, and victory/defeat conditions.
 * The flow is:
 * 1. startRound() - Initializes the turn queue.
 * 2. getNextBattler() - Gets the next active battler.
 * 3. startTurn(battler) - Processes start-of-turn effects (passives).
 * 4. getAIAction(battler) - Generates an action for AI or auto-battle.
 * 5. executeAction(action) - Resolves the action and returns events.
 */
export class BattleManager {
  /**
   * Creates a new BattleManager instance.
   * @param {import("./objects.js").Game_Party} party - The player's party.
   * @param {DataManager} dataManager - The game's data manager.
   */
  constructor(party, dataManager) {
    /**
     * The player's party.
     * @type {import("./objects.js").Game_Party}
     */
    this.party = party;

    /**
     * The global data manager.
     * @type {DataManager}
     */
    this.dataManager = dataManager;

    /**
     * The list of enemies in the current battle.
     * @type {import("./objects.js").Game_Battler[]}
     */
    this.enemies = [];

    /**
     * The current round number.
     * @type {number}
     */
    this.round = 0;

    /**
     * Whether the battle has finished.
     * @type {boolean}
     */
    this.isBattleFinished = false;

    /**
     * Whether victory has been achieved and is pending processing.
     * @type {boolean}
     */
    this.isVictoryPending = false;

    /**
     * The queue of battlers for the current turn.
     * @type {Array}
     */
    this.turnQueue = [];
  }

  /**
   * Sets up a new battle with the given enemies.
   * @method setup
   * @param {import("./objects.js").Game_Battler[]} enemies - The array of enemies for this battle.
   * @param {number} tileX - The X coordinate on the map where the battle started.
   * @param {number} tileY - The Y coordinate on the map where the battle started.
   */
  setup(enemies, tileX, tileY) {
    this.enemies = enemies;
    this.tileX = tileX;
    this.tileY = tileY;
    this.round = 0;
    this.isBattleFinished = false;
    this.isVictoryPending = false;
    this.turnQueue = [];
  }

  /**
   * Calculates the damage multiplier based on elemental affinities.
   * @method elementMultiplier
   * @param {string[]} attackerElements - The elements of the attacker.
   * @param {string[]} defenderElements - The elements of the defender.
   * @returns {number} The final damage multiplier (e.g., 1.5 for weakness, 0.75 for resistance).
   */
  elementMultiplier(attackerElements, defenderElements) {
    let multiplier = 1;
    let advantageFound = false;
    let disadvantageFound = false;

    for (const attackerEl of attackerElements) {
      if (advantageFound || disadvantageFound) break;
      for (const defenderEl of defenderElements) {
        const row = this.dataManager.elements[attackerEl];
        if (row) {
          if (row.strong && row.strong.includes(defenderEl)) {
            advantageFound = true;
            break;
          }
          if (row.weak && row.weak.includes(defenderEl)) {
            disadvantageFound = true;
            break;
          }
        }
      }
    }

    if (advantageFound) {
      multiplier = 1.5;
    } else if (disadvantageFound) {
      multiplier = 0.75;
    }

    return multiplier;
  }

  /**
   * Gets the row name ("Front" or "Back") for a party member based on their index.
   * @method _partyRow
   * @private
   * @param {number} index - The index of the party member.
   * @returns {string} "Front" or "Back".
   */
  _partyRow(index) {
    return index <= 1 ? "Front" : "Back";
  }

  /**
   * Initializes a new round of combat by creating a turn queue sorted by the default order.
   * @method startRound
   */
  startRound() {
    if (this.isBattleFinished) return;
    this.round++;
    // Create a turn order list: Party then Enemies
    this.turnQueue = [
        ...this.party.members.slice(0, 4).map((b, i) => ({ battler: b, index: i, isEnemy: false })),
        ...this.enemies.map((b, i) => ({ battler: b, index: i, isEnemy: true }))
    ];
  }

  /**
   * Retrieves the next active participant from the turn queue.
   * Skips units that are dead.
   * @method getNextBattler
   * @returns {Object|null} The next battler context ({battler, index, isEnemy}) or null if the round is over.
   */
  getNextBattler() {
      if (this.isBattleFinished) return null;

      let p = this.turnQueue.shift();
      while (p && p.battler.hp <= 0) {
           p = this.turnQueue.shift();
      }
      return p || null;
  }

  /**
   * Processes start-of-turn effects for the battler (e.g., passive drains).
   * @method startTurn
   * @param {Object} battlerContext - The context returned by getNextBattler().
   * @returns {Array} List of events occurring at start of turn.
   */
  startTurn(battlerContext) {
      const { battler, index, isEnemy } = battlerContext;
      const events = [];

      // --- Passive Effects (e.g., Parasite) ---
      if (!isEnemy) {
           const parasiteDrain = battler.getPassiveValue("PARASITE");
           if (parasiteDrain > 0) {
               const targetIndex = index % 2 === 0 ? index + 1 : index - 1;
               if (targetIndex >= 0 && targetIndex < 4) {
                   const target = this.party.members[targetIndex];
                   if (target && target.hp > 0) {
                      const hpBeforeTarget = target.hp;
                      const hpBeforeSource = battler.hp;

                      target.hp = Math.max(0, target.hp - parasiteDrain);
                      battler.hp = Math.min(battler.maxHp, battler.hp + parasiteDrain);

                      events.push({
                          type: 'passive_drain',
                          source: battler,
                          target: target,
                          value: parasiteDrain,
                          hpBeforeTarget: hpBeforeTarget,
                          hpAfterTarget: target.hp,
                          hpBeforeSource: hpBeforeSource,
                          hpAfterSource: battler.hp,
                          msg: `[Passive] ${battler.name} drains ${parasiteDrain} HP from ${target.name}.`,
                      });
                   }
               }
           }
      }

      // Passive damage/healing might end the battle.
      this._checkBattleEnd(events);

      return events;
  }

  /**
   * Returns a list of valid targets for the battler based on the specified scope.
   * @method getValidTargets
   * @param {Object} battlerContext - The context of the battler.
   * @param {string} [scope='enemy'] - The target scope ('enemy', 'ally', 'self', etc.).
   * @returns {import("./objects.js").Game_Battler[]} List of valid targets.
   */
  getValidTargets(battlerContext, scope = 'enemy') {
      const { isEnemy } = battlerContext;

      // Determine logical side
      // if scope is 'enemy', we want the Opposing side.
      // if scope is 'ally', we want the Same side.

      let targetSide = [];

      if (scope.includes('self')) {
          return [battlerContext.battler];
      }

      // "Enemy" means "The opposing team"
      // "Ally" means "My team"

      const myTeam = isEnemy ? this.enemies : this.party.members.slice(0, 4);
      const opposingTeam = isEnemy ? this.party.members.slice(0, 4) : this.enemies;

      if (scope.includes('ally')) {
          targetSide = myTeam;
      } else {
          targetSide = opposingTeam;
      }

      return targetSide.filter(b => b.hp > 0);
  }

  /**
   * Factory method to create an action object.
   * @method createAction
   * @param {Object} battlerContext - The source of the action.
   * @param {string} type - The type of action ('attack', 'skill').
   * @param {import("./objects.js").Game_Battler} target - The target of the action.
   * @param {Object} [options] - Additional options (e.g., skillId).
   * @returns {Object} The action object.
   */
  createAction(battlerContext, type, target, options = {}) {
      return {
          type,
          sourceContext: battlerContext,
          target,
          ...options
      };
  }

  /**
   * Determines the AI action for a battler (or auto-battle for player).
   * @method getAIAction
   * @param {Object} battlerContext - The context of the battler.
   * @returns {Object|null} An Action object, or null if no action can be taken.
   */
  getAIAction(battlerContext) {
      const { battler } = battlerContext;

      // 1. Decide Action Type (Skill or Attack)
      // Simple logic: 60% chance to use skill if available
      const skillId = (battler.skills && battler.skills.length && Math.random() < 0.6)
          ? battler.skills[randInt(0, battler.skills.length - 1)]
          : null;

      if (skillId) {
          const skill = this.dataManager.skills[skillId];
          const scope = skill ? skill.target : 'enemy';
          const targets = this.getValidTargets(battlerContext, scope);

          if (targets.length === 0) return null; // No valid targets for this skill, maybe fallback to attack?

          // Smart targeting for healing: prefer lowest HP
          let target;
          if (scope.includes('ally') && (skill.effects.some(e => e.type === 'hp_heal'))) {
              // Find ally with lowest HP percentage
              target = targets.reduce((prev, curr) => {
                  return (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev;
              });
          } else {
              target = targets[randInt(0, targets.length - 1)];
          }

          return this.createAction(battlerContext, 'skill', target, { skillId });
      } else {
          // Attack (Scope: enemy)
          const targets = this.getValidTargets(battlerContext, 'enemy');
          if (targets.length === 0) return null;
          const target = targets[randInt(0, targets.length - 1)];
          return this.createAction(battlerContext, 'attack', target);
      }
  }

  /**
   * Executes the provided action and returns a list of resulting events.
   * Handles damage calculation, status application, and event generation.
   * @method executeAction
   * @param {Object} action - The action object {type, sourceContext, target, skillId}.
   * @returns {Array} List of events describing the outcome.
   */
  executeAction(action) {
      const events = [];
      if (!action) return events;

      const { sourceContext, target } = action;
      const { battler, index, isEnemy } = sourceContext;

      if (battler.hp <= 0) return events; // Should not happen but safety check
      if (target.hp <= 0) return events; // Target died before action?

      if (action.type === 'skill') {
          const skill = this.dataManager.skills[action.skillId];
          if (skill) {
               let boost = 1;
               if (skill.element) {
                 const matches = battler.elements.filter((e) => e === skill.element).length;
                 boost += matches * 0.25;
               }
               const skillName = `${elementToAscii(skill.element)}${skill.name}`;
               events.push({ type: 'use_skill', battler: battler, skillName, msg: `${battler.name} uses ${skillName}!` });

               skill.effects.forEach((effect) => {
                 if (effect.type === "hp_damage") {
                   const formula = effect.formula.replace("a.level", battler.level);
                   let skillDmg = Math.round(eval(formula) * boost);
                   if (skillDmg < 1) skillDmg = 1;

                   const hpBefore = target.hp;
                   target.hp = Math.max(0, target.hp - skillDmg);

                   events.push({
                       type: 'damage',
                       battler: battler,
                       target: target,
                       value: skillDmg,
                       hpBefore: hpBefore,
                       hpAfter: target.hp,
                       msg: `  ${target.name} takes ${skillDmg} damage.`
                   });
                 }
                 if (effect.type === "hp_heal") {
                    const formula = effect.formula.replace("a.level", battler.level);
                    let heal = Math.round(eval(formula) * boost);
                    if (heal < 1) heal = 1;

                    const hpBefore = target.hp;
                    target.hp = Math.min(target.maxHp, target.hp + heal);

                    events.push({
                        type: 'heal',
                        battler: battler,
                        target: target,
                        value: heal,
                        hpBefore: hpBefore,
                        hpAfter: target.hp,
                        msg: `  ${target.name} heals ${heal} HP.`,
                        animation: 'healing_sparkle'
                    });
                 }
                 if (effect.type === "add_status") {
                   const chance = (effect.chance || 1) * boost;
                   if (Math.random() < chance) {
                     events.push({ type: 'status', target: target, status: effect.status, msg: `  ${target.name} is afflicted with ${effect.status}.` });
                   }
                 }
               });
          }
      } else if (action.type === 'attack') {
           // Normal Attack
           let base = 0;
           if (isEnemy) {
               base = Math.max(1, battler.level + randInt(-1, 2));
           } else {
               base = randInt(2, 4) + Math.floor(battler.level / 2);
               if (battler.equipmentItem && battler.equipmentItem.damageBonus) {
                 base += battler.equipmentItem.damageBonus;
               }
               const row = this._partyRow(index);
               if (row === "Front") base += 1;
               else base -= 1;
           }

           const mult = this.elementMultiplier(battler.elements, target.elements);
           let dmg = Math.round(base * mult);
           dmg += battler.getPassiveValue("DEAL_DAMAGE_MOD");
           if (dmg < 1) dmg = 1;

           const hpBefore = target.hp;
           target.hp = Math.max(0, target.hp - dmg);

           events.push({
             type: "damage",
             battler: battler,
             target: target,
             value: dmg,
             hpBefore: hpBefore,
             hpAfter: target.hp,
             msg: `${battler.name} attacks ${target.name} for ${dmg}.`,
           });
      }

      this._checkBattleEnd(events);
      return events;
  }

  /**
   * Checks if the battle has ended (win or loss) and appends end events if so.
   * @method _checkBattleEnd
   * @private
   * @param {Array} events - The event list to append to.
   */
  _checkBattleEnd(events) {
    const anyEnemyAlive = this.enemies.some((e) => e.hp > 0);
    const anyPartyAlive = this.party.members.slice(0, 4).some((p) => p.hp > 0);

    if (!anyPartyAlive) {
      this.isBattleFinished = true;
      this.turnQueue = [];
      events.push({ type: "end", result: "defeat", msg: this.dataManager.terms.battle.your_party_collapses });
    } else if (!anyEnemyAlive) {
      this.isBattleFinished = true;
      this.isVictoryPending = true;
      this.turnQueue = [];
      events.push({ type: "end", result: "victory", msg: this.dataManager.terms.battle.victory });
    }
  }
}

/**
 * @class SceneManager
 * @description Manages the scene stack and the main game loop.
 * Scenes are pushed onto a stack, and only the top scene is updated and rendered.
 */
export class SceneManager {
  /**
   * Creates a new SceneManager.
   * @param {HTMLElement} container - The container element for the game.
   */
  constructor(container) {
    /**
     * The DOM container for the game.
     * @type {HTMLElement}
     */
    this.container = container;

    /**
     * The stack of active scenes.
     * @type {import("../scenes.js").Scene_Base[]}
     * @private
     */
    this._stack = [];

    /**
     * The currently active scene.
     * @type {import("../scenes.js").Scene_Base|null}
     * @private
     */
    this._currentScene = null;

    // Start the game loop
    this.requestUpdate();
  }

  /**
   * The main game loop update function.
   * Calls update() on the current scene and requests the next frame.
   * @method update
   */
  update() {
    if (this._currentScene) {
      this._currentScene.update();
    }
    this.requestUpdate();
  }

  /**
   * Requests the next animation frame for the game loop.
   * @method requestUpdate
   */
  requestUpdate() {
    requestAnimationFrame(this.update.bind(this));
  }

  /**
   * Pushes a new scene onto the stack and starts it.
   * Pauses the previous scene.
   * @method push
   * @param {import("../scenes.js").Scene_Base} scene - The scene to push.
   */
  push(scene) {
    if (this._currentScene) {
      this._stack.push(this._currentScene);
    }
    this._currentScene = scene;
    scene.start();
  }

  /**
   * Pops the current scene from the stack and stops it.
   * Resumes the previous scene.
   * @method pop
   */
  pop() {
    if (this._currentScene) {
      this._currentScene.stop();
    }
    this._currentScene = this._stack.pop();
  }

  /**
   * Gets the currently active scene.
   * @method currentScene
   * @returns {import("../scenes.js").Scene_Base|null} The current scene.
   */
  currentScene() {
    return this._currentScene;
  }

  /**
   * Gets the previous scene in the stack (the one below the current scene).
   * @method previous
   * @returns {import("../scenes.js").Scene_Base|undefined} The previous scene.
   */
  previous() {
    return this._stack[this._stack.length - 1];
    }
}

// Expose classes to the window object for testing if in test mode.
if (typeof window !== 'undefined' && window.location.search.includes("test=true")) {
    window.DataManager = DataManager;
    window.SoundManager = SoundManager;
    window.BattleManager = BattleManager;
    window.SceneManager = SceneManager;
}
