# ADR-005: Brand Entity with FK Relationship to Products

**Date:** 2026-05-06
**Status:** Accepted
**Deciders:** Akshay R R
**PR:** #4 (feat/v1-brands)

## Context
Products need an owning brand for filtering and display. Decide whether brands are a freeform string on the product or a first-class entity with its own CRUD.

## Decision
Brand is a separate entity (`/api/v1/brands`) with its own in-memory store. Products hold a `brandId` (FK) and a denormalized `brandName` field. A `GET /api/v1/products?brandId=uuid` filter is supported.

## Alternatives Considered
1. **Freeform string on product** (`brand: 'Nike'`): rejected — no way to rename a brand across all products atomically; no central brand catalog for the admin UI.
2. **Embedded brand object on product** (`brand: { id, name }`): rejected — write amplification on brand rename (update every product); inconsistency if some products are updated and others are not.
3. **Normalize fully, no denormalization**: rejected — every product list response would require a JOIN or a secondary lookup; denormalizing `brandName` avoids this at the cost of a stale-name edge case (acceptable for prototype).

## Data Model
```javascript
// brandStore: separate in-memory Map
{ id: uuid, name: 'Nike', description: '...' }

// products gains:
{ brandId: 'uuid', brandName: 'Nike', ... }
```

## Postgres Migration Path
```sql
CREATE TABLE brands (id UUID PRIMARY KEY, name TEXT UNIQUE, description TEXT);
CREATE TABLE products (
  ...
  brand_id UUID REFERENCES brands(id),
  brand_name TEXT  -- denormalized for read performance; refreshed on brand update
);
CREATE INDEX ON products (brand_id);
```

## Consequences
+ Brands can be listed, searched, and updated independently
+ Product list response includes `brandName` without a JOIN
+ Admin UI can group products by brand without extra lookups
- `brandName` can go stale if a brand is renamed and the product is not re-fetched (handled in any real implementation via an update trigger or event)
- Two stores to clear in tests: both `store.clear()` and `brandStore.clear()` needed in `beforeEach`
