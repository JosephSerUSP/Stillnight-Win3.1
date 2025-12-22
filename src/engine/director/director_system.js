import { GraphWalker } from "./graph_walker.js";
import { NodeResolver } from "./node_resolver.js";
import { TransitionLogic } from "./transition_logic.js";

export class DirectorSystem {
    constructor(registry) {
        this.resolver = new NodeResolver(registry);
        this.activeWalkers = new Map(); // walkerId -> GraphWalker
    }

    startInteraction(graphId, session, startNodeId = null) {
        const graph = this.resolver.getGraph(graphId);
        if (!graph) throw new Error(`Graph '${graphId}' not found.`);

        const startNode = startNodeId || graph.initialNode;
        const walker = new GraphWalker(graphId, startNode);

        this.activeWalkers.set('main', walker);

        return this.processCurrentNode(walker, session);
    }

    handleEvent(event, session) {
        const walker = this.activeWalkers.get('main');
        if (!walker || walker.isFinished) return null;

        if (event.type === 'OPTION_SELECTED') {
            return this.selectOption(walker, event.index, session);
        }

        return null;
    }

    /**
     * Resumes execution for the given walker (or default 'main').
     * Useful after an action has been processed by the UI.
     */
    resume(session, walkerId = 'main') {
        const walker = this.activeWalkers.get(walkerId);
        if (!walker || walker.isFinished) return null;
        return this.processCurrentNode(walker, session);
    }

    processCurrentNode(walker, session) {
        const node = this.resolver.getNode(walker.graphId, walker.currentNodeId);
        if (!node) {
            console.warn(`Node '${walker.currentNodeId}' not found in graph '${walker.graphId}'. Finishing.`);
            walker.finish();
            return { type: 'END_INTERACTION' };
        }

        const transitionLogic = new TransitionLogic(session);

        // Handle Router Nodes (Automatic transition)
        if (node.type === 'ROUTER') {
            const nextNodeId = this._resolveRouter(node, transitionLogic);
            if (nextNodeId) {
                walker.moveTo(nextNodeId);
                return this.processCurrentNode(walker, session);
            } else {
                // Dead end in router
                walker.finish();
                return { type: 'END_INTERACTION' };
            }
        }

        // Handle Action Nodes (Immediate side effect + transition)
        if (node.type === 'ACTION') {
            const result = {
                type: 'EXECUTE_ACTION',
                action: node.action,
                params: node.params || {}
            };

            if (node.action === 'OPEN_SHOP' && node.shopId) {
                result.params.shopId = node.shopId;
            }

            if (node.next) {
                walker.moveTo(node.next);
                return result;
            }
        }

        // Handle Text/Choice Nodes (Content to display)
        if (node.type === 'TEXT' || node.type === 'CHOICE') {
            // Filter choices based on conditions
            let visibleOptions = null;
            if (node.options) {
                visibleOptions = node.options.filter(opt => {
                    if (!opt.condition) return true;
                    return transitionLogic.evaluateCondition(opt.condition);
                });
            }

            // Normalization: If TEXT has 'next' but no options, treat it as a virtual "Continue" option
            if (node.type === 'TEXT' && !visibleOptions && node.next) {
                visibleOptions = [{
                    label: "Continue",
                    target: node.next
                }];
            }

            // Store valid options in walker to ensure deterministic selection later
            walker.currentOptions = visibleOptions;

            return {
                type: 'SHOW_NODE',
                node: {
                    ...node,
                    options: visibleOptions
                }
            };
        }

        return null;
    }

    selectOption(walker, optionIndex, session) {
        // Use stored options to prevent race conditions with unstable logic (e.g. random)
        const options = walker.currentOptions;
        const selected = options ? options[optionIndex] : null;

        if (!selected) return null;

        // Apply side effects (setFlag, etc)
        if (selected.setFlag) {
            session.party.storyFlags[selected.setFlag] = true;
        }

        // Determine next node
        if (selected.target && selected.target !== 'end') {
            walker.moveTo(selected.target);
            return this.processCurrentNode(walker, session);
        } else if (selected.action === 'close' || selected.target === 'end') {
            walker.finish();
            return { type: 'END_INTERACTION' };
        } else if (selected.action) {
             return {
                 type: 'EXECUTE_ACTION',
                 action: selected.action,
                 params: selected
             };
        }

        return null;
    }

    _resolveRouter(node, logic) {
        if (node.routes) {
            for (const route of node.routes) {
                if (logic.evaluateCondition(route.condition)) {
                    return route.target;
                }
            }
        }
        return node.default || null;
    }
}
