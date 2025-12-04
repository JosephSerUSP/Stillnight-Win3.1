import { Window_Base } from "./base.js";
import { SoundManager } from "../managers/index.js";
import { elementToAscii } from "../core/utils.js";
import { createGauge } from "./utils.js";

/**
 * @class Window_AudioPlayer
 * @description A window for playing all available music and sound effects.
 * Accessible from the Settings menu.
 */
export class Window_AudioPlayer extends Window_Base {
    constructor() {
        super('center', 'center', 500, 500, { title: "Audio Player", id: "audio-player-window" });

        this.originalMusicKey = null;
        this.currentSelection = { type: null, key: null };
        this.musicKeys = [];
        this.sfxKeys = [];

        // Create main layout
        this.bodyEl = this.createPanel();
        this.bodyEl.className = "window-panel audio-player-body";
        this.bodyEl.style.flexGrow = "1";
        this.bodyEl.style.display = "flex";
        this.bodyEl.style.flexDirection = "column";
        this.bodyEl.style.gap = "8px";
        this.bodyEl.style.overflow = "hidden";

        // Terminal Section
        this.createTerminal();

        // Lists Container
        this.listsContainer = document.createElement("div");
        this.listsContainer.style.display = "grid";
        this.listsContainer.style.gridTemplateColumns = "1fr 1fr";
        this.listsContainer.style.gap = "8px";
        this.listsContainer.style.flex = "1";
        this.listsContainer.style.minHeight = "0"; // Crucial for scrolling
        this.bodyEl.appendChild(this.listsContainer);

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
        this.musicList.style.borderTop = "none";
        this.musicList.style.minHeight = "0"; // Crucial for nested flex scrolling
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
        this.sfxList.style.minHeight = "0";
        this.sfxCol.appendChild(this.sfxList);

        this.listsContainer.appendChild(this.musicCol);
        this.listsContainer.appendChild(this.sfxCol);

        // Footer controls
        this.createFooterControls();

        // Populate lists
        this.populateLists();
    }

    createTerminal() {
        this.terminal = document.createElement("div");
        this.terminal.style.backgroundColor = "var(--content-bg)";
        this.terminal.style.border = "2px solid var(--bezel-dark)";
        this.terminal.style.padding = "8px";
        this.terminal.style.display = "flex";
        this.terminal.style.flexDirection = "column";
        this.terminal.style.gap = "4px";

        // Track Name
        this.terminalTrack = document.createElement("div");
        this.terminalTrack.textContent = "Track: --";
        this.terminalTrack.style.fontWeight = "bold";
        this.terminalTrack.style.whiteSpace = "nowrap";
        this.terminalTrack.style.overflow = "hidden";
        this.terminalTrack.style.textOverflow = "ellipsis";
        this.terminal.appendChild(this.terminalTrack);

        // Time / Duration
        this.terminalTime = document.createElement("div");
        this.terminalTime.textContent = "Time: 00:00 / 00:00";
        this.terminalTime.style.fontFamily = "monospace";
        this.terminal.appendChild(this.terminalTime);

        // Progress Bar (Visual)
        // Use standard gauge style
        const { container: gaugeContainer, fill: gaugeFill } = createGauge({
             height: "12px",
             color: "var(--gauge-hp)",
             bgColor: "var(--bezel-dark)",
             className: "audio-progress-bar"
        });

        this.progressBarContainer = gaugeContainer;
        this.progressBarFill = gaugeFill;
        this.progressBarContainer.style.marginTop = "4px";
        this.progressBarContainer.style.border = "1px solid var(--bezel-light)";

        this.terminal.appendChild(this.progressBarContainer);
        this.bodyEl.appendChild(this.terminal);
    }

    createFooterControls() {
        // Prev
        this.btnPrev = this.addButton("Prev", () => this.playPrevious());

        // Play/Pause/Stop Logic is weird because we have two lists.
        // If music is selected: Toggle Play/Pause.
        // If SFX is selected: Replay SFX.
        // We'll treat "Play/Stop" as a Music toggle primarily, unless SFX is focused?
        // User asked for "Play / Stop buttons".

        this.btnPlay = this.addButton("Play", () => this.togglePlay());
        this.btnStop = this.addButton("Stop", () => {
            SoundManager.stopMusic();
            this.refreshTerminal();
        });

        this.btnNext = this.addButton("Next", () => this.playNext());

        // Spacer
        const spacer = document.createElement("div");
        spacer.style.flex = "1";
        this.footer.appendChild(spacer);

        this.btnClose = this.addButton("Close", () => this.onUserClose());
    }

