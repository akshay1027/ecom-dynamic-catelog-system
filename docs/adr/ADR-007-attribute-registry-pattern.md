# ADR-007: Attribute Registry Pattern for Dynamic Schema Discovery

**Date:** 2026-05-07
**Status:** Accepted
**Deciders:** Akshay R R
**PR:** #6 (feat/v3-attribute-filters)

## Context
The catalog needs a `GET /api/v1/products/attributes/schema?category=apparel` endpoint that returns the set of filterable attributes for a category (their types, distinct string values, number min/max) — used by the frontend to dynamically render checkboxes, range inputs, and boolean toggles without hardcoding attribute names.

The naïve implementation scans all products on every schema request. At 1M products this is a 1-second query every time a user changes the category filter dropdown. This is unacceptable.

## Decision
Maintain a secondary in-memory `attributeRegistry` Map that is updated on every product `create` and `update`. Schema reads are O(1) (a Map lookup). This mirrors a Postgres `attribute_registry` table that is upserted on every product write.

**Four approaches evaluated:**

| Approach | Schema read | Attr filter write | Filter query |
|---|---|---|---|
| **1. Plain JSONB scan** | O(n) products | O(1) | GIN `@>` indexed |
| **2. EAV table** | O(1) JOIN | O(k) INSERTs (k = attributes per product) | JOIN + WHERE indexed |
| **3. JSONB + Registry (chosen)** | O(1) registry read | O(k) upserts to registry table | GIN `@>` indexed |
| **4. Elasticsearch** | O(1) aggregation | async index | Full-text + structured |

## In-Memory Implementation
```javascript
// Module-scope: category → { key → { type, values: Set, min, max } }
const attributeRegistry = new Map();

function updateRegistry(category, attributes) { /* type-infer each key, update registry */ }
// Called in create(), update(), clear()

function getAttributeSchema(category) { /* O(1) registry read + serialize */ }
// Returns: { color: { type: 'string', values: ['black', 'white'] }, ram_gb: { type: 'number', min: 8, max: 32 } }
```

## Postgres Migration Path
```sql
CREATE TABLE attribute_registry (
  category TEXT NOT NULL,
  attribute_key TEXT NOT NULL,
  attribute_type TEXT NOT NULL,          -- 'string' | 'number' | 'boolean'
  is_variant_dimension BOOLEAN DEFAULT FALSE,
  string_values TEXT[] DEFAULT '{}',     -- capped at N distinct values
  number_min DECIMAL,
  number_max DECIMAL,
  PRIMARY KEY (category, attribute_key)
);

-- On product write: upsert per attribute key (O(k) upserts, batched in one transaction)
-- On schema request: SELECT * FROM attribute_registry WHERE category = $1  (O(1), index scan)
-- For attribute filtering: GIN index on products.attributes JSONB column
CREATE INDEX ON products USING GIN(attributes jsonb_path_ops);
```

## Multi-Value OR and Numeric Range Filtering
Extended `store.search()` to support three filter modes on the filter side:
- **Array filter** (`size: ['M', 'L']`): OR match — product must match at least one value
- **Range filter** (`ram_gb: { min: 16, max: 32 }`): numeric bounds on product attribute value
- **Exact match** (`color: 'black'`): backward-compatible scalar equality

## Route Ordering Invariant
`GET /api/v1/products/attributes/schema` MUST be registered before `GET /api/v1/products/:id` in Express. Express routes match in declaration order — without this, the literal path segment `attributes` is matched as a product UUID parameter.

## Consequences
+ Schema discovery is O(1) regardless of catalog size
+ Registry updates are O(k) per product write (k = number of attributes), batched per write
+ Postgres migration requires adding one table and upsert logic — no change to the existing products table
- Registry can become stale if a product is deleted and no other product contributes that attribute value (acceptable: extra values in the schema filter cause no incorrect search results, only phantom filter options)
- Registry does not support attribute removal on product delete (out of scope for prototype)
