# ecom-dynamic-catalog-system

Dynamic e-commerce catalog prototype with a React frontend and an Express backend. Uses an in-memory store — no database setup required.

---

<details>
<summary><strong>How I Built This</strong></summary>

### Approach: breadth over depth, speed and scalability in parallel

The project was scoped around one principle — cover as much of the product surface as possible before going deep on any single feature. The alternative (build auth, pagination, and a Postgres setup properly before touching the catalog) would have produced a technically complete but narrow system. Instead, the goal was to have a working catalog, working admin, working attribute filters, and working variants — each at an MVP level — so the full shape of the system is visible and each vertical can be extended independently.

The project shipped ~5 versions across distinct phases: initial prototype → UI + admin panel → attribute filters → product variants → dynamic variant types. Each phase was a PR, an ADR where a real tradeoff was made, and a session doc capturing what was built and why. Speed was preserved by keeping the store in-memory and deferring infrastructure. Scalability was preserved by designing the data model — JSONB attributes, store interface contract, attribute registry — so that nothing needs to be re-architected when the infrastructure catches up.

There is plenty of room to go deeper on every part of it: the UX can be improved, more features can be added, the Postgres migration can be done, auth can be added. But the foundation is set so those extensions happen on top of something real, not alongside something half-built.

### Three tracks in parallel

The project was mentally split into three tracks from the start:

- **Product** — what features to build, in what order, with what UX tradeoffs
- **Technical** — data model, API design, store contract, TDD discipline
- **Claude Code workflow** — how to work with Claude effectively: plan mode before any non-trivial task, skills for repeatable patterns, structured prompts with the right amount of context

Priority went to product and workflow. Technical depth (Postgres, auth, pagination) was deliberately deferred — the in-memory store was designed to be swappable precisely so that deferral wouldn't create rework later.

### TDD from day one

Every feature started with a failing test. The discipline was: write the test, confirm it's red, write the minimum code to make it green, refactor. This was enforced mechanically — a PostToolUse hook auto-ran tests on every file save, and a pre-commit hook blocked commits when tests were red. Claude generated the tests first, not as an afterthought. By the end of the project: 223 tests across backend and frontend. The red-green-refactor loop, combined with Claude generating code against known-failing tests, was the single biggest reason the system stayed bug-free across five phases of changes.

### Data model designed to extend, not just to work

Every architectural decision was filtered through one question: can this extend without a migration? Flat `attributes: {}` JSON means adding a new attribute type requires zero schema changes. Variants as a separate entity with `options JSONB` means adding a new variant axis (color, material) requires no schema change — just a UI and logic change. The attribute registry updates at write time so schema reads are O(1) regardless of product count. The store exports a fixed interface so the entire data layer swaps with one `require()` change.

### Variants — scoping a real-world observation

The variant design came from observing how inventory actually works: a shirt's stock isn't one number, it's split by size. A product has one variant type (size), and multiple values under it (XS, S, M, L, XL) each with independent stock. Rather than try to handle multi-dimensional variants (size × color × material) upfront — which would have meant a combination matrix UI and more complex filtering — the scope was held to one variant type per product. A black shirt and a white shirt are separate products. The data model supports multi-dimensional variants with no schema change; the decision to not expose that in the UI was deliberate and is documented in ADR-010.

### Orchestrator-worker pattern

Implementation predominantly followed an orchestrator-worker model. The main agent (orchestrator) held the plan, made architectural decisions, and broke work into independent subtasks. Sub-agents (workers) ran those subtasks in parallel — one exploring the codebase, one reading ADRs, one writing tests. This kept the main context clean and allowed genuinely parallel execution: two agents exploring different parts of the codebase simultaneously is faster and produces less context noise than a single agent doing both sequentially.

### Claude Code as a workflow tool — including to set up itself

Claude Code was used not just to write code but to configure the environment it runs in. The CLAUDE.md context files, PostToolUse hooks, pre-commit hooks, and skill files were all set up with Claude's own assistance. This created a continuous evaluation loop: every file save triggered tests automatically, every commit was blocked if tests were red, and every session had a structured prompt that carried the right context. The workflow compound-improved across sessions because each session doc fed context into the next one. Plan mode before every non-trivial task meant architectural decisions were made before implementation, not during it.

</details>

---

<details>
<summary><strong>Tech Stack</strong></summary>

| Layer     | Technology                        | Port |
|-----------|-----------------------------------|------|
| Backend   | Node.js + Express 5               | 3001 |
| Frontend  | React 19 + Vite 6                 | 5173 |
| Store     | In-memory (no DB required)        | —    |
| Tests     | Jest (backend), Vitest + RTL (frontend) | — |

</details>

---

<details>
<summary><strong>Prerequisites</strong></summary>

- Node.js ≥ 18 (developed on v22)
- npm

</details>

---

<details>
<summary><strong>Setup</strong></summary>

```bash
git clone https://github.com/akshay1027/ecom-dynamic-catelog-system.git
cd ecom-dynamic-catelog-system

# Install dependencies for each service
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

</details>

---

<details>
<summary><strong>Running</strong></summary>

Open two terminals from the project root:

```bash
# Terminal 1 — backend
npm run dev:backend
# Starts on http://localhost:3001
# Seed data loads automatically on startup

# Terminal 2 — frontend
npm run dev:frontend
# Opens on http://localhost:5173
```

</details>

---

<details>
<summary><strong>API</strong></summary>

Base URL: `http://localhost:3001/api/v1/products`

</details>

---

<details>
<summary><strong>Testing</strong></summary>

