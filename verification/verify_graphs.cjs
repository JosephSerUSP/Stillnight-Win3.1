const fs = require('fs');
const path = require('path');

const graphsDir = path.join(__dirname, '../data/graphs');
const graphFiles = ['npc_alicia.json', 'npc_laura.json'];

let hasError = false;

graphFiles.forEach(file => {
    try {
        const content = fs.readFileSync(path.join(graphsDir, file), 'utf8');
        const json = JSON.parse(content);
        console.log(`Loaded ${file} successfully.`);

        // Verify nodes
        const nodes = json.nodes;
        Object.keys(nodes).forEach(nodeKey => {
            const node = nodes[nodeKey];

            // Check 'next' targets
            if (node.next && !nodes[node.next]) {
                console.error(`Error in ${file}: Node '${nodeKey}' has invalid next target '${node.next}'`);
                hasError = true;
            }

            // Check choice targets
            if (node.type === 'CHOICE' && node.options) {
                node.options.forEach(opt => {
                    if (opt.target && !nodes[opt.target]) {
                        console.error(`Error in ${file}: Node '${nodeKey}' choice '${opt.label}' has invalid target '${opt.target}'`);
                        hasError = true;
                    }
                });
            }

            // Check router targets
            if (node.type === 'ROUTER') {
                if (node.trueNode && !nodes[node.trueNode]) {
                    console.error(`Error in ${file}: Node '${nodeKey}' has invalid trueNode '${node.trueNode}'`);
                    hasError = true;
                }
                if (node.falseNode && !nodes[node.falseNode]) {
                    console.error(`Error in ${file}: Node '${nodeKey}' has invalid falseNode '${node.falseNode}'`);
                    hasError = true;
                }
                if (node.branches) {
                    node.branches.forEach(branch => {
                        if (branch.target && !nodes[branch.target]) {
                             console.error(`Error in ${file}: Node '${nodeKey}' branch has invalid target '${branch.target}'`);
                             hasError = true;
                        }
                    });
                }
            }

            // Check ACTION nodes
            if (node.type === 'ACTION') {
                 if (node.acceptNode && !nodes[node.acceptNode]) {
                     console.error(`Error in ${file}: Node '${nodeKey}' has invalid acceptNode '${node.acceptNode}'`);
                     hasError = true;
                 }
                 if (node.declineNode && !nodes[node.declineNode]) {
                     console.error(`Error in ${file}: Node '${nodeKey}' has invalid declineNode '${node.declineNode}'`);
                     hasError = true;
                 }
                 if (node.completeNode && !nodes[node.completeNode]) {
                     console.error(`Error in ${file}: Node '${nodeKey}' has invalid completeNode '${node.completeNode}'`);
                     hasError = true;
                 }
            }
        });

    } catch (e) {
        console.error(`Error parsing ${file}:`, e);
        hasError = true;
    }
});

if (hasError) {
    process.exit(1);
} else {
    console.log("All graphs verified.");
}
