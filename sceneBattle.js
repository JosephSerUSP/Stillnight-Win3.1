import { Scene_Base } from "./sceneBase.js";
import { Window_Battle } from "./windows.js";
import { BattleManager, SoundManager } from "./managers.js";
import { SceneManager } from "./sceneManager.js";

/**
 * @class Scene_Battle
 * @description Handles the battle screen.
 */
export class Scene_Battle extends Scene_Base {
  /**
   * @param {import("./objects.js").Game_Party} party
   * @param {Array<import("./objects.js").Game_Battler>} enemies
   * @param {import("./managers.js").DataManager} dataManager
   * @param {Function} onVictory - Callback when battle is won.
   */
  constructor(party, enemies, dataManager, onVictory) {
    super(dataManager);
    this.party = party;
    this.enemies = enemies;
    this.onVictory = onVictory;
    this.battleManager = new BattleManager(this.party, this.dataManager);
    this.battleBusy = false;
  }

  create() {
    super.create();
    this.battleWindow = new Window_Battle();
    this.windowLayer.addChild(this.battleWindow);

    this.battleWindow.btnRound.addEventListener("click", this.resolveBattleRound.bind(this));
    this.battleWindow.btnFlee.addEventListener("click", this.attemptFlee.bind(this));
    this.battleWindow.btnVictory.addEventListener("click", this.onBattleVictoryClick.bind(this));
    this.battleWindow.btnClose.addEventListener("click", this.attemptFlee.bind(this));
  }

  start() {
    this.battleManager.setup(this.enemies);
    this.battleWindow.open();
    this.battleWindow.logEnemyEmergence(this.enemies, this.dataManager.terms.battle);
    this.applyBattleStartPassives();
    this.renderBattleAscii();
    SoundManager.beep(350, 200);
  }

  renderBattleAscii() {
    if (!this.battleManager) return;
    const enemies = this.battleManager.enemies;
    this.battleWindow.refresh(enemies, this.party.members.slice(0, 4));
  }

  async resolveBattleRound() {
    if (!this.battleManager || this.battleManager.isBattleFinished || this.battleBusy) return;

    this.battleBusy = true;
    this.battleWindow.btnRound.disabled = true;
    this.battleWindow.btnFlee.disabled = true;

    const events = this.battleManager.resolveRound();
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    SoundManager.beep(300, 80);

    for (const event of events) {
      if (event.battler && event.battler.hp <= 0) continue;

      if (event.battler) {
        await this.animateBattlerName(event.battler);
      }

      this.battleWindow.appendLog(event.msg);

      let oldHp = 0;
      if (event.target) {
        oldHp = event.target.hp + (event.value || 0);
      }

      this.renderBattleAscii();

      if (event.type === 'damage' && event.target) {
        this.animateBattler(event.target, 'flash');
        await this.animateBattleHpGauge(event.target, oldHp);
      } else if (event.type === 'passive_drain') {
        this.animateBattler(event.target, 'flash');
        await this.animateBattleHpGauge(event.target, oldHp);
        await this.animateBattleHpGauge(event.source, event.source.hp - event.value);
      }
      else if (event.type === 'end') {
        if (event.result === 'defeat') {
          // Handle defeat (currently just log, maybe invoke game over scene later)
        }
      }

      await delay(300);
    }

    this.renderBattleAscii();

    if (this.battleManager.isVictoryPending) {
      this.battleWindow.btnVictory.style.display = "inline-block";
    }

    if (!this.battleManager.isBattleFinished) {
      this.battleWindow.btnRound.disabled = false;
      this.battleWindow.btnFlee.disabled = false;
      this.battleWindow.appendLog("Use Resolve Round or Flee.");
    }

    this.battleBusy = false;
  }

  animateBattleHpGauge(battler, oldHp) {
    return new Promise((resolve) => {
      const duration = 500;
      const interval = 30;
      let elapsed = 0;

      const interpolator = () => {
        elapsed += interval;
        const progress = Math.min(elapsed / duration, 1);
        const currentHp = Math.round(oldHp + (battler.hp - oldHp) * progress);
        this.renderBattleAscii();
        if (progress < 1) {
          setTimeout(interpolator, interval);
        } else {
          resolve();
        }
      };
      interpolator();
    });
  }

