# Product Evolution

---

## v0 — Catalog Prototype (2026-05-06)
- 9 seed products across 3 categories: apparel, furniture, electronics
- Catalog page: name search, category filter, price range filter
- Product card grid + detail modal on click
- No admin interface — read-only catalog

## v1 — Brands (2026-05-07)
- Brands promoted to first-class entities: `/api/v1/brands` endpoint
- Products linked to brands via `brandId`; `brandName` denormalized for read performance
- Brand filter added to catalog sidebar

## v2 — Admin CRUD + Design System (2026-05-07)
- `/admin` page: two-column layout (brand sidebar + product table)
- Full product CRUD: Add, Edit, Delete with modal form
- Dynamic attribute rows in form: add/remove any key-value pair
- React Router v6: catalog at `/`, admin at `/admin`
- CSS design system: 13 design tokens in `:root`, mobile-responsive with collapsible drawer at 768px

## v3 — Dynamic Attribute Filters (2026-05-07)
- 29 products total (+20 new, 3 new brands: StreetStyle, ActiveWear, TechGear)
- Per-category attribute filters rendered from a live schema endpoint — no attribute names hardcoded in frontend
- Filter types: multi-value OR checkboxes (strings), range sliders (numbers), boolean toggles
- Category change clears all attribute filters to prevent stale cross-category state

## v4 — Product Variants with Stock (2026-05-07)
- Apparel products gain per-size variants: each size has its own stock count
- Size chips on product cards: in-stock sizes shown normally, out-of-stock greyed out
- "Available Sizes" section in product detail with stock indicators
- Catalog filtering by size only matches products with that size in stock (`stock > 0`)
- Admin form: add/edit/remove individual variants (size + stock)

## v5 — Fully Dynamic Variant Types (2026-05-07)
- Brand can define any variant dimension: colour, material, fit — not just size
- Each variant type has multiple values, each value has its own stock
- Product cards show chips grouped by variant type (size row + colour row)
- Product detail shows one labelled section per variant type ("Size", "Colour")
- Admin form: add variant type (named dimension) → add values under it → each value has stock
- 3 apparel products (Graphic Tee, Running Shorts, Floral Dress) now carry colour as a second variant type

---

## Test Count Progression

| Version | Backend | Frontend | Total |
|---|---|---|---|
| v0 | 59 | 23 | 82 |
| v2 | 93 | 49 | 142 |
| v3 | 111 | 60 | 171 |
| v4 | 139 | 73 | 212 |
| v5 | 139 | 84 | 223 |
