import re
import json
import os

INPUT_FILE = "walkthrough.txt"
DATA_DIR = "data"

def parse_walkthrough():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # --- FUSION RULES ---
    fusion_table = {}
    clans = set()

    # Regex to find fusion sections
    fusion_section = re.search(r"D00\. FUSION RULES(.*?)(E00\.|F00\.)", content, re.DOTALL)
    if fusion_section:
        rules_text = fusion_section.group(1)
        current_clan = None
        for line in rules_text.splitlines():
            line = line.strip()
            if not line: continue

            # "Fairy Fusion:"
            m_clan = re.match(r"(\w+) Fusion:", line)
            if m_clan:
                current_clan = m_clan.group(1)
                clans.add(current_clan)
                continue

            if current_clan:
                # "Element + Jirae/Genma/Divine"
                if "+" in line:
                    parts = line.split("+")
                    if len(parts) == 2:
                        race1 = parts[0].strip()
                        others = parts[1].strip()
                        race2_list = others.split("/")

                        # Add rules: race1 + race2 = current_clan
                        for r2 in race2_list:
                            r2 = r2.strip()
                            if r2:
                                if race1 not in fusion_table: fusion_table[race1] = {}
                                fusion_table[race1][r2] = current_clan
                                if r2 not in fusion_table: fusion_table[r2] = {}
                                fusion_table[r2][race1] = current_clan # Symmetric? Usually yes.

    fusion_data = {
        "clans": list(clans),
        "table": fusion_table
    }

    with open(os.path.join(DATA_DIR, "fusion.json"), "w") as f:
        json.dump(fusion_data, f, indent=2)
    print("Generated fusion.json")

    # --- DEMONS ---
    actors = []
    # Pattern: *Name*\nRace: ...
    # We split by "*" but be careful.

    # Let's find index of F00 and G00
    start_idx = content.find("F00. DEMON FUSIONS")
    end_idx = content.find("G00. BOSS STATS")

    if start_idx != -1 and end_idx != -1:
        demon_text = content[start_idx:end_idx]
        # Split by *Name*
        demon_chunks = re.split(r"\*([^\*]+)\*", demon_text)

        # chunk 0 is header.
        # chunk 1 is Name, chunk 2 is Data. Chunk 3 is Name, Chunk 4 is Data.

        for i in range(1, len(demon_chunks), 2):
            name = demon_chunks[i].strip()
            data = demon_chunks[i+1]

            # Parse stats
            lvl_m = re.search(r"LVL: (\d+)", data)
            hp_m = re.search(r"HP: (\d+)", data)
            role_m = re.search(r"Race: (\w+)", data)

            if not (lvl_m and hp_m and role_m):
                continue

            lvl = int(lvl_m.group(1))
            hp = int(hp_m.group(1))
            role = role_m.group(1)

            # Stats VI, IN, etc.
            # Not strictly needed for Game_Battler unless we want to map them to traits
            # but Game_Battler auto-calcs stats from level.
            # We will ignore detailed stats for now to save time, relying on level.

            # Skills
            skills = []
            if "Skills:" in data:
                skill_section = data.split("Skills:")[1].split("VI:")[0]
                for sline in skill_section.splitlines():
                    sline = sline.strip()
                    if not sline: continue
                    # "Hapilma - 3MP" -> Hapilma
                    sname = sline.split("-")[0].strip()
                    if sname != "Flee" and sname != "Defend":
                        # Convert to ID: "Wind Blade" -> "windBlade" (camelCase)
                        sid = sname.lower().replace(" ", "")
                        skills.append(sid)

            # Elements/Affinity
            elements = []
            aff_m = re.search(r"Affinity: (.+)", data)
            if aff_m:
                aff = aff_m.group(1)
                if "Fire" in aff: elements.append("Red")
                if "Ice" in aff: elements.append("Blue")
                if "Wind" in aff: elements.append("Green")
                if "Elec" in aff: elements.append("Yellow")
                if "Force" in aff: elements.append("White")
                if "Curse" in aff or "Undead" in aff: elements.append("Black")

            actor = {
                "id": name.lower().replace(" ", "_").replace("-", "_"),
                "name": name,
                "role": role,
                "level": lvl,
                "maxHp": hp,
                "skills": skills,
                "elements": elements,
                "spriteKey": "pixie" # default
            }
            actors.append(actor)

    # Add Hero and Partner manually if not present
    actors.insert(0, {
        "id": "hero",
        "name": "Hero",
        "role": "Human",
        "level": 1,
        "maxHp": 45,
        "expGrowth": 20,
        "skills": ["attack", "gun"],
        "spriteKey": "hero"
    })
    actors.insert(1, {
        "id": "partner",
        "name": "Partner",
        "role": "Human",
        "level": 1,
        "maxHp": 40,
        "expGrowth": 20,
        "skills": ["zio", "dia"],
        "spriteKey": "partner"
    })

    with open(os.path.join(DATA_DIR, "actors.json"), "w") as f:
        json.dump(actors, f, indent=2)
    print(f"Generated actors.json with {len(actors)} entries")

    # --- SKILLS ---
    all_skills = {}
    for actor in actors:
        if "skills" in actor:
            for skill_id in actor["skills"]:
                if skill_id not in all_skills:
                    etype = "hp_damage"
                    sname = skill_id.capitalize()
                    if "Dia" in sname or "Media" in sname:
                         etype = "hp_heal"

                    all_skills[skill_id] = {
                        "id": skill_id,
                        "name": sname,
                        "description": "A skill.",
                        "effects": [{"type": etype, "formula": "a.atk * 1.5"}]
                    }

    # Write skills.js
    with open(os.path.join(DATA_DIR, "skills.js"), "w") as f:
        f.write("export const skills = " + json.dumps(all_skills, indent=4) + ";")
    print(f"Generated skills.js with {len(all_skills)} entries")

    # --- ITEMS ---
    items = []

    # H00 to I00
    start_idx = content.find("H00. USABLE ITEMS")
    end_idx = content.find("I00. THANKS")

    if start_idx != -1:
        item_text = content[start_idx:end_idx] if end_idx != -1 else content[start_idx:]

        # Split by [Name]
        item_chunks = re.split(r"\[([^\]]+)\]", item_text)

        current_type = "consumable"

        for i in range(1, len(item_chunks), 2):
            name = item_chunks[i].strip()
            data = item_chunks[i+1]

            # Detect section headers in previous chunk? No, previous chunk is data of prev item.
            # Check if this name looks like a header (e.g. H01. GUNS)
            # Actually, headers are usually outside []

            # Simple heuristic for type based on data keywords
            etype = None
            if "Power:" in data: # Weapon/Gun
                if "H01. GUNS" in item_text and item_text.find(name) > item_text.find("H01. GUNS") and item_text.find(name) < item_text.find("H02."):
                     etype = "Gun"
                else:
                     etype = "Weapon"
            elif "Defense:" in data: # Armor
                if "H04." in item_text and item_text.find(name) > item_text.find("H04.") and item_text.find(name) < item_text.find("H05."): etype = "Head"
                elif "H05." in item_text and item_text.find(name) > item_text.find("H05.") and item_text.find(name) < item_text.find("H06."): etype = "Arms"
                elif "H06." in item_text and item_text.find(name) > item_text.find("H06.") and item_text.find(name) < item_text.find("H07."): etype = "Legs"
                elif "H07." in item_text and item_text.find(name) > item_text.find("H07."): etype = "Accessory"
                elif "H08." in item_text and item_text.find(name) > item_text.find("H08."): etype = "Accessory"
                else: etype = "Armor" # Suits

            cost_m = re.search(r"Cost: ([\d,]+)", data)
            cost = int(cost_m.group(1).replace(",", "")) if cost_m else 0

            desc = "Item."

            item = {
                "id": name.lower().replace(" ", "_").replace("-", "_").replace(".", ""),
                "name": name,
                "cost": cost,
                "description": desc,
                "icon": 6
            }

            if etype:
                item["type"] = "equipment"
                item["equipType"] = etype

                traits = []
                pwr_m = re.search(r"Power: (\d+)", data)
                if pwr_m:
                    traits.append({"code": "PARAM_PLUS", "dataId": "atk", "value": int(pwr_m.group(1))})

                def_m = re.search(r"Defense: (\d+)", data)
                if def_m:
                    # Defense not directly mapped to a stat in Game_Battler yet?
                    # We can use maxHp as proxy or assume defense reduces damage (not implemented in engine yet)
                    # For now, map Defense to maxHp for visible effect?
                    traits.append({"code": "PARAM_PLUS", "dataId": "maxHp", "value": int(def_m.group(1)) * 5})

                item["traits"] = traits
            else:
                item["type"] = "consumable"
                item["effects"] = {} # Placeholder
                if "Restore full HP" in data: item["effects"]["hp"] = 999

            items.append(item)

    with open(os.path.join(DATA_DIR, "items.json"), "w") as f:
        json.dump(items, f, indent=2)
    print(f"Generated items.json with {len(items)} entries")

if __name__ == "__main__":
    parse_walkthrough()
