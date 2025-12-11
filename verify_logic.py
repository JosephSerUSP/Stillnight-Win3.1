
def simulate_animation(text):
    original_length = len(text)
    current_name = text
    steps = []

    print(f"Start: '{current_name}'")

    while len(current_name) > 0:
        current_name = current_name[:-1] # Remove last char
        # Pad start
        display_string = current_name.rjust(original_length, ' ')
        steps.append(display_string)
        print(f"Step: '{display_string}'")

    return steps

expected = [
    " Firag",
    "  Fira",
    "   Fir",
    "    Fi",
    "     F",
    "      " # Empty string logic check: my JS code stops at length > 0
]

# JS logic: if (currentName.length > 0) -> update.
# 1. Start "Firaga"
# 2. Slice -> "Firag". Pad -> " Firag". Update. Loop.
# ...
# 6. Slice "F" -> "". Pad -> "      ". Update. Loop.
# 7. Length is 0. Else -> Finalize.

# So the last update is empty string (all spaces).
# Let's verify my python output matches.

steps = simulate_animation("Firaga")
if steps[0] == " Firag" and steps[-1].strip() == "":
    print("SUCCESS: Logic produces sliding right effect.")
else:
    print("FAILURE: Logic incorrect.")
