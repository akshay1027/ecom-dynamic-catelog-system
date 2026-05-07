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
