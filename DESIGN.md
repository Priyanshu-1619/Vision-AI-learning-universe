---
name: Vision AI Learning Universe
description: Warm Dark Study educational proving ground for Data Science, Machine Learning, and Deep Learning
colors:
  bg-canvas: "#0D0F12"
  bg-sidebar: "#12151A"
  bg-surface: "#171B22"
  bg-surface-hover: "#1E232C"
  border-subtle: "#262C36"
  border-focus: "#3B4454"
  text-primary: "#F3F4F6"
  text-secondary: "#B0B7C3"
  text-muted: "#7C8594"
  accent-primary: "#10B981"
  accent-warm: "#F59E0B"
  accent-orange: "#E84A27"
  accent-blue: "#38BDF8"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#EF4444"
typography:
  heading-1:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "2.5rem"
    fontWeight: 400
    lineHeight: 1.2
  heading-2:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "Inter, 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "1.03rem"
    fontWeight: 400
    lineHeight: 1.7
  code:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.88rem"
    fontWeight: 400
rounded:
  card: "8px"
  button: "6px"
  input: "6px"
---

# Design System: Warm Dark Study

## 1. Overview
The "Warm Dark Study" visual language replaces overly cold, industrial, and neon developer interfaces with a welcoming, academic, and tactile digital learning space. It is inspired by late-night scholarly libraries, premium editorial publications, and hands-on science laboratories.

## 2. Colors
- **Canvas:** `#0D0F12` (deep charcoal background for zero eye strain).
- **Sidebar & Rails:** `#12151A` (grounded, structural slate).
- **Cards & Surfaces:** `#171B22` with hover state `#1E232C`.
- **Borders:** `#262C36` (subtle framing) and `#3B4454` (focused / active states).
- **Accents:** Emerald (`#10B981`), Amber Gold (`#F59E0B`), Terracotta (`#E84A27`), Sky Blue (`#38BDF8`).

## 3. Typography
- **Headings:** Newsreader or Georgia. Elegant, editorial serif with normal weight.
- **Body & Prose:** Inter or Plus Jakarta Sans. 16–17px, line height 1.65–1.75 for prolonged readability.
- **Formulas, Data & Code:** JetBrains Mono for mathematical formulas, parameters, metrics, and code snippets.

## 4. Layout
- **Sticky TopBar:** 64px height with clean branding, domain links, search, and student profile/auth triggers.
- **Independent Scrollable Sidebar:** 260px fixed width with organized groups (Study, Domains, Proving Grounds).
- **Main Workspace:** Centered, comfortable measure (65–85ch for prose), fluid responsive grids for cards and labs.

## 5. Elevation & Depth
- Elevation is expressed through subtle background shifts and 1px borders (`#262C36`), supplemented by soft, diffused shadows (`0 4px 20px rgba(0, 0, 0, 0.4)`).
- Glowing neon outlines and harsh stark contrasts are strictly avoided.

## 6. Shapes
- **Cards & Panels:** 8px border-radius.
- **Buttons & Interactive Controls:** 6px border-radius.
- **Inputs & Sliders:** 6–8px border-radius.

## 7. Components
- **Topic Lesson Cards:** Structured W3Schools-inspired sections (What is it, Why need it, Analogy, Math, Visual, Code, Common mistakes, Quiz).
- **Study Toolbar:** Font size adjusters (A- / A+), copy formula, copy code, bookmark, notes, and Hinglish explanation toggle.
- **Laboratory Studio:** Left control rail, prominent responsive Plotly canvas, and pedagogical interpretation panel.

## 8. Do's and Don'ts
- **DO:** Prioritize clarity, educational analogies, readable typography, and tactile parameter controls.
- **DO:** Ensure all mathematical graphs scale to 100% container width with zero horizontal clipping.
- **DON'T:** Use harsh pure black (`#000000`) or glaring neon accents.
- **DON'T:** Use generic placeholder cards without clear learning outcomes.
