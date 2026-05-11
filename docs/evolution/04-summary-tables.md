# Summary Tables — AI OS Workflow & Product Evolution

_Generated 2026-05-12. Snapshot of the full system as of v9 (main)._

---

## Table 1 — AI OS Workflow (All Layers)

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
| **Memory** | TDD Non-Negotiable | Before implementation edit | Write failing test first (RED), implement (GREEN), then /write-tests | Learned from v4/v5: plans with wrong data model foundation bypassed TDD and caught issues late |
| **Memory** | Plan Rejection Protocol | When plan is rejected | Trace exact JS object shape to backend contract; rejection means wrong assumption, not incomplete plan | Two incidents where plan looked complete but had wrong data model foundation |
| **Memory** | Context Compaction Strategy | At ~80% context usage | Run /export then /compact before hitting the limit | Hitting limit mid-task drops context abruptly with no recovery window |
| **Memory** | GitHub MCP Preference | Any GitHub operation | Use `mcp__github__*` tools, not `gh` CLI; call ToolSearch first to load schema | Structured output, typed errors, better observability |

---

## Table 2 — Product Evolution: v0 → v5

| Version | Branch / PR | What was built | Key architectural decision | ADR(s) |
|---------|-------------|----------------|---------------------------|--------|
| **v0 — Foundation** | Initial commits | Express REST API, in-memory Map store, React 18 + Vite frontend, product CRUD, name/category/price filtering, 123 tests | Flat `attributes: {}` JSONB (no EAV, no typed sub-schemas); local useState + custom hooks (no Redux/Zustand); RESTful `/api/v1` with bracket-notation filters | ADR-001 (storage), ADR-002 (API design), ADR-003 (frontend state), ADR-004 (test stack) |
| **v1 — Brands** | `feat/v1-brands` / PR #4 | Brand as first-class entity, `/api/v1/brands` CRUD, `brandId` FK on products, denormalized `brandName` on product for read perf, brand filter sidebar, product detail modal | Brand as separate entity (not freeform string); denormalized `brandName` to avoid JOINs on product list; two stores with identical interface | ADR-005 (brand entity model) |
| **v2 — Admin UI** | `feat/v2-ui-admin` / PR #5 | React Router + `/admin` page, product create/edit/delete forms, brand management tab, CSS custom properties design system, mobile drawer for filter sidebar (≤768px) | CSS variables on `:root` for all tokens; no Tailwind/styled-components; mobile drawer as fixed overlay | ADR-006 (CSS architecture) |
| **v3 — Attribute Filters** | `feat/v3-attribute-filters` / PR #6 | Dynamic attribute filter discovery, `/api/v1/products/attributes/schema?category=` endpoint, in-memory attributeRegistry Map, 20 new seed products | Secondary attribute registry (O(1) schema reads vs O(n) product scans); registry upserts on every product write (O(k) per write); route ordering invariant (schema route before `:id`) | ADR-007 (attribute registry) |
| **v4 — Variants** | `feat/v4-product-variants` / PR #7 | Variants as child entities with `options JSONB` + `stock INTEGER`, per-size inventory, variant filtering in catalog, total stock computed from variants | Variants as separate rows, not arrays in attributes; single-key JSONB convention `{size: M}`; `isVariantDimension` flag in attributeRegistry | ADR-008 (variant data model) |
| **v5 — Dynamic Variant Forms** | `feat/v5-dynamic-variants` / PR #8–11 | Admin form for variant types + value/stock entry, `buildVariantTypes()` reverse-engineer helper, single-variant-type UI enforcement, selectable variant pills in detail modal | Hierarchical "variant type → value list" (Shopify/WooCommerce pattern); rejected per-variant rows (confusing UX) and combo matrix (premature); single-type enforcement via UI guard | ADR-009 (variant form state), ADR-010 (single-variant enforcement) |

---

## Table 3 — Product Evolution: v5 → v9 (now)

| Version | Branch / PR | What was built | Key architectural decision | ADR(s) |
|---------|-------------|----------------|---------------------------|--------|
| **v6 — Perf + Postgres** | `feat/v6-frontend-perf` + `feat/v6-postgres-docker` / PR #12–13 | Debounce hook (300ms), module-level response cache, AbortController for in-flight cancellation, `useDeferredValue` for stale UI, PostgreSQL 16 + Knex.js migrations, Docker Compose (Postgres + backend + frontend) | Cache outside component state (survives re-renders); signal threaded through all API calls; store interface preserved — `postgresStore.js` swaps in with same API as `inMemoryStore.js`; Docker Compose for dev/prod parity | ADR-011 (database selection) |
| **v7 — Brand Admin Frontend** | `feat/v7-brand-frontend` / PR #14 | Brand admin UI (CRUD tab in AdminPage), brand list + create/edit/delete forms, cascade delete products on brand remove, Postgres persistence | No new architectural decisions — followed established patterns (brand forms mirror product forms) | None |
| **v8 — Auth & Authorization** | `feat/v8-auth` / PR #15 | JWT in httpOnly cookies (SameSite=strict), role-based auth (admin/viewer), admin provisioned via env vars, `/auth/login` + `/auth/logout` + `/auth/me`, per-route inline middleware, dual-mode user store (in-memory + Postgres), bcryptjs (10 rounds), CORS updated for credentials | httpOnly cookies over localStorage (XSS protection); JWT stateless over session IDs (no session store); single 24h token (no refresh for prototype); role in JWT payload (no DB lookup per request); per-route middleware (centralized app-level split doesn't isolate by HTTP method in Express routers) | ADR-012 (authentication strategy) |
| **v9 — Auth + Brand Rebase** | `feat/v9-auth-brand-rebase` / PR #18 | Brand CRUD in AdminPage protected by `authenticate + authorize('admin')`, all public GET endpoints remain unauthenticated (catalog, brands list, attribute schema), full integration of v7 (brand UI) + v8 (auth) | No new decisions — integration of existing features; read public, write admin-only | ADR-012 (referenced) |

---

## Current State (post-v9, main)

**Backend:** Express + Knex + PostgreSQL 16. Products, brands, variants, attribute registry, JWT auth, role-based authorization. 156 passing tests.

**Frontend:** React 19 + Vite 6 + React Router. Catalog, admin, auth flows, brand management, variant selection, debounced filters, response caching. 152 passing tests.

**Data model:** `brands`, `products`, `product_variants`, `attribute_registry`, `users` (5 tables).

**AI OS:** 5 hook layers, 6 custom scripts, 7 skills, 5 CI workflows, 5 memory rules, 2 CLAUDE.md files, 12 ADRs.
