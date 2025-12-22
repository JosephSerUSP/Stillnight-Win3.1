
export class GraphWalker {
    /**
     * @param {string} graphId - ID of the graph (e.g., 'npc_alicia')
     * @param {Object} graphData - The graph definition
     */
    constructor(graphId, graphData) {
        this.graphId = graphId;
        this.data = graphData;
        this.currentNodeId = graphData.initialNode;
        this.history = [];
        this.variables = {}; // Local variables for this session
        this.finished = false;
    }

    /**
     * Moves to the specified node ID.
     * @param {string} nodeId
     */
    moveTo(nodeId) {
        if (!this.data.nodes[nodeId]) {
            console.error(`GraphWalker: Node '${nodeId}' not found in graph '${this.graphId}'`);
            this.finished = true;
            return;
        }

        // Push current node to history before moving
        if (this.currentNodeId) {
            this.history.push(this.currentNodeId);
        }

        this.currentNodeId = nodeId;
    }

    /**
     * Returns the current node object.
     * @returns {Object|null}
     */
    getCurrentNode() {
        if (!this.currentNodeId || this.finished) return null;
        return this.data.nodes[this.currentNodeId];
    }

    /**
     * Sets a local variable.
     * @param {string} key
     * @param {any} value
     */
    setVariable(key, value) {
        this.variables[key] = value;
    }

    /**
     * Gets a local variable.
     * @param {string} key
     * @returns {any}
     */
    getVariable(key) {
        return this.variables[key];
    }
}
