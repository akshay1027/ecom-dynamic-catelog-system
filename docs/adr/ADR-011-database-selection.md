# ADR-011: PostgreSQL as the Persistent Store, with Docker Compose for Local Development

**Status:** Accepted
**Date:** 2026-05-11

---

## Context

The catalog was built on an in-memory store deliberately designed to be swappable (ADR-001, ADR-007, ADR-008 all reference Postgres patterns). The next step is replacing in-memory with a real database. The scope includes the full e-commerce data model: products, variants, brands, attribute registry, and future orders and inventory.

---

## Decision

**PostgreSQL 16** as the primary database.
**Knex.js** as the query builder and migration runner.
**Docker Compose** for local development (Postgres + backend + frontend in one command).

---

## Alternatives Considered

### MongoDB
- Natural fit for the `attributes: JSONB` pattern.
- **Rejected:** No FK constraints between brands → products. We already solved schema-flexibility with flat attributes + registry (ADR-007), so MongoDB's document model provides no advantage. Losing FK integrity for no gain is the wrong trade-off as the system expands to orders/inventory.

### MySQL
- Mature, widely used.
- **Rejected:** No native JSONB containment operators (`@>`). ADR-008 explicitly relies on GIN-indexed JSONB for `options` filtering. MySQL's `JSON_CONTAINS` is slower and less ergonomic. The variant filtering logic would need significant rewrites.

### Prisma (ORM)
- Excellent DX, TypeScript-first, auto-generated types.
- **Rejected for now:** The store contract (`inMemoryStore.js`) is already a clean abstraction layer. Migrating to Prisma would mean replacing the store with generated client calls, which breaks the explicit query pattern that makes search filters readable. Knex gives us migrations + query builder without the magic.

---

## Why PostgreSQL

1. **JSONB + GIN indexes** — `attributes @> '{"color":"blue"}'` and `options @> '{"size":"M"}'` are first-class operations, exactly what ADR-007 and ADR-008 specified. GIN indexes make these O(log n) instead of sequential scans.
2. **ACID transactions** — `create()` inserts the product, all variants, and upserts the attribute registry atomically. Stock recomputation on variant changes is a single transaction.
3. **FK constraints** — `product_variants.product_id → products.id` with `ON DELETE CASCADE`; `products.brand_id → brands.id`. These constraints enforce referential integrity at the DB level, not just at the application layer.
4. **Full e-commerce scope** — Future orders, payments, and inventory will share this Postgres instance. ACID and FK constraints matter across the full system. A document store would create integration complexity at service boundaries.
5. **`gen_random_uuid()`** — Native UUID primary keys without an extension.

---

## Schema

```
brands          id (PK), name, logo_url, description, website, timestamps
products        id (PK), name, desc, price, currency, category, type, images (JSONB),
                stock, tags (TEXT[]), attributes (JSONB), brand_id (FK), brand_name,
                timestamps
product_variants  id (PK), product_id (FK → products CASCADE), options (JSONB),
                  stock, timestamps
attribute_registry  (category, key) PK, type, values (TEXT[]), min_val, max_val,
                    is_variant_dimension
```

**Key indexes:**
- GIN on `products.attributes` and `product_variants.options` — powers the dynamic attribute filter queries
- B-tree on `products.category`, `type`, `brand_id`, `price` — powers the scalar filter queries
- Unique index on `LOWER(brands.name)` — enforces case-insensitive uniqueness

---

## Store Contract

The `postgresStore.js` exports the identical interface as `inMemoryStore.js`:
`{ create, findById, update, remove, search, clear, getAttributeSchema, addVariant, updateVariant, removeVariant }`

A factory (`src/store/index.js`) selects the implementation at startup:
- `DATABASE_URL` set → `postgresStore`
- `DATABASE_URL` unset or `USE_IN_MEMORY=true` → `inMemoryStore` (unit test escape hatch)

---

## Docker Compose

Three services: `postgres` (Postgres 16-alpine), `backend` (Node 20-alpine), `frontend` (Node 20-alpine + Vite dev server).

The backend runs `knex migrate:latest` before starting. Switching to a managed Postgres (RDS, Supabase, Neon) in production requires only changing `DATABASE_URL` — zero app code changes.

---

## Consequences

- **Positive:** All product, variant, brand, and attribute data persists across server restarts. Enables future order/inventory tables in the same DB with full referential integrity.
- **Positive:** Dynamic attribute queries use GIN indexes — linear scans on full-table attributes are replaced by index lookups.
- **Positive:** Docker Compose gives full environment parity between dev and prod; deployment to Railway/Render/Fly.io/ECS is a Dockerfile push.
- **Neutral:** `clear()` in `postgresStore` is gated behind `NODE_ENV === 'test'` — it TRUNCATEs tables and cannot run in production.
- **Trade-off:** Knex migration files must be maintained as the schema evolves. Rollback paths are required for every migration. This is the right discipline for a system with real data.
