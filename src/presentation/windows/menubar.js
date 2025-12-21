
import { Window_Base } from "./base.js";
import { UI } from "./builder.js";
import { SettingsAdapter } from "../../adapters/settings_adapter.js";
import { Window_Confirm } from "./confirm.js";

/**
 * @class Window_MenuBar
 * @description The main application menu bar.
 */
export class Window_MenuBar extends Window_Base {
    constructor(callbacks = {}) {
        // Full width, fixed height, no frame/title
        super(0, 0, '100%', 24, { embedded: true });

        this.callbacks = callbacks;
        this.activeMenu = null;

        this.element.classList.remove("window-frame");
        this.element.classList.add("menu-bar");
        this.header.style.display = "none";
        this.footer.style.display = "none";

        this.content.style.padding = "0";
        this.content.style.display = "flex";
        this.content.style.flexDirection = "row";
        this.content.style.alignItems = "center";

        this.createMenus();

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (this.activeMenu && !this.element.contains(e.target)) {
                this.closeActiveMenu();
            }
        });
    }

    createMenus() {
        const menus = [
            {
                label: "Game",
                items: [
                    { label: "New Game", action: () => this.onNewGame() },
                    { label: "Save Game", action: () => this.onStub("Save Game") },
                    { label: "Load Game", action: () => this.onStub("Load Game") },
                    { label: "About", action: () => this.onStub("About") }
                ]
            },
            {
                label: "Run",
                items: [
                    { label: "New Run", action: () => this.onNewGame() }, // Stub for now
                    { label: "Reveal All", action: () => this.onRevealAll() },
                    { label: "Teleport", action: () => this.onTeleport() }
                ]
            },
            {
                label: "Party",
                items: [
                    { label: "Inventory (I)", action: () => this.callbacks.onInventory() },
                    { label: "Formation (F)", action: () => this.callbacks.onFormation() },
                    { label: "Quests (Q)", action: () => this.callbacks.onQuests() }
                ]
            },
            {
                label: "Settings",
                items: [
                    { label: "General", action: () => this.callbacks.onSettings() },
                    { label: "Audio", action: () => this.callbacks.onAudioSettings() }
                ]
            },
            {
                label: "Help",
                items: [
                    { label: "General", action: () => this.callbacks.onHelp() }
                ]
            }
        ];

        menus.forEach(menu => {
            const menuContainer = UI.build(this.content, {
                type: 'panel',
                props: {
                    className: 'menu-item-container',
                    style: { position: 'relative' }
                }
            });

            const btn = UI.build(menuContainer, {
                type: 'button',
                props: {
                    className: 'menu-btn',
                    label: menu.label,
                    onClick: (e) => this.toggleMenu(menuContainer, menuList)
                }
            });

            const menuList = UI.build(menuContainer, {
                type: 'panel',
                props: {
                    className: 'menu-dropdown',
                    style: { display: 'none' }
                }
            });

            menu.items.forEach(item => {
                UI.build(menuList, {
                    type: 'button',
                    props: {
                        className: 'menu-dropdown-item',
                        label: item.label,
                        onClick: () => {
                            this.closeActiveMenu();
                            if (item.action) item.action();
                        }
                    }
                });
            });
        });
    }

    toggleMenu(container, list) {
        if (this.activeMenu && this.activeMenu !== list) {
            this.closeActiveMenu();
        }

        if (list.style.display === 'none') {
            list.style.display = 'block';
            container.classList.add('active');
            this.activeMenu = list;
        } else {
            this.closeActiveMenu();
        }
    }

    closeActiveMenu() {
        if (this.activeMenu) {
            this.activeMenu.style.display = 'none';
            this.activeMenu.parentElement.classList.remove('active');
            this.activeMenu = null;
        }
    }

    onNewGame() {
        // Assuming we have access to SceneManager via window or passed in callbacks
        if (this.callbacks.onNewGame) {
            this.callbacks.onNewGame();
        } else {
            console.warn("New Game callback not provided");
        }
    }

    onRevealAll() {
        if (this.callbacks.onRevealAll) {
            this.callbacks.onRevealAll();
        }
    }

    onTeleport() {
        if (this.callbacks.onTeleport) {
            this.callbacks.onTeleport();
        }
    }

    onStub(feature) {
        console.log(`${feature} is not implemented yet.`);
        // Ideally show a simple alert popup
        alert(`${feature} is coming soon!`);
    }
}
