# Session 2026-05-07 — v4: Product Variants with Per-Size Stock (Phase 1)

**Branch:** feat/v4-product-variants → open as PR #7
**Starting tests:** 171 (111 backend, 60 frontend)
**Ending tests:** 212 (139 backend, 73 frontend)

## Goals
Extend the product model to support multiple size variants, each with its own stock. Phase 1: size only. Color and material planned for Phase 2+.

## User Clarifications That Shaped the Design
1. **"How are we planning to search and show custom attributes scalably? Assume Postgres."** → Led to full architecture analysis (4 approaches) before implementation of ADR-007 in the previous session
2. **Variants vs display-only** → user chose "product variants with separate stock" (not just an array of size labels)
3. **Always multi-value UI** → ProductForm stores all attribute values as arrays going forward
4. **Stock-aware filter** → catalog hides products where the selected size has `stock = 0`
5. **Card display** → all size chips shown on card, out-of-stock sizes greyed/strikethrough

## Architecture Decisions Made
- **ADR-008**: Product variants with JSONB options — `product_variants(id, product_id, options JSONB, stock INTEGER)` table. GIN index on `options` for `@>` containment queries. Rejected: size array on product row (loses per-size stock), EAV (JOIN explosion), fixed columns (schema migration per new axis).

## Key Technical Decisions
- `isVariantDimension` flag added to `attributeRegistry` entries — cleanly separates variant filtering path from scalar attribute filtering path in `search()`; existing electronics/furniture filter logic completely unchanged
- `product.stock = sum(variant.stock)` recomputed on every variant write by `recomputeStockFromVariants()` helper — keeps API surface uniform
- Three new variant CRUD endpoints: `POST /:id/variants`, `PUT /:id/variants/:vid`, `DELETE /:id/variants/:vid`
- `validateVariant` middleware: validates `options` is a non-null, non-array object
- Apparel seed data: 11 products updated — `size` removed from `attributes`, `variants` array added with realistic size ranges and stock values
- `ProductForm` Variants section: add/edit/remove individual variants (size + stock) with state management parallel to existing attribute rows

## Phase 2 Readiness
Adding `color` as a variant dimension requires:
1. Update seed data: add `color` key to variant `options` objects
2. `isVariantDimension: true` for `color` in registry (auto-set when first product with color variant is created)
3. Zero store, route, or schema changes

## Files Added/Changed
- `backend/src/store/inMemoryStore.js` — `isVariantDimension` in registry, variant-aware `search()`, `addVariant`, `updateVariant`, `removeVariant`
- `backend/src/models/product.js` — `variants` in `ALLOWED_FIELDS` + `sanitizeProduct`
- `backend/src/middleware/validate.js` — `validateVariant`
- `backend/src/routes/products.js` — 3 variant CRUD routes
- `backend/src/seed.js` — 11 apparel products updated with size variants
- `backend/tests/unit/validate.test.js` — new test file
- `frontend/src/api/products.js` — `addVariant`, `updateVariant`, `removeVariant`
- `frontend/src/components/ProductCard/ProductCard.jsx` + `.css` — size chips
- `frontend/src/components/ProductDetail/ProductDetail.jsx` + `.css` — Available Sizes section
- `frontend/src/components/ProductForm/ProductForm.jsx` + `.css` — Variants section

## Tests Green At End
Backend: 139/139 | Frontend: 73/73 | Total: 212/212
