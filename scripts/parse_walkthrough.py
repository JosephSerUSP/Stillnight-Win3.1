import re
import json
import os

def parse_walkthrough(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    actors = []
    items = []
    fusion_rules = {}
    skills = {}

    current_section = None
    current_demon = None
    current_item = None
    current_race = None # For fusion rules context if needed? No, rules are explicit.

    # Regex patterns
    demon_header = re.compile(r'^\*([^\*]+)\*$')
    item_header = re.compile(r'^\[([^\]]+)\]$')
    stat_pattern = re.compile(r'^([A-Z]+):\s*(\d+)$')
    attr_pattern = re.compile(r'^([^:]+):\s*(.+)$')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if line.startswith('D00.'):
            current_section = 'FUSION_RULES'
            continue
        if line.startswith('F00.'):
            current_section = 'DEMONS'
            continue
        if line.startswith('H00.'):
            current_section = 'ITEMS'
            continue

        # Fusion Rules
        if current_section == 'FUSION_RULES':
            if 'Fusion:' in line:
                current_race = line.split(' ')[0]
                if current_race not in fusion_rules:
                    fusion_rules[current_race] = {}
            elif '+' in line and current_race:
                parts = line.split('=') # Wait, format is "Element + Jirae" (implicitly = Race)
                # The walkthrough says: "Fairy Fusion: \n Element + Jirae".
                # It means Element + Jirae = Fairy.
                ingredients = line.split('+')
                if len(ingredients) == 2:
                    race1 = ingredients[0].strip()
                    race2 = ingredients[1].strip()
                    # Add rule: race1 + race2 = current_race
                    if race1 not in fusion_rules: fusion_rules[race1] = {}
                    fusion_rules[race1][race2] = current_race
                    if race2 not in fusion_rules: fusion_rules[race2] = {}
                    fusion_rules[race2][race1] = current_race

        # Demons
        if current_section == 'DEMONS' or current_section == 'ITEMS': # Items sometimes appear after demon sections in file structure? No, H00 is later.
             pass

        if current_section == 'DEMONS' or line.startswith('*'): # Detect demon start
            match = demon_header.match(line)
            if match:
                if current_demon:
                    actors.append(current_demon)
                name = match.group(1)
                current_demon = {
                    "id": name.lower().replace(' ', '_'),
                    "name": name,
                    "skills": [],
                    "passives": [],
                    "traits": [],
                    "isEnemy": False # Default, logic can switch later
                }
                continue

            if current_demon:
                # Parse attributes
                if line.startswith('Race:'):
                    # Race: Fairy (Neutral)
                    parts = line.split(':')
                    race_part = parts[1].strip()
                    current_demon['role'] = race_part.split(' ')[0]
                elif line.startswith('LVL:'):
                    current_demon['level'] = int(line.split(':')[1].strip())
                elif line.startswith('HP:'):
                    current_demon['maxHp'] = int(line.split(':')[1].strip())
                elif line.startswith('CP:'):
                    current_demon['cp'] = int(line.split(':')[1].strip())
                elif line.startswith('Skills:'):
                    pass # Just a header
                elif line.startswith('Resist:'):
                    # Resist: 0.5X Sword/Force...
                    # Parse traits? Too complex for simple script, maybe store string or parse
                    current_demon['resist_raw'] = line.split(':')[1].strip()
                elif ' - ' in line and 'MP' in line: # Skill: Hapilma - 3MP
                    skill_name = line.split(' - ')[0]
                    skill_id = skill_name.lower().replace(' ', '_')
                    current_demon['skills'].append(skill_id)
                    skills[skill_id] = { "id": skill_id, "name": skill_name, "cost": line.split(' - ')[1] }
                elif line in ['Flee', 'Defend', 'Scratch', 'Blaze']:
                    skill_id = line.lower().replace(' ', '_')
                    current_demon['skills'].append(skill_id)
                    skills[skill_id] = { "id": skill_id, "name": line }
                elif stat_pattern.match(line):
                    # VI: 5
                    m = stat_pattern.match(line)
                    # We don't map VI/IN directly to Game_Battler stats yet (except maybe via traits)
                    # Game_Battler uses level-based stats generally.
                    pass

        # Items
        if current_section == 'ITEMS' or line.startswith('['):
            match = item_header.match(line)
            if match:
                if current_demon: # Flush last demon if switch sections
                    actors.append(current_demon)
                    current_demon = None

                if current_item:
                    items.append(current_item)

                name = match.group(1)
                current_item = {
                    "id": name.lower().replace(' ', '_'),
                    "name": name,
                    "type": "equipment", # Default
                    "description": "Imported item."
                }
                continue

            if current_item:
                if line.startswith('Cost:'):
                    val = line.split(':')[1].strip().replace(',','')
                    current_item['cost'] = int(val)
                elif line.startswith('Power:'):
                    current_item['damageBonus'] = int(line.split(':')[1].strip())
                elif line.startswith('Defense:'):
                    # Traits for Defense?
                    val = int(line.split(':')[1].strip())
                    if 'traits' not in current_item: current_item['traits'] = []
                    # current_item['traits'].append({ "code": "PARAM_PLUS", "dataId": "def", "value": val })
                    # We don't have DEF stat yet, maybe MaxHP? Or just ignore
                    pass
                elif line.startswith('Gender:'):
                    pass # Ignore for now
                elif 'H01. GUNS' in line:
                    current_item = None # Header check?
                # Heuristic for Equip Type based on section
                # Not easy without tracking section headers strictly.
                # But 'H01. GUNS' sets context.
                pass

    if current_demon:
        actors.append(current_demon)
    if current_item:
        items.append(current_item)

    # Post-process items to assign types based on ID or Context?
    # Simple heuristic:
    for item in items:
        if 'sword' in item['id'] or 'knife' in item['id']: item['equipType'] = 'Weapon'
        elif 'suit' in item['id']: item['equipType'] = 'Armor'
        elif 'helmet' in item['id']: item['equipType'] = 'Helmet'
        elif 'boots' in item['id']: item['equipType'] = 'Boots'
        elif 'gloves' in item['id']: item['equipType'] = 'Gloves'
        elif 'gun' in item['id'] or 'ppk' in item['id']: item['equipType'] = 'Gun'
        else: item['equipType'] = 'Accessory'

    # Save files
    with open('data/actors.json', 'w') as f:
        json.dump(actors, f, indent=2)

    with open('data/items.json', 'w') as f:
        json.dump(items, f, indent=2)

    with open('data/fusion.json', 'w') as f:
        json.dump(fusion_rules, f, indent=2)

    print(f"Generated {len(actors)} actors, {len(items)} items, {len(fusion_rules)} fusion entries.")

parse_walkthrough('walkthrough.txt')
