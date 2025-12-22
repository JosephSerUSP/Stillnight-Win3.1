import { GraphWalker } from "../graph/walker.js";
import { TransitionLogic } from "../graph/transition.js";

export class DirectorSystem {
    constructor() {
        this.walker = null;
        this.observer = null;
        this.session = null;
    }

    /**
     * Starts a dialogue graph.
     * @param {string} graphId
     * @param {Object} graphData
     * @param {Object} session
     * @param {Object} observer - { onNode: fn, onEnd: fn, onAction: fn }
     */
    start(graphId, graphData, session, observer) {
        this.walker = new GraphWalker(graphId, graphData);
        this.session = session;
        this.observer = observer;
        this.processCurrentNode();
    }

    handleInput(input) {
        if (!this.walker || this.walker.finished) return;

        const node = this.walker.getCurrentNode();
        if (!node) {
            this.end();
            return;
        }

        if (node.type === 'CHOICE' && input.type === 'OPTION_SELECTED') {
            const option = node.options[input.index];
            if (!option) return;

            // Handle side effects (actions) defined on the edge
            this._handleEdgeActions(option);

            if (option.target) {
                this.walker.moveTo(option.target);
                this.processCurrentNode();
            } else if (option.action === 'close') {
                this.end();
            } else {
                // If no target and no close, check if it's an action option?
                // For now, assume end if no target.
                 this.end();
            }
        } else if (node.type === 'TEXT' && input.type === 'CONTINUE') {
            if (node.next) {
                this.walker.moveTo(node.next);
                this.processCurrentNode();
            } else {
                this.end();
            }
        }
    }

    processCurrentNode() {
        if (!this.walker || this.walker.finished) return;

        const node = this.walker.getCurrentNode();
        if (!node) {
            this.end();
            return;
        }

        // Handle Router Nodes (Automatic branching)
        if (node.type === 'ROUTER') {
            let nextNodeId = null;

            if (node.branches) {
                for (const branch of node.branches) {
                    if (branch.default || TransitionLogic.evaluate(branch.condition, this.session)) {
                        nextNodeId = branch.target;
                        break;
                    }
                }
            } else if (node.condition) {
                 // Legacy-style binary router support
                 const result = TransitionLogic.evaluate(node.condition, this.session);
                 nextNodeId = result ? node.trueNode : node.falseNode;
            } else {
                // Unconditional jump
                nextNodeId = node.next;
            }

            if (nextNodeId) {
                this.walker.moveTo(nextNodeId);
                this.processCurrentNode();
                return;
            } else {
                this.end();
                return;
            }
        }

        // Handle Action Nodes
        if (node.type === 'ACTION') {
            if (this.observer && this.observer.onAction) {
                this.observer.onAction(node);
            }

            // If the action is instantaneous or handled by view, we might want to auto-advance
            // if 'next' is present.
            // If the action is e.g. 'OPEN_SHOP', the view might keep the director paused/waiting.
            // We'll leave it to the View/Adapter to call handleInput/CONTINUE if needed,
            // or we auto-advance if it's purely logic.
            // For now, if 'next' exists, we assume we should move to it?
            // But if it's a Shop, we probably don't want to move to 'next' immediately
            // if 'next' leads to text that would overlap the shop.

            // Strategy: Action nodes execute and stay there until external input?
            // Or Action nodes are transient?
            // In the example: shop_node has "next": "hub_choices".
            // This implies: Open Shop -> (Shop Closes) -> Go to Hub Choices.
            // So we need to wait.
            return;
        }

        // Notify Observer for standard nodes (TEXT, CHOICE)
        if (this.observer && this.observer.onNode) {
            this.observer.onNode(node);
        }
    }

    advance() {
        if (!this.walker || this.walker.finished) return;
        const node = this.walker.getCurrentNode();
        if (node && node.next) {
            this.walker.moveTo(node.next);
            this.processCurrentNode();
        } else {
            this.end();
        }
    }

    _handleEdgeActions(edge) {
        if (edge.setFlag) {
            this.session.party.storyFlags[edge.setFlag] = true;
        }
        // Add more logic here (e.g. takeItem, giveItem) as needed for edge transitions
    }

    end() {
        this.walker.finished = true;
        if (this.observer && this.observer.onEnd) {
            this.observer.onEnd();
        }
        this.walker = null;
    }
}
