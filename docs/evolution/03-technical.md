# Technical Evolution

---

## Data Model

| Version | Change | Why |
|---|---|---|
| v0 | `product.attributes: {}` — flat JSON, any key-value | No class hierarchy needed; JSONB column when DB arrives |
| v0 | Secondary indexes: `byCategory`, `byType`, `byBrand` (Map of Sets) | O(1) category lookups; mirrors DB indexes |
| v1 | `brandId` FK + denormalized `brandName` on product | No join required on catalog reads |
| v3 | `attributeRegistry` Map: per-category, per-key `{ type, values, min, max }` | O(1) schema discovery vs O(n) product scan |
| v4 | `product.variants[]` child array; `isVariantDimension` flag in registry | Separate stock per variant; routes variant vs scalar filter paths cleanly |
| v4 | `product.stock = sum(variant.stock)` recomputed on every variant write | Uniform API surface — consumers always read `product.stock` |
| v5 | `buildVariantTypes(variants)` helper — reconstructs type+values hierarchy from flat variants | Enables round-trip edit form load from arbitrary options keys |

---

## Backend

**v0 — Core store + API**
- `inMemoryStore.js`: `create`, `findById`, `update`, `remove`, `search`, `clear` — swappability contract
- `app.js` never calls `listen()` — Supertest requires this; `server.js` is the entry point
- `search()`: scalar filter on `product.attributes[key]`
- Response envelope: `{ success, data, error }` on every route

**v1**
- `brandStore.js` with same 5-function contract
- `brandName` always set server-side from brand record on product create/update

**v2**
- No backend changes — all new functionality was frontend CRUD calling existing endpoints

**v3**
- `updateRegistry(category, attributes)` called on every `create()` and `update()`
- `GET /api/v1/products/attributes/schema` registered **before** `/:id` (Express order invariant — `attributes` would otherwise match as a UUID param)
- `search()` extended: array filter (OR match), `{min,max}` range filter, scalar exact match

**v4**
- `addVariant`, `updateVariant`, `removeVariant` added to store (exported; contract extended)
- `validateVariant` middleware: `options` must be a non-null, non-array object
- 3 variant CRUD routes: `POST /:id/variants`, `PUT /:id/variants/:vid`, `DELETE /:id/variants/:vid`
- `isVariantDimension: true` in registry entry; `search()` routes variant-dimension filters through `product.variants[].options` with `stock > 0` guard

**v5**
- No backend changes — store was already fully generic on variant options keys

---

## Frontend

**v0**
- `useProducts` hook: `JSON.stringify(filters)` as `useEffect` dep (stable reference for object filters)
- fetch mocked globally in vitest setup — jsdom has no native fetch

**v2**
- React Router v6: `BrowserRouter` in `main.jsx`, routes in `App.jsx`
- `ProductForm`: controlled inputs, dynamic attribute key-value rows with add/remove
- CSS custom properties: 13 design tokens, all component CSS references variables only

**v3**
- `useAttributeSchema` hook: fetches schema on category change, cleanup cancels in-flight requests
- `AttributeFilters` component: fully schema-driven, renders checkbox/range/boolean per attribute type — zero hardcoded names
- Category change in `SearchFilter` clears attribute filters to prevent stale state

**v4**
- `ProductCard`: size chip row — `size-chip--oos` CSS class for out-of-stock variants
- `ProductDetail`: "Available Sizes" section with stock count per variant
- `ProductForm` variants section: flat state `variants: [{ id, size, stock }]`, add/edit/remove rows

**v5**
- `groupVariantsByKey(variants)`: groups flat variants array by options key → used in both `ProductCard` and `ProductDetail`
- `ProductCard`: chips rendered per group (one row per variant type)
- `ProductDetail`: one section per variant type with dynamic capitalized title
- `ProductForm` state replaced: `variantTypes: [{ key, values: [{ id, value, stock }] }]`
- `buildVariantTypes(variants)`: reconstructs hierarchical state from flat backend array on edit load
- `handleSubmit`: `flatMap` flattens type+values back to `[{ options: { [key]: value }, stock }]`

---

## Postgres Migration Readiness

Each design decision maps cleanly to SQL:

```
products.attributes JSONB  →  GIN index for scalar attribute filtering
attribute_registry table   →  upserted on every product write; SELECT O(1) on schema request
product_variants table     →  one row per variant, options JSONB with GIN index
                           →  @> containment query for variant dimension filtering
```

No layer has hardcoded knowledge of specific attribute or variant keys — the schema is fully data-driven at every level.