```bash
npm test               # run all tests (backend + frontend)
npm run test:backend   # Jest only
npm run test:frontend  # Vitest only
```

</details>

---

<details>
<summary><strong>Data Models</strong></summary>

### Brand

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | auto-generated, immutable | — |
| name | string | 1–100 chars, unique (case-insensitive), required | — |
| logoUrl | string | valid URL | defaults to `''` |
| description | string | free text | defaults to `''` |
| website | string | valid URL | defaults to `''` |
| createdAt | ISO 8601 | immutable | set on create |
| updatedAt | ISO 8601 | — | updated on every write |

### Product

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | auto-generated, immutable | — |
| name | string | 1–200 chars, required | — |
| description | string | free text | defaults to `''` |
| price | number | ≥ 0, required | base/average price |
| currency | string | ISO 4217 (3 chars), required | defaults to `'USD'` |
| category | string | required | indexed |
| type | string | required | indexed |
| images | string[] | valid URLs | defaults to `[]` |
| stock | number | ≥ 0 | auto-computed as sum of variant stocks when variants exist |
| tags | string[] | — | defaults to `[]` |
| attributes | object | flat key-value, no nesting | values may be string, number, or boolean |
| variants | Variant[] | nested array | — |
| brandId | UUID | must reference a valid Brand, required | indexed |
| brandName | string | denormalized from Brand | Read heavy data |
| createdAt | ISO 8601 | immutable | — |
| updatedAt | ISO 8601 | — | — |

### Variant (nested inside Product)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | auto-generated, immutable | — |
| options | object | flat key-value, required | e.g. `{ size: 'M', color: 'red' }` |
| stock | number | ≥ 0 | per-variant inventory |

### Attribute Schema (dynamic — not a stored entity)

Inferred at write time from `product.attributes` and `variant.options` for each category. Stored in an in-memory registry and served via `GET /api/v1/products/attributes/schema?category=<category>`. The frontend uses this to render the correct filter control per attribute (checkbox list, range slider, or toggle).

| Field | Type | Notes |
|---|---|---|
| type | `'string'` \| `'number'` \| `'boolean'` | inferred from observed values |
| values | string[] | string attributes only — enumerated observed values |
| min / max | number | number attributes only — observed bounds |
| isVariantDimension | boolean | `true` if the key appears in any `variant.options` |

### Relationships

```
Brand (1) ──────────────────────────── (many) Product
  │
  ├── Product.brandId  = Brand.id
  └── Product.brandName (denormalized — set server-side)

Product (1) ──────────────────────────── (many) Variant
  └── Variants are nested in Product.variants[]
      No separate collection; no foreign key.

Product.attributes  ──► attributeRegistry (per category)
Variant.options     ──► attributeRegistry (isVariantDimension: true)
```

</details>

---

<details>
<summary><strong>Frontend–Backend Interaction</strong></summary>

### Catalog page load

1. `CatalogPage` mounts and calls three hooks in parallel: `useProducts({})`, `useBrands()`, `useAttributeSchema({ category: undefined })`.
2. Each hook fires its respective `GET` request to the backend and sets local state on response.
3. `ProductList` renders the returned items; `SearchFilter` populates the brand dropdown from the brands list; `AttributeFilters` renders controls from the schema.

### Filtration flow

This is the core interactive loop — every filter change the user makes goes through this path:

```
User interaction (SearchFilter / AttributeFilters)
        │
        ▼
SearchFilter.update(patch)
  Merges patch into filter state, strips empty values,
  calls onFiltersChange(next)
        │
        ▼
CatalogPage.setFilters(next)
        │
        ▼
useProducts(filters) — effect fires (filters in dep array)
  calls productsApi.list(filters)
        │
        ▼
buildQuery(filters)  [frontend/src/api/products.js]
  Serializes to URLSearchParams:
    string arrays  → attributes[color][]=red&attributes[color][]=blue
    range objects  → attributes[size][min]=10&attributes[size][max]=50
    booleans       → attributes[premium]=true
        │
        ▼
GET /api/v1/products?name=...&category=...&attributes[...]...
        │
        ▼
Route handler  [backend/src/routes/products.js]
  req.query.attributes arrives as a nested object
  (Express parses bracket notation automatically)
  Builds filters object, casts numeric strings to numbers
  Calls store.search(filters)
        │
        ▼
store.search()  [backend/src/store/inMemoryStore.js]
  1. Index lookup to narrow candidates:
       brandId set?   → byBrand index
       category set?  → byCategory index
       type set?      → byType index
       else           → full scan
  2. Linear filters on candidates:
       name substring (case-insensitive)
       price range (minPrice / maxPrice)
       tags all-match
       brandId exact match
  3. Attribute filters:
       For each key, checks attributeRegistry.isVariantDimension
         variant dimension → match variant.options; require stock > 0
         product attribute → match product.attributes
                              array   → value must be in the array
                              range   → numeric min/max comparison
                              scalar  → exact match
  4. Paginate: slice (page-1)*limit → page*limit
        │
        ▼
{ success: true, data: { items, total, page, limit } }
        │
        ▼
useProducts sets state
        │
        ▼
CatalogPage re-renders ProductList with new items
```

### Category change → schema reload

When the user picks a category in `SearchFilter`:

1. `handleCategoryChange` resets the `attributes` filter (prevents stale attribute values from the old category leaking into the new query).
2. `useAttributeSchema({ category })` effect fires → fetches `GET /api/v1/products/attributes/schema?category=<new>`.
3. `AttributeFilters` re-renders with the new schema — different checkboxes, sliders, and toggles for the new category.

</details>

---
