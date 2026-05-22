# ecom-dynamic-catalog-system

Dynamic e-commerce catalog prototype with a React frontend and an Express backend. Uses an in-memory store — no database setup required.

---

<details>
<summary><strong>Summary Tables — AI OS Workflow &amp; Product Evolution</strong></summary>

_Snapshot of the full system as of v9 (main). Source: [docs/evolution/04-summary-tables.md](docs/evolution/04-summary-tables.md)_

### Table 1 — AI OS Workflow (All Layers)

| Layer | Component | Trigger | What it does | Why it exists |
|-------|-----------|---------|--------------|---------------|
| **Global Context** | `~/.claude/CLAUDE.md` | Session start | Defines identity (Hotelzify lead engineer), working philosophy (agent-directed), and non-negotiables (idempotency, no silent failures, retry on all external calls, reconciliation on money flows, TDD) | Single source of truth for quality bar across all projects |
| **Global Context** | `~/.claude/settings.json` permissions | Session start | Whitelists: rg, grep, find, WebSearch, git, npm, WebFetch to approved domains | Reduce permission friction without disabling safety |
| **Global Context** | `alwaysThinkingEnabled: true` | Every request | Forces extended thinking on every response | Better analysis on architectural and debugging tasks |
| **Global Hook** | ESLint PostToolUse | After Write/Edit on `.js`/`.ts` | Runs `eslint --max-warnings=0` on saved file; tails 5 lines | Catch lint violations immediately on save |
| **Global Hook** | Glass.aiff Stop | Session stop | Plays macOS Glass sound | Audio signal that work is done (agent may be backgrounded) |
| **Project Context** | `CLAUDE.md` (project) | Session start | Codifies: TDD is blocking, `app.js` never calls `listen()`, store contract (only `inMemoryStore.js` touches Map), API envelope, ADR requirement trigger | Prevent architecture drift; enforce project-specific invariants every session |
| **Project Hook** | `check-secrets.sh` PreToolUse | Before Write/Edit | Regex scans for Razorpay keys, AWS AKIA keys, hardcoded password/secret/api_key/token assignments | First-line defense against credential commits |
| **Project Hook** | Auto-test runner PostToolUse | After Write/Edit in `backend/*` or `frontend/*` | Runs `npm test` in affected subtree; tails 25 lines | Immediate feedback; catch regressions before moving to next task |
| **Project Hook** | TDD reminder PostToolUse | After Write/Edit on non-test implementation files | Echoes: "TDD CHECK: Did you write and confirm a failing test BEFORE this edit?" | Make cost of TDD violation visible in output; reinforce RED-before-GREEN |
| **Project Hook** | ADR index regen PostToolUse | After Write/Edit on `docs/adr/ADR-*.md` | Runs `regen-adr-index.sh` → rebuilds `docs/adr/INDEX.md` | Keep decision index fresh automatically; no manual maintenance |
| **Project Hook** | Test-blocking Stop | Session stop | Runs full backend + frontend test suite; exits code 2 with `BLOCKED` if any test fails | Prevent incomplete work from being committed; enforce test-green exit contract |
| **Project Hook** | `auto-push.sh` Stop | After test gate passes | Stages all files (excluding `.env*`), commits `chore: auto-checkpoint {timestamp}`, pushes branch | Auto-save every session; prevent work loss |
| **Script** | `check-secrets.sh` | Pre-write hook | Regex: Razorpay sk_live/sk_test, AWS AKIA*, hardcoded assignments with 8+ char values | First line of defense |
| **Script** | `regen-adr-index.sh` | PostToolUse on ADR files | Scans all `ADR-*.md`, extracts title + status, rebuilds `INDEX.md` as markdown table | Automatic decision registry |
| **Script** | `auto-push.sh` | Stop hook (on test pass) | git add → commit → push current branch | Auto-checkpoint on every clean session |
| **Script** | `verify-pr.js` | CI (`pr-verify.yml`) | Calls Claude API (Sonnet 4.6) with PR diff + project rules; returns JSON findings array; blocks merge on P0/P1 | Automated code review for project-specific rules before human review |
| **Skill** | `/ship-feature` | Manual invoke | Orchestrates full pipeline: plan → implement → /write-tests → /review-code → fix P0/P1 → /create-pr → optionally /create-adr → /create-session-doc | Single command runs complete feature delivery; no steps skippable |
| **Skill** | `/write-tests` | Post-implementation or manual | Writes: happy path, idempotency, missing input, invalid input, external failure, edge cases; AAA format; mocks externals | Full coverage in one shot; catches spec mismatches before review |
| **Skill** | `/review-code` | After implementation | Reviews diff against spec + CLAUDE.md; reports P0/P1/P2/P3 findings; blocks merge on P0/P1 | Catch bugs before PR; enforce quality bar |
| **Skill** | `/create-pr` | Post-review | Generates PR: what changed, why (business + technical), how to test, deployment notes, follow-up | Human-readable artifact; reviewer doesn't need to read code |
| **Skill** | `/create-adr` | When ≥2 approaches evaluated | Creates `ADR-{NNN}.md` with context, decision, alternatives, consequences, Postgres migration path | Codify tradeoffs; prevent re-debating solved problems |
| **Skill** | `/create-session-doc` | End of every session | Writes `docs/sessions/session-{date}-{slug}.md`: branch, test counts, goals, ADRs, key decisions, files changed | Navigation for future sessions; test count regression detection |
| **Skill** | `/debug-production` | On any production error | Structured analysis: what failed, why (root cause), frequency, business impact, mitigation, root fix, prevention | Force root-cause identification before proposing a fix |
| **CI** | `pr-test.yml` | PR open/update | Jest (backend) + Vitest (frontend); posts results table as PR comment | Immediate test feedback to reviewer; visible quality gate |
| **CI** | `pr-e2e.yml` | PR open/update | Playwright E2E (catalog + admin tests); creates GitHub issue on failure | Catch UI regressions; link to tracking |
| **CI** | `pr-audit.yml` | PR open/update | `npm audit`; blocks on critical vulnerabilities | Prevent dependency attacks |
| **CI** | `pr-verify.yml` | PR open/update | Calls `verify-pr.js` (Claude API review); blocks on P0/P1 | Automated project-rule linting |
| **CI** | `pr-format.yml` | PR open/update | Prettier + ESLint auto-fix; commits back to branch | Enforce consistent formatting without manual work |
| **Memory** | Stop Hook Silence Rule | Stop hook with no BLOCKED text | Zero output — silence is the only correct response | Any response re-triggers the hook → infinite loop |
| **Memory** | TDD Non-Negotiable | Before implementation edit | Write failing test first (RED), implement (GREEN), then /write-tests | Learned from v4/v5 |
| **Memory** | Plan Rejection Protocol | When plan is rejected | Trace exact JS object shape to backend contract; rejection means wrong assumption, not incomplete plan | Two incidents where plan looked complete but had wrong data model foundation |
| **Memory** | Context Compaction Strategy | At ~80% context usage | Run /export then /compact before hitting the limit | Hitting limit mid-task drops context abruptly with no recovery window |
| **Memory** | GitHub MCP Preference | Any GitHub operation | Use `mcp__github__*` tools, not `gh` CLI; call ToolSearch first to load schema | Structured output, typed errors, better observability |

