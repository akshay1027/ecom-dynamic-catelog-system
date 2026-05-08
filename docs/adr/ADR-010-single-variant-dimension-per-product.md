# ADR-010: Single Variant Dimension Per Product

**Date:** 2026-05-08
**Status:** Accepted
**Deciders:** Akshay R R

---

## Context

Products like apparel can vary by multiple dimensions simultaneously — size AND color AND material. The question is how to model this: one product with multi-key variant options (e.g. `{ size: 'M', color: 'red' }`), or separate products per color variation.

Two options were evaluated:

### Option A — Multi-dimensional variants on one product

A single "Oxford Shirt" product has variants for every combination: `{ size: S, color: white }`, `{ size: M, color: white }`, `{ size: S, color: black }`, etc. Stock is tracked per combination.

| | |
|---|---|
| **Pro** | All color/size combos under one product ID; natural "pick your combo" UX |
| **Con** | Combinatorial explosion — 3 colors × 5 sizes = 15 variants; 4 colors × 6 sizes = 24 variants |
| **Con** | Filtering requires AND logic across multiple keys on the same variant row — more complex query |
| **Con** | Admin form needs a combination matrix UI (generate all N×M rows) — significant UX complexity |
| **Con** | One product = one price and one image set for all color variations; no per-color pricing or images |

### Option B — One variant type per product, separate products per color (chosen)

"Oxford Shirt — White" is one product with size variants [XS, S, M, L, XL].
"Oxford Shirt — Black" is a separate product with the same size variant structure.

| | |
|---|---|
| **Pro** | No combination explosion — a product is always a flat list of one dimension's values |
| **Pro** | Each product has its own price, images, and description — full flexibility per variation |
| **Pro** | `options` JSONB always has exactly one key → filtering is a single containment check |
| **Pro** | Admin form stays simple — one variant type, a list of values with stock |
| **Con** | Product count grows linearly with each additional attribute variation |
| **Con** | No native "same shirt in different colors" grouping without a separate product group concept |

---

## Decision

**Option B.** A product supports exactly one variant type.

---

## Enforcement

- **UI:** `ProductForm.jsx` renders "+ Add Variant Type" only when `variantTypes.length === 0`. Once a variant type is added, the button disappears — the user can only have one.
- **Backend:** No API-level validation enforces single-key `options`. The backend accepts any object shape. The single-key convention is held by the UI and this ADR.
- **Convention in seed data:** All 29 seed products use single-key options: `{ size: 'M' }`, `{ size: '30x30' }` — no product has `{ size: 'M', color: 'red' }`.

---

## Consequences

- `product_variants.options` JSONB will always be a single-key object in practice: `{ "size": "M" }` or `{ "color": "black" }` — never `{ "size": "M", "color": "red" }`.
- The `attributeRegistry` will mark at most one attribute key per product as `isVariantDimension: true` at a time.
- Product list queries filtering on a variant dimension need only one `EXISTS` subquery with a single-key JSONB containment check — no cross-variant AND logic required.
- Inventory management stays linear: a product with 5 sizes has exactly 5 rows in `product_variants`, each independently managed.
- Seeding and testing are simpler — no combination matrix to generate or validate.

---

## Future Path

If multi-dimensional variants become necessary, the `options JSONB` column already supports multi-key objects with **zero schema migration**. What would change:
- Remove the `variantTypes.length === 0` UI guard to allow multiple types
- Update `store.search()` to collect all variant-dimension filters into a single combined options object before running the containment check (AND logic on same row, not sequential independent checks)
- Update `buildQuery()` on the frontend to serialize multiple variant filters into one combined `$variant_filter` param
