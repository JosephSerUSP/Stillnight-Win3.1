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
 * Future-forward: This class is the first step in decoupling battle logic
 * from the Scene_Map. The goal is to make this class stateless or state-managed,
 * accepting a battle state object and returning a result, rather than
 * modifying a scene directly. For now, it will hold the battle state.
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
   * @method resolveRound
   * @description Resolves a single round of combat, generating a sequence of events.
   * This is a pure function that takes the current state and returns a list of
   * events that should be animated by the scene.
   * @returns {Array<Object>} An array of battle log events.
   */
  resolveRound() {
    if (this.isBattleFinished) return [];

    this.round++;
    const events = [];
    const partyMembers = this.party.members.slice(0, 4);

    // Combine all potential combatants into one list
    // Order: Party members then Enemies
    const combatants = [...partyMembers, ...this.enemies];

    combatants.forEach((actor, index) => {
      // 1. Check if actor is alive (crucial: they might have died in this same round)
      if (actor.hp <= 0) return;

      const isParty = partyMembers.includes(actor);

      // Handle Passives (only implemented for party for now, similar to old code)
      if (isParty) {
        const parasiteDrain = actor.getPassiveValue("PARASITE");
        if (parasiteDrain > 0) {
          const targetIndex = index % 2 === 0 ? index + 1 : index - 1;
          if (targetIndex >= 0 && targetIndex < 4) {
            const target = this.party.members[targetIndex];
            if (target && target.hp > 0) {
              const drain = Math.min(target.hp, parasiteDrain); // Can't drain more than HP
              target.hp = Math.max(0, target.hp - drain);
              actor.hp = Math.min(actor.maxHp, actor.hp + drain);
              events.push({
                type: 'passive_drain',
                source: actor,
                target: target,
                value: drain,
                targetHp: target.hp, // Current HP state
                sourceHp: actor.hp,   // Current HP state
                msg: `[Passive] ${actor.name} drains ${drain} HP from ${target.name}.`,
              });
            }
          }
        }
      }

      // Re-check life after passives (unlikely to die from own parasite but good practice)
      if (actor.hp <= 0) return;

      // 2. Select Target
      let target = null;
      if (isParty) {
        // Party targets first living enemy
        target = this.enemies.find((e) => e.hp > 0);
      } else {
        // Enemy targets random living party member
        const possibleTargets = partyMembers.filter((p) => p.hp > 0);
        if (possibleTargets.length > 0) {
          target = possibleTargets[randInt(0, possibleTargets.length - 1)];
        }
      }

      if (!target) return; // No targets available

      // 3. Determine Action
      const skillId = actor.skills && actor.skills.length ? actor.skills[randInt(0, actor.skills.length - 1)] : null;
      const skill = skillId ? this.dataManager.skills[skillId] : null;

      if (skill) {
        let boost = 1;
        if (skill.element) {
          const matches = actor.elements.filter((e) => e === skill.element).length;
          boost += matches * 0.25;
        }
        const skillName = `${elementToAscii(skill.element)}${skill.name}`;
        events.push({ type: 'use_skill', battler: actor, skillName, msg: `${actor.name} uses ${skillName}!` });

        skill.effects.forEach((effect) => {
          if (effect.type === "hp_damage") {
            const formula = effect.formula.replace("a.level", actor.level);
            let skillDmg = Math.round(eval(formula) * boost);
            if (skillDmg < 1) skillDmg = 1;

            target.hp = Math.max(0, target.hp - skillDmg);
            events.push({
              type: 'damage',
              battler: actor, // Included for reference
              target: target,
              value: skillDmg,
              targetHp: target.hp, // Capture state immediately
              msg: `  ${target.name} takes ${skillDmg} damage.`
            });
          }
          if (effect.type === "add_status") {
            const chance = (effect.chance || 1) * boost;
            if (Math.random() < chance) {
              events.push({ type: 'status', target: target, status: effect.status, msg: `  ${target.name} is afflicted with ${effect.status}.` });
            }
          }
        });
      } else {
        // Basic Attack
        let base;
        if (isParty) {
            base = randInt(2, 4) + Math.floor(actor.level / 2);
            if (actor.equipmentItem && actor.equipmentItem.damageBonus) {
              base += actor.equipmentItem.damageBonus;
            }
            const row = this._partyRow(partyMembers.indexOf(actor));
            if (row === "Front") base += 1;
            else base -= 1;
        } else {
             base = Math.max(1, actor.level + randInt(-1, 2));
        }

        let mult = 1;
        if (isParty) {
            mult = this.elementMultiplier(actor.elements, target.elements);
        }

        let dmg = Math.round(base * mult);
        if (isParty) {
            dmg += actor.getPassiveValue("DEAL_DAMAGE_MOD");
        }
        if (dmg < 1) dmg = 1;

        // APPLY DAMAGE IMMEDIATELY
        target.hp = Math.max(0, target.hp - dmg);

        events.push({
          type: "damage",
          battler: actor,
          target: target,
          value: dmg,
          targetHp: target.hp, // Capture state immediately
          msg: `${actor.name} attacks ${target.name} for ${dmg}.`,
        });
      }
    });

    const anyEnemyAlive = this.enemies.some((e) => e.hp > 0);
    const anyPartyAlive = partyMembers.some((p) => p.hp > 0);

    if (!anyPartyAlive) {
      this.isBattleFinished = true;
      events.push({ type: "end", result: "defeat", msg: this.dataManager.terms.battle.your_party_collapses });
    } else if (!anyEnemyAlive) {
      this.isBattleFinished = true;
      this.isVictoryPending = true;
      events.push({ type: "end", result: "victory", msg: this.dataManager.terms.battle.victory });
    }

    return events;
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
