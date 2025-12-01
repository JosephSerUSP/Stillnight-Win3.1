import { Window_Base } from "./base.js";

/**
 * @class Window_Selectable
 * @extends Window_Base
 * @description A window that displays a list of selectable items.
 * Handles event delegation for clicks and manages selection state.
 */
export class Window_Selectable extends Window_Base {
    constructor(x, y, width, height, options = {}) {
        super(x, y, width, height, options);
        this._index = -1;
        this._data = [];
        this._handlers = {};

        // Event Delegation
        this.content.addEventListener("click", this.onClick.bind(this));
    }

    /**
     * Sets a handler for a specific action.
     * @param {string} symbol
     * @param {Function} method
     */
    setHandler(symbol, method) {
        this._handlers[symbol] = method;
    }

    /**
     * Calls a handler for the given symbol.
     * @param {string} symbol
     * @param {...any} args
     */
    callHandler(symbol, ...args) {
        if (this._handlers[symbol]) {
            this._handlers[symbol](...args);
        }
    }

    /**
     * Selects an item by index.
     * @param {number} index
     */
    select(index) {
        if (this._index === index) return;

        if (this._index >= 0) {
            const prev = this.content.querySelector(`[data-index="${this._index}"]`);
            if (prev) prev.classList.remove("selected");
        }

        this._index = index;

        if (this._index >= 0) {
            const curr = this.content.querySelector(`[data-index="${this._index}"]`);
            if (curr) curr.classList.add("selected");
            this.callHandler('select', this.item());
        }
    }

    deselect() {
        this.select(-1);
    }

    item() {
        return this._data && this._index >= 0 ? this._data[this._index] : null;
    }

    onClick(e) {
        const itemEl = e.target.closest('[data-index]');
        if (!itemEl) return;

        const index = parseInt(itemEl.dataset.index, 10);
        this.select(index);

        const actionEl = e.target.closest('[data-action]');
        if (actionEl && itemEl.contains(actionEl)) {
            const action = actionEl.dataset.action;
            this.callHandler(action, this._data[index], index);
        } else {
            this.callHandler('click', this._data[index], index);
        }
    }

    setData(data) {
        this._data = data;
        this.refresh();
    }

    refresh() {
        // To be implemented by subclasses
    }
}
