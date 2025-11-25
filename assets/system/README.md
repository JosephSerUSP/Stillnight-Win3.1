# Icon Sheet Documentation

## 📐 Icon Specifications
- **Icon size:** 12 × 12 pixels  
- **Icon sheet size:** 120 × *height* (height is flexible and not relevant)  
- **Reference system:** Icons are identified by **ID**.  
  - Example: **Icon ID 12** → located in the **2nd column, 2nd row**.  

## 🎨 Rendering Rules
- All icons **must** render with a **2px drop shadow** when drawn in the interface.  
- Icons are arranged in a grid layout based on their ID.  

## 🔢 Icon Groups
### Element Orbs (Standard)
- **IDs 1–5**  
- Represent the elements: **R (Red), G (Green), B (Blue), W (White), K (Black)**  

### Element Orbs (Mini)
- **IDs 11–15**  
- Same elements (**RGBWK**) but in **mini form**  
- Designed to be **overlapped diagonally** for composite effects  

## 📊 Icon Positioning
- Icons are indexed left-to-right, top-to-bottom.  
- Formula for position:  
  - **Column** = `(ID - 1) % 10 + 1`  
  - **Row** = `⌊(ID - 1) / 10⌋ + 1`  

Example:  
- **ID 12** → Column 2, Row 2  

## 🗂️ Usage Notes
- Use **IDs 1–5** for primary element representation.  
- Use **IDs 11–15** for secondary/overlay effects.  
- Always apply the **2px shadow** for consistency across the UI.  

---
This documentation ensures consistent usage of the icon sheet across the project.
