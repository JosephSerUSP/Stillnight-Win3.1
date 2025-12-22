import { DirectorSystem } from "../src/engine/systems/director.js";
import { GraphWalker } from "../src/engine/graph/walker.js";
import { TransitionLogic } from "../src/engine/graph/transition.js";
import { strict as assert } from 'assert';

console.log("Running Graph System Tests...");

// 1. Test TransitionLogic
const session = {
    party: {
        storyFlags: { 'flagA': true },
        inventory: [{ id: 'potion' }],
        hasItem: (id) => id === 'potion'
    },
    quests: {}
};

assert.equal(TransitionLogic.evaluate('flag:flagA', session), true);
assert.equal(TransitionLogic.evaluate('flag:flagB', session), false);
assert.equal(TransitionLogic.evaluate('!flag:flagB', session), true);
assert.equal(TransitionLogic.evaluate('hasItem:potion', session), true);
assert.equal(TransitionLogic.evaluate('hasItem:sword', session), false);

console.log("TransitionLogic Passed.");

// 2. Test Walker
const graphData = {
    initialNode: "start",
    nodes: {
        "start": { type: "TEXT", next: "end" },
        "end": { type: "TEXT" }
    }
};
const walker = new GraphWalker("test", graphData);
assert.equal(walker.currentNodeId, "start");
walker.moveTo("end");
assert.equal(walker.currentNodeId, "end");

console.log("GraphWalker Passed.");

// 3. Test Director
const director = new DirectorSystem();
let lastNode = null;
const observer = {
    onNode: (n) => lastNode = n,
    onEnd: () => lastNode = 'END'
};

director.start("test", graphData, session, observer);
assert.equal(lastNode.type, "TEXT"); // start
// start has 'next: end'
director.handleInput({ type: 'CONTINUE' });
// now at end
assert.equal(lastNode.type, "TEXT");
// end has no next
director.handleInput({ type: 'CONTINUE' });
assert.equal(lastNode, "END");

console.log("DirectorSystem Passed.");
