export const introSequence = [
    { type: "LOG", text: "The wagon wheels grind to a halt on the cobblestones." },
    { type: "WAIT", time: 1000 },
    {
        type: "TEXT",
        title: "Arrival",
        text: "You step off the transport into the Town of Stillnight. The air is cold, smelling of ozone and old stone. Above, the sky is a swirling vortex of violet clouds—the edge of the Eternal Void.",
        style: "terminal"
    },
    {
        type: "TEXT",
        title: "Alicia",
        text: "We're here, Commander. This is the last outpost before the dungeon entrance.",
        image: "NPC_Alicia",
        layout: "visual_novel",
        style: "terminal"
    },
    {
        type: "TEXT",
        title: "Laura",
        text: "It looks... deserted. Are you sure the Guild is still active here?",
        image: "NPC_Laura",
        layout: "visual_novel",
        style: "terminal"
    },
    {
        type: "TEXT",
        title: "Alicia",
        text: "The Guild never abandons a post, Laura. But the void storms make travel difficult. We're lucky to have made it through.",
        image: "NPC_Alicia",
        layout: "visual_novel",
        style: "terminal"
    },
    {
        type: "TEXT",
        title: "Laura",
        text: "I suppose. Well, Commander, we await your orders. We should probably check in with the locals or head straight for the entrance.",
        image: "NPC_Laura",
        layout: "visual_novel",
        style: "terminal"
    },
    {
        type: "TEXT",
        title: "Alicia",
        text: "Agreed. Let's not waste time. The Void waits for no one.",
        image: "NPC_Alicia",
        layout: "visual_novel",
        style: "terminal"
    },
    { type: "SET_FLAG", flag: "intro_seen", value: true },
    { type: "LOG", text: "Alicia and Laura are ready." }
];
