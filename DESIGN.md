# Design System Document: Precision Editorial

## 1. Overview & Creative North Star

### The "Digital Curator"
This design system is built upon the philosophy of **Digital Curation**. We do not "build layouts"; we "publish architecture." Every pixel must feel like a deliberate choice, rejecting the generic "template" look in favor of a high-end, editorial experience. 

The aesthetic is driven by **Stark Sophistication**. We achieve authority through whitespace and tonal precision rather than loud decoration. By leveraging intentional asymmetry, meticulous micro-typography, and a "no-border" structural philosophy, we create an interface that feels like a physical object—a series of ivory plates resting on a gallery floor.

---

## 2. Colors & Surface Logic

Our palette is a study in subtle contrast. The goal is to move the eye through the interface using light and weight, rather than lines and boxes.

### The Palette
- **Canvas (`surface` / `#F7F8F9`):** The baseline off-white. This is the "floor" of our gallery.
- **Plate (`surface_container_lowest` / `#FFFFFF`):** Pure white. Used for primary content areas to create a natural "lift."
- **Ink (`on_surface` / `#1A1F36`):** Deep, authoritative navy. Used for primary headers and heavy-weighted text.
- **Slate (`on_surface_variant` / `#4F566B`):** Secondary text. Used to provide context without competing with the Ink.
- **Brand (`primary` / `#635BFF`):** The vibrant pulse. Use this sparingly for key actions and focus states.

### The "No-Line" Rule
Explicitly prohibit the use of 1px solid borders for sectioning or card definition. Boundaries must be defined solely through background color shifts. A **Plate** (`#FFFFFF`) card sitting on the **Canvas** (`#F7F8F9`) provides all the definition a sophisticated eye requires.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack. 
1. **Level 0 (Canvas):** The base application background.
2. **Level 1 (Plate):** Main content containers.
3. **Level 2 (Surface Container High):** Inset areas within a Plate, such as a code block or a search input.

### Glass & Texture
For floating elements like dropdowns, use a "Glassmorphism" approach: `surface_container_lowest` at 85% opacity with a `20px` backdrop blur. This ensures the UI feels integrated and high-end, allowing the subtle colors of the canvas to bleed through the edges.

---

## 3. Typography: The Editorial Voice

We use **Inter** exclusively, but we treat it with the discipline of a master typesetter.

| Level | Size | Weight | Tracking | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 3.5rem | 700 | `-0.022em` | Tight tracking for maximum impact. |
| **Headline** | 2.0rem | 600 | `-0.022em` | The "Editorial" voice. |
| **Title** | 1.125rem | 600 | `-0.011em` | Used for card titles. |
| **Body** | 0.875rem | 400 | `-0.011em` | Highly legible, airy. |
| **Label** | 0.75rem | 500 | `0.02em` | Slightly tracked out for utility. |

### The "Tabular" Mandate
All data, timestamps, and currency must use `font-variant-numeric: tabular-nums`. In a precision system, numbers must align vertically to create a "grid of truth."

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved by stacking surface tiers. To create a "lifted" section, do not reach for a shadow; instead, place a `surface_container_lowest` container inside a `surface_container_low` zone.

### Ambient Shadows
When an element must float (Modals/Popovers), use a multi-layered shadow using the **Ink** color (`#1A1F36`) at extremely low opacities:
- **Layer 1:** `0 2px 4px rgba(26, 31, 54, 0.04)`
- **Layer 2:** `0 12px 24px rgba(26, 31, 54, 0.08)`
This mimics natural, diffused light rather than a digital drop shadow.

### The Ghost Border
If a divider is required for extreme density, use a "Ghost Border": a 1px hairline using `#E3E8EE` at **50% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons: High-Precision Tools
- **Radius:** `ROUND_FOUR` (4px).
- **Primary:** Background `brand`, text `on_primary`. 
- **The Signature Detail:** A 1px inset top-border highlight (`rgba(255,255,255,0.2)`) to give the button a tactile, machined edge.
- **Tertiary:** No background, `slate` text. On hover, shift to `ink` with a subtle `canvas` background.

### Cards & Lists
Cards must never have borders. Use the transition from **Canvas** to **Plate** for definition. 
- **Spacing:** Use generous padding (24px+) to create an "Editorial" feel.
- **Dividers:** Strictly forbidden. Use 16px or 24px of vertical white space to separate list items.

### Input Fields
- **Background:** `surface_container_lowest` (#FFFFFF).
- **Border:** Use the "Ghost Border" (1px hairline at 50% opacity).
- **Focus State:** Transition the border to 100% opacity `brand` color with a 2px soft outer glow.

### Signature Component: The "Data Plate"
A specific layout pattern where a `title-sm` label sits atop a `tabular-nums` value. These should be arranged in an asymmetrical grid to break the "standard dashboard" monotony.

---

## 6. Do’s and Don’ts

### Do
- **Do** prioritize white space over lines. If a layout feels cluttered, increase the padding, don't add a divider.
- **Do** align all numerical data vertically using tabular-nums.
- **Do** use the 4px corner radius consistently to maintain the "Architectural" feel.
- **Do** use `ink` for titles to maintain an authoritative hierarchy.

### Don't
- **Don't** use pure black for shadows. Always tint shadows with the `ink` token.
- **Don't** use standard 1px borders for cards. If it doesn't stand out, adjust the background color of the section.
- **Don't** use default tracking. The negative micro-tracking is what gives the typography its "published" premium feel.
- **Don't** use rounded-full buttons (pills). We are building architecture, not playthings. Use `ROUND_FOUR`.