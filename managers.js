import { randInt, elementToAscii } from "./core.js";

/**
 * The data manager for the game.
 * @class
 */
export class DataManager {
  /**
   * The actor data.
   * @type {Object}
   */
  actors = null;

  /**
   * The element data.
   * @type {Object}
   */
  elements = null;

  /**
   * The event data.
   * @type {Array}
   */
  events = null;

  /**
   * The floor data.
   * @type {Array}
   */
  floors = null;

  /**
   * The item data.
   * @type {Array}
   */
  items = null;

  /**
   * The terms data.
   * @type {Object}
   */
  terms = null;

  /**
   * The skill data.
   * @type {Object}
   */
  skills = null;

  /**
   * The starting party data.
   * @type {Object}
   */
  startingParty = null;

  /**
   * Loads all the game data.
   */
  async loadData() {
    const dataSources = {
      actors: "data/actors.json",
      elements: "data/elements.json",
      events: "data/events.json",
      floors: "data/floors.json",
      items: "data/items.json",
      terms: "data/terms.json",
    };

    try {
      const { skills } = await import("./data/skills.js");
      this.skills = skills;
      const { startingParty } = await import("./data/party.js");
      this.startingParty = startingParty;
    } catch (error) {
      console.error("Failed to load skills.js:", error);
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
   * @private
   * @type {AudioContext}
   */
  static _audioCtx = null;

  /**
   * @method _initialize
   * @private
   * @description Initializes the AudioContext.
   */
  static _initialize() {
    if (!this._audioCtx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  /**
   * @method beep
   * @description Plays a simple square wave beep.
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
 * Refactored to support granular turn phases, enabling future player control.
 * The flow is now:
 * 1. startRound()
 * 2. getNextBattler()
 * 3. startTurn(battler) -> Events (Passives)
 * 4. getAIAction(battler) OR Player Input -> Action Object
 * 5. executeAction(action) -> Events (Damage, Status, Victory)
 */
export class BattleManager {
  /**
   * @param {import("./objects.js").Game_Party} party - The player's party.
   * @param {import("./main.js").DataManager} dataManager - The game's data manager.
   */
  constructor(party, dataManager) {
    this.party = party;
    this.dataManager = dataManager;
    this.enemies = [];
    this.round = 0;
    this.isBattleFinished = false;
    this.isVictoryPending = false;
    this.turnQueue = [];
  }

  /**
   * @method setup
   * @description Sets up a new battle.
   * @param {import("./objects.js").Game_Battler[]} enemies - The array of enemies for this battle.
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
   * @method elementMultiplier
   * @description Calculates the damage multiplier based on elemental affinities.
   * @param {string[]} attackerElements - The elements of the attacker.
   * @param {string[]} defenderElements - The elements of the defender.
   * @returns {number} The final damage multiplier.
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
   * @method _partyRow
   * @private
   * @description Gets the row of a party member.
   * @param {number} index - The index of the party member.
   * @returns {string} The row of the party member.
   */
  _partyRow(index) {
    return index <= 1 ? "Front" : "Back";
  }

  /**
   * @method startRound
   * @description Initializes a new round of combat by creating a turn queue.
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
   * @method getNextBattler
   * @description Retrieves the next active participant from the queue.
   * Skips dead units.
   * @returns {Object|null} The next battler context ({battler, index, isEnemy}) or null if round over.
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
   * @method startTurn
   * @description Processes start-of-turn effects for the battler.
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
   * @method getValidTargets
   * @description Returns a list of valid targets for the battler.
   * @param {Object} battlerContext - The context of the battler.
   * @returns {Array} List of valid targets (Game_Battler objects).
   */
  getValidTargets(battlerContext) {
      const { isEnemy } = battlerContext;
      if (isEnemy) {
          return this.party.members.slice(0, 4).filter(m => m.hp > 0);
      } else {
          return this.enemies.filter(e => e.hp > 0);
      }
  }

  /**
   * @method createAction
   * @description Factory method to create an action object.
   * @param {Object} battlerContext - The source of the action.
   * @param {string} type - The type of action ('attack', 'skill').
   * @param {Game_Battler} target - The target of the action.
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
   * @method getAIAction
   * @description Determines the AI action for a battler (or auto-battle for player).
   * @param {Object} battlerContext - The context of the battler.
   * @returns {Object} An Action object.
   */
  getAIAction(battlerContext) {
      const { battler } = battlerContext;

      // 1. Select Target
      const targets = this.getValidTargets(battlerContext);
      if (targets.length === 0) return null;

      const target = targets[randInt(0, targets.length - 1)];

      // 2. Decide Skill vs Attack
      const skillId = battler.skills && battler.skills.length ? battler.skills[randInt(0, battler.skills.length - 1)] : null;

      if (skillId) {
          return this.createAction(battlerContext, 'skill', target, { skillId });
      } else {
          return this.createAction(battlerContext, 'attack', target);
      }
  }

  /**
   * @method executeAction
   * @description Executes the provided action and returns resulting events.
   * @param {Object} action - The action object {type, sourceContext, target, skillId}.
   * @returns {Array} List of events.
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
                 if (effect.type === "heal_hp") {
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
   * @method _checkBattleEnd
   * @private
   * @description Checks if the battle has ended and appends end events.
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
 */
export class SceneManager {
  /**
   * @param {HTMLElement} container - The container element for the game.
   */
  constructor(container) {
    this.container = container;
    this._stack = [];
    this._currentScene = null;
    this.requestUpdate();
  }

  /**
   * @method update
   * @description The main game loop.
   */
  update() {
    if (this._currentScene) {
      this._currentScene.update();
    }
    this.requestUpdate();
  }

  /**
   * @method requestUpdate
   * @description Requests the next frame of the game loop.
   */
  requestUpdate() {
    requestAnimationFrame(this.update.bind(this));
  }

  /**
   * @method push
   * @description Pushes a new scene onto the stack.
   * @param {Scene_Base} scene - The scene to push.
   */
  push(scene) {
    if (this._currentScene) {
      this._stack.push(this._currentScene);
    }
    this._currentScene = scene;
    scene.start();
  }

  /**
   * @method pop
   * @description Pops the current scene from the stack.
   */
  pop() {
    if (this._currentScene) {
      this._currentScene.stop();
    }
    this._currentScene = this._stack.pop();
  }

  /**
   * @method currentScene
   * @description Gets the current scene.
   * @returns {import("../scenes.js").Scene_Base} The current scene.
   */
  currentScene() {
    return this._currentScene;
  }

  /**
   * @method previous
   * @description Gets the previous scene.
   * @returns {import("../scenes.js").Scene_Base} The previous scene.
   */
  previous() {
    return this._stack[this._stack.length - 1];
    }
}
