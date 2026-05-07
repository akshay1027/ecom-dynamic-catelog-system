# Session 2026-05-07 — v3: Seed Data + Scalable Attribute Filters

**Branch:** feat/v3-attribute-filters → merged as PR #6
**Starting tests:** 142 (93 backend, 49 frontend)
**Ending tests:** 171 (111 backend, 60 frontend)

## Goals
1. Add 20 more seed products (3 new brands) for richer demo data — 9 → 29 total products
2. Extend attribute filtering: per-category schema discovery, multi-value OR checkboxes for strings, range inputs for numbers, boolean toggles

## Architecture Decisions Made
- **ADR-007**: Attribute Registry Pattern — O(1) schema discovery via secondary `attributeRegistry` Map maintained on every product write. Rejected: O(n) scan, EAV table, Elasticsearch.

## Key Technical Decisions
- 4 storage approaches analyzed before deciding: plain JSONB scan (O(n)), EAV (JOIN explosion), JSONB + Registry (chosen, O(1) schema read), Elasticsearch (overkill)
- Registry stores per-category, per-key: `{ type, values: Set, min, max }` — type-inferred on write
- `search()` extended with three filter modes: array (OR), `{min,max}` object (range), exact match
- `GET /api/v1/products/attributes/schema` route registered BEFORE `/:id` (Express order invariant)
- `AttributeFilters` component: schema-driven, renders checkboxes/range/boolean per type; no attribute names hardcoded
- `useAttributeSchema` hook: fetches schema when category changes, cleanup cancels in-flight requests
- Category change in `SearchFilter` clears all attribute filters to prevent stale cross-category state

## New Seed Products (20 added)
- **Apparel (8)**: Graphic Tee, Zip-Up Hoodie, Cargo Shorts, Floral Dress, Packable Jacket, Yoga Leggings, Chino Pants, Cashmere Turtleneck
- **Furniture (6)**: Ergonomic Chair, Marble Coffee Table, King Bed Frame, Walnut Dresser, Arc Floor Lamp, Floating Wall Shelves
- **Electronics (6)**: Mechanical Keyboard, Wireless Mouse, Android Tablet, Smart Watch, HD Webcam, Bluetooth Speaker
- **New brands**: StreetStyle, ActiveWear, TechGear

## Files Added/Changed
- `backend/src/store/inMemoryStore.js` — `attributeRegistry`, `updateRegistry`, `getAttributeSchema`, `serializeSchema`, extended `search()`
- `backend/src/routes/products.js` — `/attributes/schema` route
- `backend/src/seed.js` — 20 new products, 3 new brands
- `frontend/src/components/AttributeFilters/AttributeFilters.jsx` + `.css` + `.test.jsx`
- `frontend/src/hooks/useProducts.js` — `useAttributeSchema` hook added
- `frontend/src/api/products.js` — `getAttributeSchema`, updated `buildQuery()` for arrays and range objects
- `frontend/src/components/SearchFilter/SearchFilter.jsx` — attribute filter integration
- `frontend/src/pages/CatalogPage.jsx` — `useAttributeSchema` wired up

## Tests Green At End
Backend: 111/111 | Frontend: 60/60 | Total: 171/171
