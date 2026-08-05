---
name: editorial-monolithic-dashboard-design
description: Guidelines and design system specifications for building Editorial Monolithic Terminal dashboards (Bloomberg Terminal meets High-End News Bulletin aesthetic). Use when designing enterprise dashboards that demand zero emojis, stark off-white/charcoal typography contrast, 1px structural grid lines, and high-density asymmetric data layouts.
---

# Editorial Monolithic Dashboard Design System

This skill provides comprehensive instructions for agents to build high-end **Editorial Monolithic Terminal** interfaces.

## Design Philosophy

The Editorial Monolithic aesthetic bridges high-density financial terminals (e.g. Bloomberg Terminal) with refined editorial typography (e.g. high-end news publications). It rejects saturated ambient glows, rounded floating card grids, and casual emojis in favor of crisp structural grids, stark typographic hierarchy, and clean data density.

---

## 1. Anti-Trope Ban List (Strictly Prohibited)

- **NO rounded floating card grids**: Do not use heavy border-radius (`> 0px`) or shadow elevation popouts (`box-shadow`).
- **NO glowing gradients or ambient background halos**: No purple/indigo neon glows or radial ambient color blobs.
- **NO default system sans fonts**: Never default to un-styled Inter, Arial, Roboto, or Segoe UI.
- **NO emojis or decorative icon fluff**: No `🔐`, `💼`, `📌`, `✨` emojis anywhere in UI markup, code strings, prompts, or data outputs.
- **NO browser popup dialogs**: Never use `window.prompt()`, `alert()`, or `confirm()` blocking modals.

---

## 2. Visual Tokens & Color Palette

| Token | Hex / Value | Purpose |
| :--- | :--- | :--- |
| `--bg-main` | `#F4F4F2` | Off-white paper background canvas |
| `--panel-bg` | `#FFFFFF` | Stark white layout section fill |
| `--border-grid` | `#D5D5D0` | Subtle 1px structural grid divider |
| `--border-grid-dark` | `#1A1A1A` | Dark charcoal accent 1px & 2px grid borders |
| `--text-main` | `#1A1A1A` | Primary high-contrast text ink |
| `--text-muted` | `#4A4A4A` | Secondary descriptions and metadata labels |
| `--text-dim` | `#767676` | Tertiary system tags and timestamps |
| `--accent-slate` | `#1E293B` | Primary dark slate accent |
| `--accent-olive` | `#2D3748` | Secondary dark olive accent |

---

## 3. Typography Rules

1. **Headers & Display Titles**: Import **`Syne`** (Weight 700 / 800) for sharp uppercase structural titles. Pair with **`DM Serif Display`** for italic brand accents.
2. **Data Points, Labels & Controls**: Import **`Space Mono`** or **`JetBrains Mono`**. Use tracked uppercase letters (`letter-spacing: 0.1em` to `0.15em`) for sub-headings and system logs.
3. **Prose & Body**: Clean sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`) with line-height `1.6`.

---

## 4. Asymmetric Grid Layout Structure

Map out layouts using asymmetric CSS Grid:
- **Main Matrix Feed (70% width)**: Primary output panel containing feed cards separated by crisp 1px borders.
- **Sidebar Control Queue (300px - 400px)**: Compact sidebar housing batch ingestion queues, model engines, preset quick-loads, and dispatch triggers.

```html
<div class="monolithic-container">
  <header class="editorial-header">
    <div class="brand-block">
      <span class="system-tag">TERMINAL // SYSTEM INTEL</span>
      <h1 class="brand-title">NEXUS <span>EDITORIAL BULLETIN</span></h1>
    </div>
  </header>

  <main class="editorial-layout">
    <section class="main-content-panel">
      <!-- Matrix Feed -->
    </section>

    <aside class="sidebar-panel">
      <!-- Controls & Ingestion -->
    </aside>
  </main>

  <footer class="editorial-footer">
    <span class="mono-log">System Status: Active</span>
  </footer>
</div>
```

---

## 5. CSS Grid Implementation Template

```css
:root {
  --bg-main: #F4F4F2;
  --panel-bg: #FFFFFF;
  --border-grid-dark: #1A1A1A;
  --font-heading: 'Syne', sans-serif;
  --font-mono: 'Space Mono', monospace;
}

.editorial-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  border: 1px solid var(--border-grid-dark);
  background: var(--panel-bg);
}

.mono-btn-primary {
  font-family: var(--font-heading);
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.95rem;
  border: 1px solid var(--border-grid-dark);
  background: #1A1A1A;
  color: #FFFFFF;
  cursor: pointer;
  border-radius: 0;
  text-transform: uppercase;
}

.mono-btn-primary:hover {
  background: #333333;
}
```