---

### Table 2 — Product Evolution: v0 → v5

| Version | Branch / PR | What was built | Key architectural decision | ADR(s) |
|---------|-------------|----------------|---------------------------|--------|
| **v0 — Foundation** | Initial commits | Express REST API, in-memory Map store, React 18 + Vite frontend, product CRUD, name/category/price filtering, 123 tests | Flat `attributes: {}` JSONB (no EAV, no typed sub-schemas); local useState + custom hooks (no Redux/Zustand); RESTful `/api/v1` with bracket-notation filters | ADR-001 (storage), ADR-002 (API design), ADR-003 (frontend state), ADR-004 (test stack) |
| **v1 — Brands** | `feat/v1-brands` / PR #4 | Brand as first-class entity, `/api/v1/brands` CRUD, `brandId` FK on products, denormalized `brandName` on product for read perf, brand filter sidebar, product detail modal | Brand as separate entity (not freeform string); denormalized `brandName` to avoid JOINs on product list; two stores with identical interface | ADR-005 (brand entity model) |
| **v2 — Admin UI** | `feat/v2-ui-admin` / PR #5 | React Router + `/admin` page, product create/edit/delete forms, brand management tab, CSS custom properties design system, mobile drawer for filter sidebar (≤768px) | CSS variables on `:root` for all tokens; no Tailwind/styled-components; mobile drawer as fixed overlay | ADR-006 (CSS architecture) |
| **v3 — Attribute Filters** | `feat/v3-attribute-filters` / PR #6 | Dynamic attribute filter discovery, `/api/v1/products/attributes/schema?category=` endpoint, in-memory attributeRegistry Map, 20 new seed products | Secondary attribute registry (O(1) schema reads vs O(n) product scans); registry upserts on every product write (O(k) per write); route ordering invariant (schema route before `:id`) | ADR-007 (attribute registry) |
| **v4 — Variants** | `feat/v4-product-variants` / PR #7 | Variants as child entities with `options JSONB` + `stock INTEGER`, per-size inventory, variant filtering in catalog, total stock computed from variants | Variants as separate rows, not arrays in attributes; single-key JSONB convention `{size: M}`; `isVariantDimension` flag in attributeRegistry | ADR-008 (variant data model) |
| **v5 — Dynamic Variant Forms** | `feat/v5-dynamic-variants` / PR #8–11 | Admin form for variant types + value/stock entry, `buildVariantTypes()` reverse-engineer helper, single-variant-type UI enforcement, selectable variant pills in detail modal | Hierarchical "variant type → value list" (Shopify/WooCommerce pattern); rejected per-variant rows (confusing UX) and combo matrix (premature); single-type enforcement via UI guard | ADR-009 (variant form state), ADR-010 (single-variant enforcement) |

