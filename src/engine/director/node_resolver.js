export class NodeResolver {
    constructor(registry) {
        this.registry = registry; // Access to data (e.g., npcs, events)
    }

    getGraph(graphId) {
        // Assumes registry has a collection of graphs (e.g. npcs)
        // In the future, this might fetch from a unified 'dialogues' collection
        return this.registry.get('npcs')[graphId] || this.registry.get('dialogues')[graphId];
    }

    getNode(graphId, nodeId) {
        const graph = this.getGraph(graphId);
        if (!graph) return null;
        return graph.nodes[nodeId];
    }
}
