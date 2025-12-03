
import { Window_Base } from "./base.js";
import { SoundManager } from "../managers/index.js";

/**
 * @class Window_AudioPlayer
 * @description A window for playing all available music and sound effects.
 * Accessible from the Settings menu.
 */
export class Window_AudioPlayer extends Window_Base {
    constructor() {
        super('center', 'center', 500, 450, { title: "Audio Player", id: "audio-player-window" });

        this.originalMusicKey = null;
        this.currentSelection = { type: null, key: null };

        // Create main layout
        this.bodyEl = this.createPanel();
        this.bodyEl.className = "window-panel audio-player-body";
        this.bodyEl.style.flexGrow = "1";
        this.bodyEl.style.display = "grid";
        this.bodyEl.style.gridTemplateColumns = "1fr 1fr";
        this.bodyEl.style.gap = "8px";
        this.bodyEl.style.overflow = "hidden";

        // Music Column
        this.musicCol = document.createElement("div");
        this.musicCol.style.display = "flex";
        this.musicCol.style.flexDirection = "column";
        this.musicCol.style.overflow = "hidden";

        const musicHeader = document.createElement("div");
        musicHeader.className = "window-header";
        musicHeader.textContent = "Music";
        this.musicCol.appendChild(musicHeader);

        this.musicList = document.createElement("div");
        this.musicList.className = "window-content";
        this.musicList.style.flex = "1";
        this.musicList.style.overflowY = "auto";
        this.musicList.style.border = "2px solid var(--bezel-dark)";
        this.musicList.style.borderTop = "none"; // Header has border
        this.musicCol.appendChild(this.musicList);

        // SFX Column
        this.sfxCol = document.createElement("div");
        this.sfxCol.style.display = "flex";
        this.sfxCol.style.flexDirection = "column";
        this.sfxCol.style.overflow = "hidden";

        const sfxHeader = document.createElement("div");
        sfxHeader.className = "window-header";
        sfxHeader.textContent = "Sound Effects";
        this.sfxCol.appendChild(sfxHeader);

        this.sfxList = document.createElement("div");
        this.sfxList.className = "window-content";
        this.sfxList.style.flex = "1";
        this.sfxList.style.overflowY = "auto";
        this.sfxList.style.border = "2px solid var(--bezel-dark)";
        this.sfxList.style.borderTop = "none";
        this.sfxCol.appendChild(this.sfxList);

        this.bodyEl.appendChild(this.musicCol);
        this.bodyEl.appendChild(this.sfxCol);

        // Footer controls
        this.createFooterControls();

        // Populate lists
        this.populateLists();
    }

    createFooterControls() {
        this.btnStop = this.addButton("Stop Audio", () => {
            SoundManager.stopMusic();
            this.updateSelection(null, null);
        });

        this.btnClose = this.addButton("Close", () => this.onUserClose());
    }

    onOpen() {
        super.onOpen();
        // Store current music to resume later
        this.originalMusicKey = SoundManager._currentMusicKey;
    }

    close() {
        // Resume original music if it changed
        if (this.originalMusicKey && SoundManager._currentMusicKey !== this.originalMusicKey) {
            SoundManager.playMusic(this.originalMusicKey);
        } else if (!this.originalMusicKey) {
             // If there was no music, stop whatever we are playing
             SoundManager.stopMusic();
        }

        super.close();
    }

    populateLists() {
        // Music
        // Accessing private static _midiData from SoundManager for list
        const musicKeys = Array.from(SoundManager._midiData.keys()).sort();
        musicKeys.forEach(key => {
            const row = this.createRow(key, () => {
                SoundManager.playMusic(key);
                this.updateSelection('music', key);
            });
            row.dataset.key = key;
            row.dataset.type = 'music';
            this.musicList.appendChild(row);
        });

        // SFX
        // Accessing private static _soundMap or _buffers
        // _soundMap has the config.
        const sfxKeys = Object.keys(SoundManager._soundMap).sort();
        sfxKeys.forEach(key => {
            const row = this.createRow(key, () => {
                SoundManager.play(key);
                this.updateSelection('sfx', key);
            });
            row.dataset.key = key;
            row.dataset.type = 'sfx';
            this.sfxList.appendChild(row);
        });
    }

    createRow(label, onClick) {
        const row = document.createElement("div");
        row.className = "window-row";
        row.textContent = label;
        row.style.cursor = "pointer";
        row.style.padding = "2px 4px";

        row.addEventListener("click", () => {
            onClick();
        });

        return row;
    }

    updateSelection(type, key) {
        this.currentSelection = { type, key };

        // Update UI highlights
        const allRows = this.bodyEl.querySelectorAll(".window-row");
        allRows.forEach(r => r.classList.remove("selected"));

        if (type && key) {
            const selector = `.window-row[data-type="${type}"][data-key="${key}"]`;
            const selected = this.bodyEl.querySelector(selector);
            if (selected) selected.classList.add("selected");
        }
    }
}
