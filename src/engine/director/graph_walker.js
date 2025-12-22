export class GraphWalker {
    constructor(graphId, nodeId, variables = {}) {
        this.graphId = graphId;
        this.currentNodeId = nodeId;
        this.variables = variables; // Local scope variables
        this.history = []; // Stack of visited nodes for backtracking if needed
        this.isFinished = false;

        // Transient state for the current node interaction
        this.currentOptions = null; // Stores the filtered list of options presented to UI
    }

    moveTo(nodeId) {
        this.history.push(this.currentNodeId);
        this.currentNodeId = nodeId;
        this.currentOptions = null; // Reset options on move
    }

    finish() {
        this.isFinished = true;
        this.currentOptions = null;
    }
}
