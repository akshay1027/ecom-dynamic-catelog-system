# ADR-008: Product Variants with JSONB Options for Size (and Future Color, Material)

**Date:** 2026-05-07
**Status:** Accepted
**Deciders:** Akshay R R
**PR:** #7 (feat/v4-product-variants)

## Context
A single shirt listing is available in sizes S, M, L, XL — each with its own stock count. Storing `size: 'M'` as a scalar attribute on the product row loses per-size inventory. Storing `size: ['S','M','L','XL']` as an array loses per-size stock and creates write contention (every stock update rewrites the product row and invalidates GIN index entries).

Color and material will become variant dimensions in future phases. The data model must accommodate new variant axes without schema migrations.

## Decision
Introduce a `product_variants` child entity: one row per available variant, with a `options JSONB` field for the variant dimensions (e.g., `{"size": "M"}`, future: `{"size": "M", "color": "black"}`), and an integer `stock` field. Catalog filtering by variant dimensions checks in-stock variants (`stock > 0`) only.

## Evaluated Approaches

| Approach | Filter query | Stock update | Schema migration for new axis | Chosen? |
|---|---|---|---|---|
| Array in `products.attributes` (`size: ['S','M','L']`) | GIN `@>` containment | Rewrite product row | None (append to array) | ✗ — loses per-size stock |
| Map in `products.attributes` (`size_stocks: {"S":20,"M":0}`) | Complex JSONB path | Rewrite product row | None | ✗ — awkward schema, write amplification |
| EAV: `variant_options(variant_id, key, value)` | JOIN × 2 (variant + option) | Single row UPDATE | None | ✗ — JOIN explosion, N rows per variant |
| **JSONB options on variants table (chosen)** | GIN `@>` on variants | Single row UPDATE | None (add key to JSONB) | ✓ |
| Fixed columns (`size TEXT, color TEXT`) | Standard WHERE | Single row UPDATE | ALTER TABLE | ✗ — schema migration per new axis |

## Postgres Data Model
```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  options JSONB NOT NULL DEFAULT '{}',   -- {"size": "M"} | Phase 2: {"size": "M", "color": "black"}
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku TEXT UNIQUE,
  UNIQUE (product_id, options)           -- prevents duplicate variants per product
);
CREATE INDEX ON product_variants USING GIN(options);
CREATE INDEX ON product_variants (product_id);
```

## Key Queries
```sql
-- Catalog filter: apparel with in-stock size M (GIN-indexed @> containment)
SELECT DISTINCT p.*
FROM products p
JOIN product_variants pv ON pv.product_id = p.id
  AND pv.options @> '{"size": "M"}'::jsonb
  AND pv.stock > 0
WHERE p.category = 'apparel';

-- Phase 2: size M AND color black — single @> query, same index
AND pv.options @> '{"size": "M", "color": "black"}'::jsonb

-- Stock update (hot path — single row, no JSONB rewrite)
UPDATE product_variants SET stock = $1 WHERE id = $2;
```

## In-Memory Implementation
Products gain a `variants: []` array. The `attributeRegistry` gains an `isVariantDimension` flag per attribute key: when true, `search()` routes filtering through `product.variants[].options` (requiring `stock > 0`) instead of `product.attributes[key]`.

```javascript
// store.search() attribute filter — variant dimension branch:
const catReg = attributeRegistry.get(product.category) || {};
if (catReg[key]?.isVariantDimension) {
  const match = (product.variants || [])
    .filter(v => matches(v.options[key], val))
    .filter(v => v.stock > 0);
  if (match.length === 0) return false;
}
```

## `product.stock` Semantics
For variant products: `product.stock = sum(variant.stock)`, recomputed on every variant write. For non-variant products: `product.stock` is the direct inventory count. This keeps the API surface uniform — consumers always read `product.stock` for total available inventory.

## Phase Roadmap
- **Phase 1 (this PR)**: `size` as variant dimension for apparel
- **Phase 2**: `color` as variant dimension — add `color` key to variant `options`, update registry. Zero schema migration.
- **Phase 3**: `material` as variant dimension — same pattern.
- **Full Postgres swap**: Add `product_variants` table, GIN index. Existing `products.attributes` JSONB + GIN index for scalar attr filtering.

## Consequences
+ Stock update is a single row update — no lock contention, no JSONB rewrite
+ New variant axes (color, material) require no schema migrations
+ `@>` containment is GIN-indexed — variant filter query is O(log n)
+ `isVariantDimension` registry flag cleanly separates variant vs scalar attribute filtering paths
- `product.stock` is a computed aggregate — must be kept in sync on every variant write (handled by `recomputeStockFromVariants()` helper in the store)
- Deleting a product cascades to all its variants — correct behavior, but callers should be aware
- Variant option uniqueness relies on JSONB equality — Postgres enforces this correctly; in-memory store must check manually on add (currently not enforced — acceptable for prototype)