---

### Table 3 — Product Evolution: v5 → v9

| Version | Branch / PR | What was built | Key architectural decision | ADR(s) |
|---------|-------------|----------------|---------------------------|--------|
| **v6 — Perf + Postgres** | `feat/v6-frontend-perf` + `feat/v6-postgres-docker` / PR #12–13 | Debounce hook (300ms), module-level response cache, AbortController for in-flight cancellation, `useDeferredValue` for stale UI, PostgreSQL 16 + Knex.js migrations, Docker Compose (Postgres + backend + frontend) | Cache outside component state (survives re-renders); signal threaded through all API calls; store interface preserved — `postgresStore.js` swaps in with same API as `inMemoryStore.js`; Docker Compose for dev/prod parity | ADR-011 (database selection) |
| **v7 — Brand Admin Frontend** | `feat/v7-brand-frontend` / PR #14 | Brand admin UI (CRUD tab in AdminPage), brand list + create/edit/delete forms, cascade delete products on brand remove, Postgres persistence | No new architectural decisions — followed established patterns (brand forms mirror product forms) | None |
| **v8 — Auth & Authorization** | `feat/v8-auth` / PR #15 | JWT in httpOnly cookies (SameSite=strict), role-based auth (admin/viewer), admin provisioned via env vars, `/auth/login` + `/auth/logout` + `/auth/me`, per-route inline middleware, dual-mode user store (in-memory + Postgres), bcryptjs (10 rounds), CORS updated for credentials | httpOnly cookies over localStorage (XSS protection); JWT stateless over session IDs (no session store); single 24h token (no refresh for prototype); role in JWT payload (no DB lookup per request); per-route middleware (centralized app-level split doesn't isolate by HTTP method in Express routers) | ADR-012 (authentication strategy) |
| **v9 — Auth + Brand Rebase** | `feat/v9-auth-brand-rebase` / PR #18 | Brand CRUD in AdminPage protected by `authenticate + authorize('admin')`, all public GET endpoints remain unauthenticated (catalog, brands list, attribute schema), full integration of v7 (brand UI) + v8 (auth) | No new decisions — integration of existing features; read public, write admin-only | ADR-012 (referenced) |

---

### Current State (post-v9, main)

**Backend:** Express + Knex + PostgreSQL 16. Products, brands, variants, attribute registry, JWT auth, role-based authorization. 156 passing tests.

