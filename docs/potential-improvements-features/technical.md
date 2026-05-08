# Technical Improvements — Potential Work

_Transcribed from notebook, 07/05/26_

![Technical & Code notebook page](images/technical-code.jpeg)

---

## 1. Infrastructure Setup

Current state: Node.js + Express running locally, in-memory store, no deployment.

Target state:

| Component | What to add |
|---|---|
| **Database** | Postgres — replace in-memory store; persistent, queryable, production-ready |
| **Docker** | Multistage build — separate build and runtime layers, minimal production image |
| **Local tunneling** | Ngrok — expose local dev server for webhook testing (WhatsApp, payment callbacks) |
| **Deployment** | AWS — ECS or EC2 for the Node API, RDS for Postgres |
| **IaC** | Terraform — provision VPC, RDS, ECS cluster, S3, CloudFront, Route53 |
| **Cache / Sessions** | Redis — session store, product cache, rate limiting |

---

## 2. Data Schema

The core design question: how do we store the dynamic aspects of the catalog (attributes, variant types) in a relational DB without schema migrations every time a new attribute is added?

Answer from the notes: **attribute-lookup table** (EAV-adjacent pattern).

**Tables:**

```
users
  id, email, password_hash, phone, role, created_at

brands
  id, name, slug, logo_url, sponsored, created_at

products
  id, name, description, brand_id, category, base_price, stock,
  image_url, tags[], created_at, updated_at

product_attributes          ← attribute-lookup table
  id, product_id, key, value, data_type

attribute_registry
  id, category, key, data_type, allowed_values[], created_at

product_variants
  id, product_id, sku, price, stock, attributes (jsonb or FK to attribute table)

users_saved_products
  user_id, product_id, saved_at

orders / order_items
  (checkout flow support)

product_reviews
  id, product_id, user_id, rating, body, created_at
```

The `attribute-lookup table` (`product_attributes`) decouples attribute schema from the product table — adding a new attribute type requires no migration.

---

## 3. Authentication & Authorization

- **Auth mechanism**: JWT (stateless) with refresh token, or Redis-backed sessions
- **Registration / login**: email + password (bcrypt), optional OAuth (Google)
- **Roles**:
  - `guest` — browse, search, view products
  - `customer` — all guest + cart, checkout, reviews, wishlist
  - `admin` — all customer + product/brand CRUD, review moderation, analytics
- **RBAC middleware**: role check on every protected route
- **Passwords**: bcrypt hash, never stored plain; reset via email token

---

## 4. Image Uploading

Current state: products use external image URLs hardcoded in seed data.

Target state:

- **Upload API**: `POST /api/v1/upload` — accepts multipart/form-data, streams to S3
- **S3 bucket**: per-environment (dev/prod), private with signed URL reads or public CDN path
- **CDN**: CloudFront in front of S3 — cache images at edge, reduce latency
- **Product image gallery**: multiple images per product (array of URLs), primary image flag
- **Validation**: file type (jpeg/png/webp), max size, virus scan (optional)

---

## 5. Pagination & On-Demand Loading

Current state: offset-based pagination already in search (`page`, `limit` query params).

Improvements:

- **Cursor/keyset pagination** — replace offset with `cursor` (last seen ID or timestamp); avoids drift on insert-heavy catalogs
- **Infinity scroll on frontend** — IntersectionObserver triggers next page fetch when user nears bottom; appends to existing list rather than replacing
- **On-demand loading** — product images lazy-loaded (`loading="lazy"`), variant data fetched only when variant picker is opened
- **Virtual list** — for very large result sets, render only visible rows (react-virtual or similar)

---

## 6. Postgres Migration & Scaling

This section maps every in-memory construct to its Postgres equivalent and documents how to scale catalog read queries at volume.

---

### Table Definitions

Each in-memory structure has a direct Postgres counterpart. The interface contract (`create`, `findById`, `update`, `remove`, `search`) stays the same — only the implementation changes.

#### `brands` table
Maps from `brandStore.js` `brands` Map.

```sql
CREATE TABLE brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  logo_url    TEXT DEFAULT '',
  description TEXT DEFAULT '',
  website     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Replaces the case-insensitive uniqueness check in brandStore.js:12
CREATE UNIQUE INDEX idx_brands_name_ci ON brands (LOWER(name));
```