    open() {
        super.open();
        // Store current music to resume later
        this.originalMusicKey = SoundManager._currentMusicKey;
        if (this.originalMusicKey) {
            this.updateSelection('music', this.originalMusicKey);
        }
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

    update() {
        super.update();
        if (this.currentSelection.type === 'music' && SoundManager.isMusicPlaying()) {
            this.refreshTerminal();
        } else if (this.currentSelection.type === 'music' && !SoundManager.isMusicPlaying()) {
             // Maybe paused?
             this.refreshTerminal();
        }
    }

    refreshTerminal() {
        if (this.currentSelection.type === 'music' && this.currentSelection.key) {
            this.terminalTrack.textContent = `Track: ${this.currentSelection.key}`;

            const time = SoundManager.getMusicTime();
            const duration = SoundManager.getMusicDuration();

            this.terminalTime.textContent = `Time: ${this.formatTime(time)} / ${this.formatTime(duration)}`;

            const pct = duration > 0 ? (time / duration) * 100 : 0;
            this.progressBarFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;

            this.btnPlay.textContent = SoundManager.isMusicPlaying() ? "Pause" : "Play";
        } else if (this.currentSelection.type === 'sfx') {
            this.terminalTrack.textContent = `SFX: ${this.currentSelection.key}`;
            this.terminalTime.textContent = "Time: --:-- / --:--";
            this.progressBarFill.style.width = "0%";
            this.btnPlay.textContent = "Play";
        } else {
            this.terminalTrack.textContent = "Track: --";
            this.terminalTime.textContent = "Time: 00:00 / 00:00";
            this.progressBarFill.style.width = "0%";
            this.btnPlay.textContent = "Play";
        }
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    populateLists() {
        // Music
        this.musicKeys = Array.from(SoundManager._midiData.keys()).sort();
        this.musicKeys.forEach(key => {
            const row = this.createRow(key, () => {
                this.playMusic(key);
            });
            row.dataset.key = key;
            row.dataset.type = 'music';
            this.musicList.appendChild(row);
        });

        // SFX
        this.sfxKeys = Object.keys(SoundManager._soundMap).sort();
        this.sfxKeys.forEach(key => {
            const row = this.createRow(key, () => {
                SoundManager.play(key);
                this.updateSelection('sfx', key);
                this.refreshTerminal();
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

    playMusic(key) {
        if (SoundManager._currentMusicKey === key && SoundManager.isMusicPlaying()) {
            SoundManager.pauseMusic();
        } else if (SoundManager._currentMusicKey === key && !SoundManager.isMusicPlaying()) {
            SoundManager.resumeMusic();
        } else {
            SoundManager.playMusic(key);
        }
        this.updateSelection('music', key);
        this.refreshTerminal();
    }

    togglePlay() {
        if (this.currentSelection.type === 'music') {
             if (SoundManager.isMusicPlaying()) {
                 SoundManager.pauseMusic();
             } else {
                 if (SoundManager._currentMusicKey === this.currentSelection.key) {
                      SoundManager.resumeMusic();
                 } else {
                      SoundManager.playMusic(this.currentSelection.key);
                 }
             }
        } else if (this.currentSelection.type === 'sfx') {
             SoundManager.play(this.currentSelection.key);
        }
        this.refreshTerminal();
    }

    playNext() {
        if (!this.currentSelection.type) {
            // Default to first music if nothing selected
            if (this.musicKeys.length > 0) {
                this.playMusic(this.musicKeys[0]);
            }
            return;
        }

        if (this.currentSelection.type === 'music') {
            let idx = this.musicKeys.indexOf(this.currentSelection.key);
            if (idx === -1) idx = 0;
            else idx = (idx + 1) % this.musicKeys.length;
            this.playMusic(this.musicKeys[idx]);
        } else if (this.currentSelection.type === 'sfx') {
            let idx = this.sfxKeys.indexOf(this.currentSelection.key);
            if (idx === -1) idx = 0;
            else idx = (idx + 1) % this.sfxKeys.length;
            const key = this.sfxKeys[idx];
            SoundManager.play(key);
            this.updateSelection('sfx', key);
            this.refreshTerminal();
        }
    }

    playPrevious() {
        if (!this.currentSelection.type) {
            // Default to first music if nothing selected
            if (this.musicKeys.length > 0) {
                this.playMusic(this.musicKeys[0]);
            }
            return;
        }

        if (this.currentSelection.type === 'music') {
            let idx = this.musicKeys.indexOf(this.currentSelection.key);
            if (idx === -1) idx = 0;
            else idx = (idx - 1 + this.musicKeys.length) % this.musicKeys.length;
            this.playMusic(this.musicKeys[idx]);
        } else if (this.currentSelection.type === 'sfx') {
            let idx = this.sfxKeys.indexOf(this.currentSelection.key);
            if (idx === -1) idx = 0;
            else idx = (idx - 1 + this.sfxKeys.length) % this.sfxKeys.length;
            const key = this.sfxKeys[idx];
            SoundManager.play(key);
            this.updateSelection('sfx', key);
            this.refreshTerminal();
        }
    }

    updateSelection(type, key) {
        this.currentSelection = { type, key };

        // Update UI highlights
        const allRows = this.bodyEl.querySelectorAll(".window-row");
        allRows.forEach(r => r.classList.remove("selected"));

        if (type && key) {
            const selector = `.window-row[data-type="${type}"][data-key="${key}"]`;
            const selected = this.bodyEl.querySelector(selector);
            if (selected) {
                selected.classList.add("selected");
                selected.scrollIntoView({ block: "nearest" });
            }
        }
        this.refreshTerminal();
    }
}
