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
   * @method processTurn
   * @description Processes the turn of the next participant in the queue.
   * @returns {Array<Object>|null} An array of events for the turn, or null if the round is over.
   */
  processTurn() {
    if (this.isBattleFinished) return null;

    // Find next living participant
    let p = this.turnQueue.shift();
    while (p && p.battler.hp <= 0) {
         p = this.turnQueue.shift();
    }

    if (!p) return null; // Queue empty, round over

    const { battler, index, isEnemy } = p;
    const events = [];

    // --- Passive Effects (e.g., Parasite) ---
    if (!isEnemy) {
         const parasiteDrain = battler.getPassiveValue("PARASITE");
         if (parasiteDrain > 0) {
             // Target the ally in the same column (Front <-> Back swap)
             // 0 <-> 2, 1 <-> 3
             const targetIndex = (index + 2) % 4;
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

    // Re-check death after passives (though unlikely to die from drain source)
    if (battler.hp <= 0) return events; // Return whatever passive events happened

    // --- Select Target ---
    let target = null;
    if (isEnemy) {
        // Enemies target random living party member
        const possibleTargets = this.party.members.slice(0, 4).filter(m => m.hp > 0);
        if (possibleTargets.length > 0) {
            target = possibleTargets[randInt(0, possibleTargets.length - 1)];
        }
    } else {
        // Party targets first living enemy
        target = this.enemies.find(e => e.hp > 0);
    }

    if (!target) {
        // No valid targets, maybe battle is over?
        // Determine if victory/defeat has happened
        if (isEnemy && this.party.members.slice(0, 4).every(m => m.hp <= 0)) {
             // Battle will end below
        } else if (!isEnemy && this.enemies.every(e => e.hp <= 0)) {
             // Battle will end below
        } else {
             return events; // Nothing to do
        }
    } else {
        // --- Execute Action ---
        const skillId = battler.skills && battler.skills.length ? battler.skills[randInt(0, battler.skills.length - 1)] : null;
        const skill = skillId ? this.dataManager.skills[skillId] : null;

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

                 // SHATTER PASSIVE LOGIC
                 const shatterBonus = battler.getPassiveValue("SHATTER");
                 if (shatterBonus > 0) {
                     // Check if target is a Skeleton (by ID or some tag. Using ID includes for now)
                     // If we want generic, we might need 'type' or 'race' in actor data.
                     // For now, check if name contains Skeleton or Bone Knight
                     if (target.name.toLowerCase().includes("skeleton") || target.name.toLowerCase().includes("bone knight")) {
                         skillDmg *= shatterBonus;
                         events.push({ type: 'info', msg: `[Passive] Shatter! Damage multiplied.` });
                     }
                 }

                 // Apply damage immediately
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
               } else if (effect.type === "hp_drain") {
                 const formula = effect.formula.replace("a.level", battler.level);
                 let skillDmg = Math.round(eval(formula) * boost);
                 if (skillDmg < 1) skillDmg = 1;

                 const hpBeforeTarget = target.hp;
                 target.hp = Math.max(0, target.hp - skillDmg);

                 const drainAmt = Math.round(skillDmg * (effect.drainPct || 0.5));
                 const hpBeforeSource = battler.hp;
                 battler.hp = Math.min(battler.maxHp, battler.hp + drainAmt);

                 events.push({
                     type: 'damage',
                     battler: battler,
                     target: target,
                     value: skillDmg,
                     hpBefore: hpBeforeTarget,
                     hpAfter: target.hp,
                     msg: `  ${target.name} takes ${skillDmg} damage (Drain).`
                 });

                 events.push({
                     type: 'heal',
                     battler: battler,
                     value: drainAmt,
                     hpBefore: hpBeforeSource,
                     hpAfter: battler.hp,
                     msg: `  ${battler.name} drains ${drainAmt} HP.`
                 });

                 // BLOOD COURT PASSIVE (Overheal share)
                 if (!isEnemy) {
                    const bloodCourt = battler.getPassiveValue("BLOOD_COURT");
                    if (bloodCourt > 0 && battler.hp === battler.maxHp) {
                        // Just share a flat amount or the overflow?
                        // Let's say if we are at max HP, we share the healing amount to others.
                        // Or just "Excess healing flows to party".
                        // Logic: calculate potential healing vs actual.
                        // Actually, simpler: if at maxHP, heal teammates by 'value' or split drainAmt
                        const shareAmount = Math.max(1, Math.floor(drainAmt / 2));
                        const allies = this.party.members.slice(0, 4).filter(m => m !== battler && m.hp > 0);
                        allies.forEach(ally => {
                             ally.hp = Math.min(ally.maxHp, ally.hp + shareAmount);
                        });
                        if (allies.length > 0) {
                             events.push({ type: 'info', msg: `[Passive] Blood Court shares ${shareAmount} HP to allies.` });
                        }
                    }
                 }

               } else if (effect.type === "hp_heal") {
                    const formula = effect.formula.replace("a.level", battler.level).replace("a.maxHp", battler.maxHp);
                    let heal = Math.round(eval(formula) * boost);
                    if (heal < 0) heal = 0;

                    // Healing targets (skill definition targets ally-any usually)
                    // Wait, current logic only sets `target` to enemy or self implicitly above?
                    // We need correct targeting for healing skills.
                    // Existing logic: "Select Target" block selects enemy/party based on isEnemy.
                    // This is a limitation of the current BattleManager. It assumes offense.
                    // FIX: If skill is friendly, retarget.

                    let realTarget = target;
                    if (skill.target === 'ally-any' || skill.target === 'self') {
                        if (skill.target === 'self') {
                            realTarget = battler;
                        } else {
                            // Find lowest HP ally? Or random?
                            const allies = isEnemy ? this.enemies : this.party.members.slice(0, 4);
                            // Simple AI: lowest % HP
                            let lowest = null;
                            let minPct = 1.1;
                            allies.forEach(a => {
                                if (a.hp > 0) {
                                    const pct = a.hp / a.maxHp;
                                    if (pct < minPct) {
                                        minPct = pct;
                                        lowest = a;
                                    }
                                }
                            });
                            realTarget = lowest || battler;
                        }
                    }

                    const hpBefore = realTarget.hp;
                    realTarget.hp = Math.min(realTarget.maxHp, realTarget.hp + heal);

                    events.push({
                        type: 'heal',
                        target: realTarget,
                        value: heal,
                        hpBefore: hpBefore,
                        hpAfter: realTarget.hp,
                        msg: `  ${realTarget.name} heals ${heal} HP.`
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

             // SHATTER PASSIVE CHECK FOR NORMAL ATTACK TOO
             const shatterBonus = battler.getPassiveValue("SHATTER");
             if (shatterBonus > 0) {
                 if (target.name.toLowerCase().includes("skeleton") || target.name.toLowerCase().includes("bone knight")) {
                     dmg *= shatterBonus;
                     events.push({ type: 'info', msg: `[Passive] Shatter! Damage multiplied.` });
                 }
             }

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
    }

    // --- Check Battle End ---
    const anyEnemyAlive = this.enemies.some((e) => e.hp > 0);
    const anyPartyAlive = this.party.members.slice(0, 4).some((p) => p.hp > 0);

    if (!anyPartyAlive) {
      this.isBattleFinished = true;
      this.turnQueue = []; // Stop further turns
      events.push({ type: "end", result: "defeat", msg: this.dataManager.terms.battle.your_party_collapses });
    } else if (!anyEnemyAlive) {
      this.isBattleFinished = true;
      this.isVictoryPending = true;
      this.turnQueue = []; // Stop further turns
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

if (typeof window !== 'undefined' && window.location.search.includes("test=true")) {
    window.DataManager = DataManager;
    window.BattleManager = BattleManager;
    window.SceneManager = SceneManager;
}
