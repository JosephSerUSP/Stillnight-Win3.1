import { GraphWalker } from "../graph/walker.js";
import { TransitionLogic } from "../graph/transition.js";
import { interpolateText } from "../utils/text_interpolator.js";

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

    /**
     * Handles user input (e.g., selecting an option or clicking continue).
     * @param {Object} input - { type: 'OPTION_SELECTED' | 'CONTINUE', index?: number }
     */
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
            }

            // Fallback to 'next' if no conditional target was found
            if (!nextNodeId && node.next) {
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
            return;
        }

        // Handle TEXT -> CHOICE Merge
        // Optimization: If current node is TEXT and simply transitions to a CHOICE node, merge them.
        // This prevents the user from having to click "Continue" just to see the choices immediately after.
        // The TEXT content is prepended to the CHOICE content/prompt.
        if (node.type === 'TEXT' && node.next) {
            const nextNode = this.walker.data.nodes[node.next];
            if (nextNode && nextNode.type === 'CHOICE') {
                 // Move logic state to the choice node immediately
                 this.walker.moveTo(node.next);

                 // Create a transient merged node for the observer
                 // We combine the TEXT content with the CHOICE content (if any)
                 const mergedNode = {
                     ...nextNode,
                     content: node.content + (nextNode.content ? "\n\n" + nextNode.content : ""),
                     // Inherit visual properties from the TEXT node if missing in CHOICE node
                     portrait: nextNode.portrait || node.portrait,
                     speakers: nextNode.speakers || node.speakers,
                     // Ensure the ID tracks the new node (though `type` is what matters mostly)
                     // nextNode is the raw data object, it doesn't have ID property usually.
                     // GraphWalker manages IDs.
                 };

                 // Interpolate text
                 if (mergedNode.content) {
                     mergedNode.content = interpolateText(mergedNode.content, this.session);
                 }

                 if (this.observer && this.observer.onNode) {
                    this.observer.onNode(mergedNode);
                 }
                 return;
            }
        }

        // Notify Observer for standard nodes (TEXT, CHOICE)
        if (this.observer && this.observer.onNode) {
            // Clone the node to avoid mutating the graph data with interpolated text
            const displayNode = { ...node };
            if (displayNode.content) {
                displayNode.content = interpolateText(displayNode.content, this.session);
            }
            this.observer.onNode(displayNode);
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
