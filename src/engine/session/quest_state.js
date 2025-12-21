/**
 * @class QuestState
 * @description Stores runtime quest progress. Pure data container for save/load.
 */
export class QuestState {
  constructor() {
    /**
     * Map of questId -> { status, acceptedAt, completedAt }
     * Status can be 'available', 'active', 'completed'.
     * @type {Record<string, {status: string, acceptedAt?: number, completedAt?: number}>}
     */
    this.entries = {};
  }
}