  animateBattler(battler, animationType) {
    const battlerId = `battler-${battler.name.replace(/\s/g, '-')}`;
    const battlerElement = this.battleWindow.viewportEl.querySelector(`#${battlerId}`);
    if (battlerElement) {
      battlerElement.classList.add(animationType === 'flash' ? 'blink' : 'shake');
      setTimeout(() => {
        battlerElement.classList.remove('blink', 'shake');
      }, 200);
    }
  }

  animateBattlerName(battler) {
    return new Promise((resolve) => {
      const originalName = battler.name;
      let frame = 0;
      const maxFrames = 10;
      const interval = 30;
      const animator = () => {
        if (frame >= maxFrames) {
          battler.name = originalName;
          this.renderBattleAscii();
          resolve();
          return;
        }
        let newName = "";
        for (let i = 0; i < originalName.length; i++) {
          newName += (i === frame % originalName.length) ? originalName[i].toLowerCase() : originalName[i];
        }
        battler.name = newName;
        this.renderBattleAscii();
        frame++;
        setTimeout(animator, interval);
      };
      animator();
    });
  }

  getFleeChance() {
    let baseChance = 0.5;
    this.party.members.forEach((member) => {
      baseChance += member.getPassiveValue("FLEE_CHANCE_BONUS");
    });
    return Math.max(0, Math.min(1, baseChance));
  }

  attemptFlee() {
    if (Math.random() < this.getFleeChance()) {
      this.battleWindow.appendLog("[Battle] You successfully fled!");
      setTimeout(() => {
        SceneManager.pop();
      }, 500);
    } else {
      this.battleWindow.appendLog("You failed to flee!");
      this.resolveBattleRound(); // Penalty turn or just wait? Original logic just logged it.
    }
  }

  applyBattleStartPassives() {
    this.party.members.forEach((member) => {
      if (member.hp > 0) {
        const damage = member.getPassiveValue("BATTLE_START_DAMAGE");
        if (damage > 0) {
          const target = this.battleManager.enemies.find((e) => e.hp > 0);
          if (target) {
            target.hp = Math.max(0, target.hp - damage);
            this.battleWindow.appendLog(`[Passive] ${member.name} hits ${target.name} for ${damage}.`);
          }
        }
      }
    });
  }

  onBattleVictoryClick() {
    if (!this.battleManager || !this.battleManager.isVictoryPending) return;

    // Logic for rewards is mostly calculated here to display, but applying them
    // permanently is done.
    const enemies = this.battleManager.enemies;
    let totalGold = enemies.reduce((sum, e) => sum + (e.gold || 0), 0);
    const totalXp = enemies.reduce((sum, e) => sum + Math.floor(e.level * (e.expGrowth * 0.5) + 8), 0);

    const living = this.party.members.slice(0, 4).filter((p) => p.hp > 0);
    living.forEach((m) => {
      const goldBonus = m.getPassiveValue("GOLD_DIGGER");
      if (goldBonus > 0) totalGold += goldBonus;
    });

    this.party.gold += totalGold;
    // XP gain handled by caller or here? Original handled it in Scene_Map.
    // We should handle it here since we have the party.
    const share = living.length > 0 ? Math.max(1, Math.floor(totalXp / living.length)) : 0;

    // We need a way to log to the MAP log, but we are in Battle Scene.
    // The victory callback can handle the persistent logging.

    living.forEach(m => this.gainXp(m, share));

    this.battleManager.isVictoryPending = false;
    this.battleWindow.btnVictory.style.display = "none";

    if (this.onVictory) {
      this.onVictory({ gold: totalGold, xp: totalXp });
    }

    SoundManager.beep(900, 200);
    SceneManager.pop();
  }

  gainXp(member, amount) {
    if (!member || amount <= 0) return;
    member.xp = (member.xp || 0) + amount;
    while (member.xp >= member.xpNeeded(member.level)) {
      member.xp -= member.xpNeeded(member.level);
      member.level++;
      member.maxHp += 3; // Simplified for internal leveling
      member.hp = member.maxHp;
    }
  }
}