**Frontend:** React 19 + Vite 6 + React Router. Catalog, admin, auth flows, brand management, variant selection, debounced filters, response caching. 152 passing tests.

**Data model:** `brands`, `products`, `product_variants`, `attribute_registry`, `users` (5 tables).

**AI OS:** 5 hook layers, 6 custom scripts, 7 skills, 5 CI workflows, 5 memory rules, 2 CLAUDE.md files, 12 ADRs.

</details>

---

<details>
<summary><strong>Navigation — Docs &amp; Chat History</strong></summary>

#### ADRs
- [ADR Index](docs/adr/INDEX.md)
- [ADR-001 — Product Data Model with Flat Dynamic Attributes](docs/adr/ADR-001-data-model.md)
- [ADR-002 — RESTful API Design at /api/v1](docs/adr/ADR-002-api-design.md)
- [ADR-003 — React 18 + Vite with Co-located Component Tests](docs/adr/ADR-003-frontend-architecture.md)
- [ADR-004 — Local useState + Custom Hook, No Global State Library](docs/adr/ADR-004-state-management.md)
- [ADR-005 — Brand Entity with FK Relationship to Products](docs/adr/ADR-005-brand-entity.md)
- [ADR-006 — CSS Custom Properties Design System](docs/adr/ADR-006-css-design-system.md)
- [ADR-007 — Attribute Registry Pattern for Dynamic Schema Discovery](docs/adr/ADR-007-attribute-registry-pattern.md)
- [ADR-008 — Product Variants with JSONB Options](docs/adr/ADR-008-product-variants.md)
- [ADR-009 — Dynamic Variant Form UX](docs/adr/ADR-009-dynamic-variant-form-ux.md)
- [ADR-010 — Single Variant Dimension Per Product](docs/adr/ADR-010-single-variant-dimension-per-product.md)
- [ADR-011 — Database Selection — PostgreSQL via Knex](docs/adr/ADR-011-database-selection.md)
- [ADR-012 — Authentication Strategy — JWT in httpOnly Cookies](docs/adr/ADR-012-authentication-strategy.md)

#### Sessions
- [2026-05-06 — Initial session](docs/sessions/session-2026-05-06.md)
- [2026-05-06 — Full summary](docs/sessions/session-2026-05-06-full-summary.md)
- [2026-05-07 — v2 UI + Admin](docs/sessions/session-2026-05-07-v2-ui-admin.md)
- [2026-05-07 — v3 Attribute Filters](docs/sessions/session-2026-05-07-v3-attribute-filters.md)
- [2026-05-07 — v4 Product Variants](docs/sessions/session-2026-05-07-v4-product-variants.md)
- [2026-05-07 — v5 Dynamic Variants](docs/sessions/session-2026-05-07-v5-dynamic-variants.md)
- [2026-05-11 — v6 Frontend Perf](docs/sessions/session-2026-05-11-v6-frontend-perf.md)

#### Evolution
- [01 — Claude Workflow](docs/evolution/01-claude-workflow.md)
- [02 — Product](docs/evolution/02-product.md)
- [03 — Technical](docs/evolution/03-technical.md)
- [04 — Summary Tables](docs/evolution/04-summary-tables.md)

#### Chat History
- [2026-05-06 — 1st chat](docs/chats/2026-05-06-234342-dynamic-ecom-catalog-1st-chat.txt)
- [2026-05-07 — 2nd chat](docs/chats/2026-05-07-145821-dynamic-ecom-catalog-2nd-chat.txt)
- [2026-05-07 — 3rd chat](docs/chats/2026-05-07-160819-dynamic-ecom-catalog-3rd-chat.txt)
- [2026-05-07 — 4th chat](docs/chats/2026-05-07-180755-dynamic-ecom-catalog-4th-chat.txt)
- [2026-05-07 — Potential improvements](docs/chats/2026-05-07-193914-potential-improvements-features-chat.txt)
- [2026-05-07 — Evolution of project](docs/chats/2026-05-07-194737-evolution-of-project-chat.txt)

#### Tasks
- [tasks.md](docs/tasks.md)

</details>

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
