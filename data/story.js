export const storyEvents = {
    0: { // Juban District
        title: "Act 1: The Beginning",
        image: "usagi.png", // Will default to default.png if missing
        description: [
            "Usagi: 'Oh no! I'm late for school again!'",
            "Luna: 'Usagi, wake up! There are monsters in the town!'",
            "Usagi: 'M-Monsters? But I'm just a normal girl!'",
            "Luna: 'Take this brooch. Shout 'Moon Prism Power, Make Up!''"
        ],
        choices: [
            { label: "Transform!", onClick: "CLOSE" }
        ]
    },
    1: { // Jewelry Store
        title: "Act 2: Osa-P Store",
        image: "ami.png",
        description: [
            "Usagi: 'This energy... it's evil!'",
            "Naru: 'Help me, Usagi!'",
            "Morga: 'Gwahahaha! Give me your energy!'",
            "Ami: 'I calculate a 99% chance that you're going down.'"
        ],
        choices: [
            { label: "Fight!", onClick: "CLOSE" }
        ]
    },
    2: { // Bus Line
        title: "Act 3: The Cursed Bus",
        image: "rei.png",
        description: [
            "Rei: 'I sense an evil presence.'",
            "Usagi: 'Rei-chan! Be careful!'",
            "Jadeite: 'Welcome to your doom, Sailor Scouts.'",
            "Rei: 'Fire Soul!'"
        ],
        choices: [
            { label: "Proceed", onClick: "CLOSE" }
        ]
    },
    3: { // Rose Garden
        title: "Act 4: Thunder and Roses",
        image: "makoto.png",
        description: [
            "Makoto: 'Who's messing with my friends?'",
            "Nephrite: ' The stars predict your demise.'",
            "Makoto: 'I'll make you regret that! Supreme Thunder!'"
        ],
        choices: [
            { label: "Battle", onClick: "CLOSE" }
        ]
    },
    4: { // Tower
        title: "Act 5: The Tower",
        image: "minako.png",
        description: [
            "Minako: 'I've been waiting for this moment.'",
            "Zoisite: 'You rat! How dare you scratch my face!'",
            "Minako: 'Crescent Beam!'"
        ],
        choices: [
            { label: "Ascend", onClick: "CLOSE" }
        ]
    },
    5: { // Ice Cave
        title: "Act 6: Frozen Hearts",
        image: "kunzite.png",
        description: [
            "Kunzite: 'You have come far, but your journey ends here.'",
            "Usagi: 'We will never give up! For love and justice!'",
            "Kunzite: 'Die!'"
        ],
        choices: [
            { label: "Face Him", onClick: "CLOSE" }
        ]
    },
    6: { // Final
        title: "Final Act: Dark Kingdom",
        image: "beryl.png",
        description: [
            "Queen Beryl: 'Prince Endymion is mine! The world is mine!'",
            "Usagi: 'I will save everyone... even you!'",
            "Luna: 'Usagi, use the Silver Crystal!'"
        ],
        choices: [
            { label: "Final Battle", onClick: "CLOSE" }
        ]
    }
};
