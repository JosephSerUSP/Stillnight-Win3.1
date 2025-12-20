import { Window_Base } from "./base.js";
import { AudioAdapter } from "../../adapters/audio_adapter.js";

/**
 * @class Window_AudioPlayer
 * @description Debug window for playing Sound and Music.
 */
export class Window_AudioPlayer extends Window_Base {
    constructor() {
        super('center', 'center', 400, 500, { title: "Audio Player", id: "audio-player" });

        this.bodyEl = this.createPanel();
        this.bodyEl.style.flexGrow = "1";
        this.bodyEl.style.display = "flex";
        this.bodyEl.style.flexDirection = "column";
        this.bodyEl.style.overflow = "hidden";

        // Lists Container
        const listsContainer = document.createElement("div");
        listsContainer.style.flex = "1";
        listsContainer.style.display = "flex";
        listsContainer.style.gap = "4px";
        listsContainer.style.overflow = "hidden";
        listsContainer.style.minHeight = "0"; // enable flex scrolling
        this.bodyEl.appendChild(listsContainer);

        // Music List
        const musicCol = document.createElement("div");
        musicCol.style.flex = "1";
        musicCol.style.display = "flex";
        musicCol.style.flexDirection = "column";
        musicCol.style.overflow = "hidden";
        const musicHeader = document.createElement("div");
        musicHeader.textContent = "Music (MIDI)";
        musicHeader.className = "window-header";
        musicCol.appendChild(musicHeader);
        this.musicList = document.createElement("div");
        this.musicList.style.flex = "1";
        this.musicList.style.overflowY = "auto";
        this.musicList.style.border = "1px solid var(--window-border)";
        musicCol.appendChild(this.musicList);
        listsContainer.appendChild(musicCol);

        // SFX List
        const sfxCol = document.createElement("div");
        sfxCol.style.flex = "1";
        sfxCol.style.display = "flex";
        sfxCol.style.flexDirection = "column";
        sfxCol.style.overflow = "hidden";
        const sfxHeader = document.createElement("div");
        sfxHeader.textContent = "SFX";
        sfxHeader.className = "window-header";
        sfxCol.appendChild(sfxHeader);
        this.sfxList = document.createElement("div");
        this.sfxList.style.flex = "1";
        this.sfxList.style.overflowY = "auto";
        this.sfxList.style.border = "1px solid var(--window-border)";
        sfxCol.appendChild(this.sfxList);
        listsContainer.appendChild(sfxCol);

        // Terminal / Controls
        this.terminal = document.createElement("div");
        this.terminal.style.marginTop = "8px";
        this.terminal.style.padding = "4px";
        this.terminal.style.backgroundColor = "#000";
        this.terminal.style.border = "1px inset #888";
        this.terminal.style.fontFamily = "monospace";
        this.terminal.style.fontSize = "10px";
        this.terminal.style.display = "flex";
        this.terminal.style.flexDirection = "column";
        this.terminal.style.gap = "2px";

        this.terminalTrack = document.createElement("div");
        this.terminalTrack.textContent = "Track: --";
        this.terminal.appendChild(this.terminalTrack);

        this.terminalTime = document.createElement("div");
        this.terminalTime.textContent = "Time: 00:00 / 00:00";
        this.terminal.appendChild(this.terminalTime);

        // Progress Bar
        const progressBar = document.createElement("div");
        progressBar.style.height = "4px";
        progressBar.style.backgroundColor = "#333";
        progressBar.style.marginTop = "2px";
        this.progressBarFill = document.createElement("div");
        this.progressBarFill.style.height = "100%";
        this.progressBarFill.style.width = "0%";
        this.progressBarFill.style.backgroundColor = "#0f0";
        progressBar.appendChild(this.progressBarFill);
        this.terminal.appendChild(progressBar);

        this.bodyEl.appendChild(this.terminal);

        // Footer Controls
        this.btnPlay = this.addButton("Play", () => this.togglePlay());
        this.addButton("Stop", () => {
             AudioAdapter.stopMusic();
             this.refreshTerminal();
        });
        this.addButton("Prev", () => this.playPrevious());
        this.addButton("Next", () => this.playNext());
        this.addButton("Close", () => this.onUserClose());

        this.musicKeys = [];
        this.sfxKeys = [];
        this.currentSelection = { type: null, key: null };

        this.populateLists();

        // Update loop for timer
        this.updateInterval = setInterval(() => this.refreshTerminal(), 500);
    }

    close() {
        super.close();
        if (this.updateInterval) clearInterval(this.updateInterval);
    }

    refreshTerminal() {
        if (AudioAdapter.isMusicPlaying()) {
            // We can't access music player time easily from Adapter without exposing more methods
            // For now, simple playing status
            const key = AudioAdapter.getCurrentMusicKey();
            this.terminalTrack.textContent = `Track: ${key} [Playing]`;
            this.btnPlay.textContent = "Pause";
        } else {
            const key = AudioAdapter.getCurrentMusicKey();
            if (key) {
                 this.terminalTrack.textContent = `Track: ${key} [Paused]`;
                 this.btnPlay.textContent = "Resume";
            } else {
                 this.terminalTrack.textContent = "Track: --";
                 this.btnPlay.textContent = "Play";
            }
        }
    }

    populateLists() {
        // Music
        this.musicKeys = AudioAdapter.getMusicKeys();
        this.musicKeys.forEach(key => {
            const row = this.createRow(key, () => {
                this.playMusic(key);
            });
            row.dataset.key = key;
            row.dataset.type = 'music';
            this.musicList.appendChild(row);
        });

        // SFX
        this.sfxKeys = AudioAdapter.getSfxKeys();
        this.sfxKeys.forEach(key => {
            const row = this.createRow(key, () => {
                AudioAdapter.play(key);
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
        if (AudioAdapter.getCurrentMusicKey() === key && AudioAdapter.isMusicPlaying()) {
            AudioAdapter.pauseMusic();
        } else if (AudioAdapter.getCurrentMusicKey() === key && !AudioAdapter.isMusicPlaying()) {
            AudioAdapter.resumeMusic();
        } else {
            AudioAdapter.playMusic(key);
        }
        this.updateSelection('music', key);
        this.refreshTerminal();
    }

    togglePlay() {
        if (this.currentSelection.type === 'music') {
             if (AudioAdapter.isMusicPlaying()) {
                 AudioAdapter.pauseMusic();
             } else {
                 if (AudioAdapter.getCurrentMusicKey() === this.currentSelection.key) {
                      AudioAdapter.resumeMusic();
                 } else {
                      AudioAdapter.playMusic(this.currentSelection.key);
                 }
             }
        } else if (this.currentSelection.type === 'sfx') {
             AudioAdapter.play(this.currentSelection.key);
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
            AudioAdapter.play(key);
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
            AudioAdapter.play(key);
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
