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

    // --- 1. Build Event Queue ---
    partyMembers.forEach((p, index) => {
      if (p.hp > 0) {
        const parasiteDrain = p.getPassiveValue("PARASITE");
        if (parasiteDrain > 0) {
          const targetIndex = index % 2 === 0 ? index + 1 : index - 1;
          if (targetIndex >= 0 && targetIndex < 4) {
            const target = this.party.members[targetIndex];
            if (target && target.hp > 0) {
              events.push({
                type: 'passive_drain',
                source: p,
                target: target,
                value: parasiteDrain,
                msg: `[Passive] ${p.name} drains ${parasiteDrain} HP from ${target.name}.`,
              });
            }
          }
        }
      }
      if (p.hp <= 0) return;
      const target = this.enemies.find((e) => e.hp > 0);
      if (!target) return;

      const skillId = p.skills && p.skills.length ? p.skills[randInt(0, p.skills.length - 1)] : null;
      const skill = skillId ? this.dataManager.skills[skillId] : null;

      if (skill) {
        let boost = 1;
        if (skill.element) {
          const matches = p.elements.filter((e) => e === skill.element).length;
          boost += matches * 0.25;
        }
        const skillName = `${elementToAscii(skill.element)}${skill.name}`;
        events.push({ type: 'use_skill', battler: p, skillName, msg: `${p.name} uses ${skillName}!` });

        skill.effects.forEach((effect) => {
          if (effect.type === "hp_damage") {
            const formula = effect.formula.replace("a.level", p.level);
            let skillDmg = Math.round(eval(formula) * boost);
            if (skillDmg < 1) skillDmg = 1;
            events.push({ type: 'damage', target: target, value: skillDmg, msg: `  ${target.name} takes ${skillDmg} damage.` });
          }
          if (effect.type === "add_status") {
            const chance = (effect.chance || 1) * boost;
            if (Math.random() < chance) {
              events.push({ type: 'status', target: target, status: effect.status, msg: `  ${target.name} is afflicted with ${effect.status}.` });
            }
          }
        });
      } else {
        let base = randInt(2, 4) + Math.floor(p.level / 2);
        if (p.equipmentItem && p.equipmentItem.damageBonus) {
          base += p.equipmentItem.damageBonus;
        }
        const row = this._partyRow(index);
        if (row === "Front") base += 1;
        else base -= 1;
        const mult = this.elementMultiplier(p.elements, target.elements);
        let dmg = Math.round(base * mult);
        dmg += p.getPassiveValue("DEAL_DAMAGE_MOD");
        if (dmg < 1) dmg = 1;

        events.push({
          type: "damage",
          battler: p,
          target: target,
          value: dmg,
          msg: `${p.name} attacks ${target.name} for ${dmg}.`,
        });
      }
    });

    this.enemies.forEach((e) => {
      if (e.hp <= 0) return;
      const possibleTargets = partyMembers.filter((p) => p.hp > 0);
      if (possibleTargets.length === 0) return;
      const target = possibleTargets[randInt(0, possibleTargets.length - 1)];

      const skillId = e.skills && e.skills.length ? e.skills[randInt(0, e.skills.length - 1)] : null;
      const skill = skillId ? this.dataManager.skills[skillId] : null;

      if (skill) {
        let boost = 1;
        if (skill.element) {
          const matches = e.elements.filter((el) => el === skill.element).length;
          boost += matches * 0.25;
        }
        const skillName = `${elementToAscii(skill.element)}${skill.name}`;
        events.push({ type: 'use_skill', battler: e, skillName, msg: `${e.name} uses ${skillName}!` });

        skill.effects.forEach((effect) => {
          if (effect.type === "hp_damage") {
            const formula = effect.formula.replace("a.level", e.level);
            let skillDmg = Math.round(eval(formula) * boost);
            if (skillDmg < 1) skillDmg = 1;
            events.push({ type: 'damage', target, value: skillDmg, msg: `  ${target.name} takes ${skillDmg} damage.` });
          }
          if (effect.type === "add_status") {
            const chance = (effect.chance || 1) * boost;
            if (Math.random() < chance) {
              events.push({ type: 'status', target, status: effect.status, msg: `  ${target.name} is afflicted with ${effect.status}.` });
            }
          }
        });
      } else {
        const dmg = Math.max(1, e.level + randInt(-1, 2));
        events.push({
          type: "damage",
          battler: e,
          target: target,
          value: dmg,
          msg: `${e.name} attacks ${target.name} for ${dmg}.`,
        });
      }
    });

    // --- 2. Apply Events and Check for Battle End ---
    events.forEach(event => {
      if (event.type === 'damage') {
        event.target.hp = Math.max(0, event.target.hp - event.value);
      } else if (event.type === 'passive_drain') {
        event.target.hp = Math.max(0, event.target.hp - event.value);
        event.source.hp = Math.min(event.source.maxHp, event.source.hp + event.value);
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
   * @param {import("./windows.js").WindowManager} windowManager - The window manager instance.
   */
  constructor(container, windowManager) {
    this.container = container;
    this.windowManager = windowManager;
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
