# ADR-006: CSS Custom Properties Design System

**Date:** 2026-05-07
**Status:** Accepted
**Deciders:** Akshay R R
**PR:** #5 (feat/v2-ui-admin)

## Context
The v1 UI had hardcoded hex values (`#af33fa`, `#8b28c8`) scattered across 8+ component CSS files. Changing the primary color required a global search-and-replace. Mobile layout had no standardized breakpoint or drawer pattern.

## Decision
Define all design tokens as CSS custom properties on `:root` in `frontend/src/index.css`. All component CSS files reference only variables, never raw hex values. Mobile uses a collapsible drawer pattern at the 768px breakpoint.

## Token Set
```css
:root {
  --color-primary: #af33fa;
  --color-primary-light: #f3e6ff;
  --color-primary-dark: #8b28c8;
  --color-text: #1a1a2e;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-bg: #f8f7ff;
  --color-surface: #ffffff;
  --color-error: #dc2626;
  --color-success: #16a34a;
  --radius-card: 12px;
  --radius-input: 8px;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(175,51,250,0.06);
  --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(175,51,250,0.15);
}
```

## Mobile Drawer Pattern
At ≤768px, the filter sidebar becomes a fixed overlay that slides in from the left:
- Hidden by default: `transform: translateX(-100%)`
- Shown with `.open` class: `transform: translateX(0)`
- `drawerOverlay` div covers the rest of the screen; click closes the drawer
- Toggle button (hamburger icon) visible only on mobile

## Alternatives Considered
1. **CSS-in-JS (styled-components / emotion)**: rejected — adds a runtime dependency and build step; overkill for a prototype with a known, small component set.
2. **Tailwind CSS**: rejected — would require replacing all existing className strings; migration cost not justified mid-project.
3. **SCSS variables**: rejected — requires a preprocessor; CSS custom properties give the same benefit with zero tooling and are natively inspectable in DevTools.

## Consequences
+ Rebrand by editing one file (13 variables)
+ All components inherit brand colors automatically
+ Variables are inspectable and overridable in browser DevTools
+ Mobile drawer is accessible (focus-trappable, overlay-dismissable)
- Custom properties have no compile-time type checking — a typo produces a silent fallback to the browser default
- Mobile drawer state is local to App.jsx — acceptable for a single-sidebar layout
