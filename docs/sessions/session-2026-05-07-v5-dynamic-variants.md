# Session 2026-05-07 — v5: Dynamic Variant Types

**Branch:** feat/v5-dynamic-variants → open as PR #8
**Starting tests:** 212 (139 backend, 73 frontend)
**Ending tests:** 223 (139 backend, 84 frontend)

## Goals
Make variant dimensions fully dynamic. Brands can define any variant type (colour, size, material) and specify multiple values per type with individual stock — not hardcoded to size only.

## Architecture Decisions Made
- **ADR-009**: Variant type with value list model (chosen) vs per-variant key-value pairs vs define-axes-then-matrix. Type+values matches major e-commerce admin UX (Shopify-style), enforces consistent key names, maps cleanly to the backend's flat `{ options: { [key]: value }, stock }` shape.

## Key Technical Decisions
- **Backend unchanged** — `inMemoryStore.js` was already fully generic: `search()` routes by `isVariantDimension` for any key, `serializeSchema` exposes `isVariantDimension` per-key. Only frontend and seed data changed.
- `buildVariantTypes(variants)` helper: reverse-engineers the hierarchical type+values structure from the flat backend variants array on edit form load. Groups by options key, collecting `{ id, value, stock }` per key.
- `groupVariantsByKey(variants)` helper added to both ProductCard and ProductDetail: groups flat variant array by options key for grouped display. Reused same implementation in both components.
- Seed data: 3 apparel products (Slim Fit Graphic Tee, Performance Running Shorts, Floral Midi Dress) gain `colour` as a second variant type. `color` removed from their `attributes`.
- CSS: removed old `.variant-row` styles, added `.variant-type-row`, `.variant-type-header`, `.variant-value-row`. Reused existing `.attr-row` for value rows.
- ProductDetail section title: `key.charAt(0).toUpperCase() + key.slice(1)` — renders as "Size", "Colour" (CSS transforms to uppercase in display via `text-transform`).

## Files Added/Changed
- `backend/src/seed.js` — 3 apparel products: colour variants added, `color` removed from attributes
- `frontend/src/components/ProductCard/ProductCard.jsx` — `groupVariantsByKey` helper + grouped chip display
- `frontend/src/components/ProductDetail/ProductDetail.jsx` — `groupVariantsByKey` helper + per-type sections with dynamic title
- `frontend/src/components/ProductForm/ProductForm.jsx` — `buildVariantTypes` helper, new `variantTypes` state, 6 new handlers, type+values JSX, `handleSubmit` flatMap
- `frontend/src/components/ProductForm/ProductForm.css` — `.variant-type-row`, `.variant-type-header` styles
- `docs/adr/ADR-009-dynamic-variant-form-ux.md`

## Tests Green At End
Backend: 139/139 | Frontend: 84/84 | Total: 223/223
