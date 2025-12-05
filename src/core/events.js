/**
 * @class EventBus
 * @description A simple event bus for decoupling logic from presentation.
 */
export class EventBus {
  static _handlers = {};

  /**
   * Subscribe to an event.
   * @param {string} event - The event name.
   * @param {Function} handler - The callback function.
   */
  static on(event, handler) {
    if (!this._handlers[event]) {
      this._handlers[event] = [];
    }
    this._handlers[event].push(handler);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event - The event name.
   * @param {Function} handler - The callback function.
   */
  static off(event, handler) {
    if (!this._handlers[event]) return;
    this._handlers[event] = this._handlers[event].filter(h => h !== handler);
  }

  /**
   * Emit an event.
   * @param {string} event - The event name.
   * @param {any} payload - The event data.
   */
  static emit(event, payload) {
    if (!this._handlers[event]) return;
    this._handlers[event].forEach(handler => handler(payload));
  }
}

/**
 * Standard Events Enum
 */
export const Events = {
  LOG_MESSAGE: 'LOG_MESSAGE',
  PLAY_SOUND: 'PLAY_SOUND',
  UPDATE_HUD: 'UPDATE_HUD',
  SHOW_DIALOG: 'SHOW_DIALOG',
  STATUS_CHANGE: 'STATUS_CHANGE',
  MUSIC_CHANGE: 'MUSIC_CHANGE',
  SHOW_RECRUIT: 'SHOW_RECRUIT',
  DIALOG_LOG: 'DIALOG_LOG',
  UPDATE_DIALOG_CHOICES: 'UPDATE_DIALOG_CHOICES',
  START_BATTLE: 'START_BATTLE',
  START_SHOP: 'START_SHOP',
  GAIN_XP: 'GAIN_XP',
  APPLY_PASSIVES: 'APPLY_PASSIVES',
  CLOSE_DIALOG: 'CLOSE_DIALOG',
  CLOSE_RECRUIT: 'CLOSE_RECRUIT',
  CHECK_PERMADEATH: 'CHECK_PERMADEATH',
};
