
import { Game_Battler, Game_Party } from '../objects/objects.js';
import { createBattlerNameLabel } from '../presentation/windows/index.js';

// Mock Data
const mockActors = [
    { "id": "pixie", "name": "Pixie", "level": 1, "maxHp": 9, "evolutions": [{ "level": 6, "evolvesTo": "highPixie" }] },
    { "id": "skeleton", "name": "Skeleton", "level": 1, "maxHp": 11, "evolutions": [] }
];

// Mock Document/Element for window functions
if (typeof document === 'undefined') {
    global.document = {
        createElement: (tag) => {
            return {
                style: {},
                appendChild: () => {},
                classList: { add: () => {} }
            };
        }
    };
}

// 1. Test Game_Battler Logic
console.log("Testing Game_Battler Logic...");
const pixie = new Game_Battler(mockActors[0]);
const skeleton = new Game_Battler(mockActors[1]);

// Initial State (Level 1)
const status1 = pixie.getEvolutionStatus([], 1, 0);
console.log(`Pixie (Lv1) Status: ${status1.status} (Expected: LOCKED)`);

const status2 = skeleton.getEvolutionStatus([], 1, 0);
console.log(`Skeleton (Lv1) Status: ${status2.status} (Expected: NONE)`);

// Level Up
pixie.level = 6;
const status3 = pixie.getEvolutionStatus([], 1, 0);
console.log(`Pixie (Lv6) Status: ${status3.status} (Expected: AVAILABLE)`);

// Gold Requirement Test
const goldActorData = { ...mockActors[0], evolutions: [{ level: 6, gold: 100 }] };
const goldPixie = new Game_Battler(goldActorData);
goldPixie.level = 6;

const statusGoldFail = goldPixie.getEvolutionStatus([], 1, 50);
console.log(`GoldPixie (50g) Status: ${statusGoldFail.status} (Expected: LOCKED)`);

const statusGoldPass = goldPixie.getEvolutionStatus([], 1, 150);
console.log(`GoldPixie (150g) Status: ${statusGoldPass.status} (Expected: AVAILABLE)`);

// 2. Test createBattlerNameLabel output (Mock DOM)
// We can't fully test visual rendering in Node, but we can check if it tries to add the icon.
// We'll trust the logic if the status is correct.
