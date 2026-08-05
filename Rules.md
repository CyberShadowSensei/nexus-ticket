You must strictly follow these constraints:

### 1. ANTI-TROPE BAN LIST (DO NOT USE)
- NO card grids with heavy borders, rounded corners, or box-shadows.
- NO purple/blue glowing neon accents or bright gradient backgrounds.
- NO default system fonts (Inter, Arial, Roboto, Segoe UI).
- NO uniform 3-column layouts where every block looks identical.

### 2. VISUAL DIRECTION
- AESTHETIC: Editorial Dashboard / Modern Monolithic. Think high-end Bloomberg terminal meets premium news site. Clean, precise, and sophisticated.
- PALETTE: Stark and limited. Dark charcoal text (#1A1A1A) on an off-white background (#F9F9F8), with a muted slate or dark olive accent.
- TYPOGRAPHY: Import 'Syne' or 'DM Serif Display' for major metrics/headers, and 'JetBrains Mono' or 'Space Mono' for data points and labels. Use small, uppercase letters with wide letter-spacing for sub-headings.
- SPACING: Use thin, crisp lines (`border: 1px solid #E0E0E0`) to create a literal layout grid rather than separate floating boxes.

### 3. TECHNICAL CONSTRAINTS
- Write semantic HTML5 layout containers (<header>, <main>, <section>, <aside>).
- Use CSS Variables (:root) for the entire spacing and color token system.
- Use CSS Grid to map out an asymmetric dashboard layout (e.g., a wide main metrics grid, a skinny sidebar for settings or secondary feeds).
- Keep code clean, modular, and optimized for a single viewport display. No inline styles.

### 4. OUTPUT INSTRUCTIONS
Generate the complete HTML and structural CSS for this single-page dashboard. Focus on displaying layout sections cleanly with clear data placeholders (e.g., main stats, a trend timeline, and a status log).