#### `products` table
Maps from `inMemoryStore.js` `store` Map.

```sql
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  currency    CHAR(3) NOT NULL DEFAULT 'USD',
  category    TEXT NOT NULL,
  type        TEXT NOT NULL,
  images      TEXT[] DEFAULT '{}',
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  tags        TEXT[] DEFAULT '{}',
  attributes  JSONB NOT NULL DEFAULT '{}',
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  brand_name  TEXT NOT NULL DEFAULT '',
  search_vec  TSVECTOR GENERATED ALWAYS AS (
                to_tsvector('english', name || ' ' || description)
              ) STORED,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Replaces byCategory, byType, byBrand secondary index Maps in inMemoryStore.js:7-9
CREATE INDEX idx_products_category    ON products(category);
CREATE INDEX idx_products_type        ON products(type);
CREATE INDEX idx_products_brand_id    ON products(brand_id);
CREATE INDEX idx_products_cat_price   ON products(category, price);   -- composite: category + price range

-- GIN indexes for JSONB and full-text filtering
CREATE INDEX idx_products_attributes  ON products USING GIN(attributes);
CREATE INDEX idx_products_search      ON products USING GIN(search_vec);

-- Partial index: only in-stock products (most catalog pages filter stock > 0)
CREATE INDEX idx_products_cat_instock ON products(category, price) WHERE stock > 0;
```

#### `product_variants` table
Maps from `product.variants[]` nested array. Extracted to its own table for independent stock updates.

```sql
CREATE TABLE product_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  options     JSONB NOT NULL DEFAULT '{}',   -- always single-key per ADR-010, e.g. {"size":"M"}
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GIN index: powers options @> '{"size":"M"}' containment queries
CREATE INDEX idx_variants_options_gin ON product_variants USING GIN(options);

-- Partial index: only in-stock variants (variant dimension filters always include stock > 0)
CREATE INDEX idx_variants_instock     ON product_variants(product_id) WHERE stock > 0;
```

#### `attribute_registry` table
Maps from `attributeRegistry` Map in `inMemoryStore.js:13`. Persisted so it survives restarts.

```sql
CREATE TABLE attribute_registry (
  category       TEXT NOT NULL,
  attribute_key  TEXT NOT NULL,
  attribute_type TEXT NOT NULL CHECK (attribute_type IN ('string', 'number', 'boolean')),
  string_values  TEXT[] DEFAULT '{}',   -- enumerated values for string attributes
  num_min        NUMERIC,               -- observed minimum for number attributes
  num_max        NUMERIC,               -- observed maximum for number attributes
  is_variant_dim BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (category, attribute_key)
);
```

Upsert called on every product write — replaces `updateRegistry()` in `inMemoryStore.js:20-39`:

```sql
INSERT INTO attribute_registry
  (category, attribute_key, attribute_type, string_values, num_min, num_max, is_variant_dim)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (category, attribute_key) DO UPDATE SET
  string_values  = ARRAY(SELECT DISTINCT UNNEST(attribute_registry.string_values || EXCLUDED.string_values)),
  num_min        = LEAST(attribute_registry.num_min, EXCLUDED.num_min),
  num_max        = GREATEST(attribute_registry.num_max, EXCLUDED.num_max),
  is_variant_dim = attribute_registry.is_variant_dim OR EXCLUDED.is_variant_dim,
  updated_at     = NOW();
```

#### Stock sync trigger
Replaces `recomputeStockFromVariants()` in `inMemoryStore.js:288-291`. Fires automatically after any variant insert/update/delete and keeps `products.stock` in sync.

```sql
CREATE OR REPLACE FUNCTION sync_product_stock() RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock      = (SELECT COALESCE(SUM(stock), 0) FROM product_variants WHERE product_id = NEW.product_id),
      updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_stock
AFTER INSERT OR UPDATE OR DELETE ON product_variants
FOR EACH ROW EXECUTE FUNCTION sync_product_stock();
```

---

### Single Variant Type Per Product — Schema Consequence

See [ADR-010](../adr/ADR-010-single-variant-dimension-per-product.md) for the full decision.

The key consequence for the data layer:

- `product_variants.options` is always a **single-key** JSONB object: `{ "size": "M" }` or `{ "color": "black" }` — never `{ "size": "M", "color": "red" }`.
- The GIN index on `options` only ever needs to evaluate single-key containment: `options @> '{"size":"M"}'`.
- A product with 5 size variants has exactly **5 rows** in `product_variants`. No combination explosion.
- The `attribute_registry` marks at most one key per product as `is_variant_dim = true` at a time.
- Variant dimension filtering needs only **one `EXISTS` subquery** — no AND logic across multiple variant keys required.

---

### Scaling Read Queries

#### Index selection (mirrors `store.search()` candidate narrowing in `inMemoryStore.js:218-227`)

| Filter present | Index used |
|---|---|
| `category` only | `idx_products_category` |
| `category` + price range | `idx_products_cat_price` |
| `brand_id` only | `idx_products_brand_id` |
| `category` + `stock > 0` | `idx_products_cat_instock` (partial) |
| JSONB attribute filter | `idx_products_attributes` (GIN) |
| Variant dimension filter | `idx_variants_options_gin` (GIN) |
| Full-text name search | `idx_products_search` (GIN tsvector) |

#### Canonical filter query

```sql
SELECT p.*
FROM products p
WHERE
  (p.category  = $1 OR $1 IS NULL)
  AND (p.brand_id  = $2 OR $2 IS NULL)
  AND (p.price    >= $3 OR $3 IS NULL)
  AND (p.price    <= $4 OR $4 IS NULL)
  -- Full-text search — replaces ILIKE '%term%', uses GIN tsvector index
  AND ($5 IS NULL OR p.search_vec @@ plainto_tsquery('english', $5))
  -- Non-variant attribute filter — JSONB containment, uses GIN index
  -- e.g. $6 = '{"color":"white"}' or '{"material":"cotton"}'
  AND ($6::jsonb IS NULL OR p.attributes @> $6::jsonb)
  -- Numeric range on JSONB attribute (cast required; no dedicated index — use for low-cardinality only)
  AND ($7 IS NULL OR (p.attributes->>'width_cm')::numeric >= $7)
  -- Variant dimension filter — single-key per ADR-010
  -- e.g. $8 = '{"size":"M"}' — matched against options JSONB using GIN index
  AND ($8::jsonb IS NULL OR EXISTS (
    SELECT 1 FROM product_variants pv
    WHERE pv.product_id = p.id
      AND pv.options @> $8::jsonb
      AND pv.stock > 0
  ))
ORDER BY p.created_at DESC
LIMIT $9 OFFSET $10;
```

Note: `ILIKE '%term%'` scans every row. The `search_vec @@ plainto_tsquery(...)` pattern uses the GIN index and handles stemming — "shirts" matches "shirt".

#### Caching strategy (Redis)

| What to cache | Redis key | TTL | Invalidate on |
|---|---|---|---|
| Attribute schema (per category) | `attr_schema:{category}` | 5 min | Any product write in that category |
| Attribute schema (all categories) | `attr_schema:all` | 5 min | Any product write |
| Brand list | `brands:list` | 1 hr | Brand create / update / delete |
| Single product | `product:{id}` | 15 min | Product update / delete |
| **Product list pages** | — | **Do not cache** | See below |

**Why not cache product list queries:** Each unique filter combination produces a separate cache key. Any stock change or product update could invalidate thousands of list keys. The hit rate is low (filter combinations are near-infinite), and stock correctness matters — a cached page showing "in stock" when the item just sold out is a live UX defect. Good Postgres indexes + PgBouncer connection pooling (transaction mode) handle catalog list queries at significant scale before Redis list caching becomes worth the invalidation complexity.

**Highest-value cache target — attribute schema:** Every catalog page load fetches the schema for the selected category (to render filter controls). It changes only when a product with a new attribute value is created or updated. Cache it with a short TTL, and invalidate explicitly (`DEL attr_schema:{category}`) after any product write in that category.

**Cache-aside pattern:**

```
Read:
  value = Redis.GET(key)
  if value: return value
  value = DB.query(...)
  Redis.SET(key, value, EX ttl)
  return value

Write:
  DB.update(...)
  Redis.DEL(key)   ← invalidate, don't update; avoids race condition between write and cache set
```
