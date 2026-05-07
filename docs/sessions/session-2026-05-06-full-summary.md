# Session Summary — 2026-05-06

## What Was Built

A fully functional dynamic e-commerce catalog system — greenfield, from empty directory to 123 passing tests across backend + frontend.

### Final state
- **Backend**: Express.js REST API at `/api/v1/products` and `/api/v1/brands`, in-memory store with secondary indexes
- **Frontend**: React 18 + Vite SPA with product grid, brand/attribute filtering, richer product cards, and a detail modal
- **Tests**: 123 total (87 backend, 36 frontend), TDD enforced at every layer
- **GitHub**: `main` branch (v0 prototype), `feat/v0-prototype` (frozen reference), PR #4 open (`feat/v1-brands`)

---

## Overall Approach

### Orchestrator + Subagents pattern
The main Claude Code session acted as an orchestrator — it planned, made architectural decisions, and reviewed outputs, but never wrote application code directly. All implementation was delegated to dedicated subagents, each with a self-contained prompt including full context, exact file specs, and done criteria. This kept the orchestrator context lean and prevented drift.

Each phase was a separate subagent:
- Phase 0: Workflow bootstrap (git, hooks, docs, GitHub repo)
- Phase 1: Data layer + ADRs (store, product model, unit tests)
- Phase 2: Backend API (Express routes, integration tests)
- Phase 3: Frontend (React components, hooks, Vitest tests)
- Phase 4: Integration + CSS + PR
- Later: Brand entity (backend then frontend, separate subagents)

### TDD enforced at the environment level, not just by convention
Rather than asking subagents to "follow TDD", the environment itself enforced it:
- **PostToolUse hook** in `.claude/settings.json`: runs tests automatically after every file write/edit — subagents see RED → GREEN transitions inline
- **Stop hook (exit code 2)**: blocks session end if tests are failing
- **Git pre-commit hook**: blocks commits with red tests — no `--no-verify` escapes

The result: every subagent was forced to follow RED → GREEN → REFACTOR because the feedback loop was automatic, not aspirational.

### ADRs before code
Every architectural decision was documented in `docs/adr/` before implementation started:
- ADR-001: Flat `attributes: {}` JSON (rejected EAV, rejected typed sub-schemas)
- ADR-002: REST API at `/api/v1`, bracket notation for attribute filters, `{ success, data, error }` envelope
- ADR-003: React 18 + Vite + Vitest (rejected Next.js, rejected CRA)
- ADR-004: Local `useState` + `useProducts` hook (rejected Redux/Zustand for single data domain)

This meant subagents had a written spec to implement against, not just a verbal description.

---

## Key Technical Decisions and Why

### Flat attributes JSON
Products can be apparel (size, color, material) or furniture (material, dimensions, weight) or electronics (brand, RAM, storage). Three options considered:
- **Typed sub-schemas** (ApparelProduct extends Product): creates a class hierarchy that's hard to serialize and requires discriminator columns in any future DB
- **EAV table** (entity-attribute-value): premature complexity for prototype scale
- **Flat JSON** (`attributes: { size: 'M', color: 'blue' }`): chosen — plain JSON, no ORM needed, future DB migration is a JSONB column

### Denormalized brandName on products
Brands are a separate entity (`/api/v1/brands`). Products store both `brandId` (FK) and `brandName` (copied from brand on create/update). This means:
- `GET /api/v1/products` returns brand name without a join
- Future DB migration: denormalized field trades some consistency for read performance, acceptable for a catalog
- `brandName` is always set server-side from the actual brand record — client can't spoof it

### app.js never calls listen()
Express app exported without `app.listen()`. `server.js` is the entry point that calls listen. This is required for Supertest (integration tests bind to the app object directly, no port management needed). Architecturally separates "what the app does" from "how it's served".

### Secondary indexes in in-memory store
The store maintains `byCategory`, `byType`, `byBrand` as `Map<string, Set<id>>`. `search()` uses the most selective index as its candidate set, then linear-filters the rest. This gives O(1) single-category lookups even at prototype scale and the pattern transfers directly to DB indexes when we swap the store.

### Swappability contract
`inMemoryStore.js` and `brandStore.js` export exactly 5-6 functions. Nothing outside the store directory touches the underlying Map. Swap to Postgres = implement the same interface in `postgresStore.js`, change one `require()`. This constraint was enforced in `CLAUDE.md` and in every subagent prompt.

---

## Workflow Setup Decisions

### No Husky for pre-commit
Husky requires a `prepare` npm script and breaks in CI environments where `npm install --production` skips devDependencies. Plain `.git/hooks/pre-commit` (shell script + chmod +x) always runs, no dependencies.

### Skills installed
After the session, 7 Claude Code skills were installed to `.claude/skills/`:
- `find-skills`, `vercel-react-best-practices`, `web-design-guidelines`, `vercel-composition-patterns`, `webapp-testing`, `frontend-design`, `skill-creator`

### GitHub MCP for all remote operations
All GitHub operations (repo creation, branch creation, PR creation) used the GitHub MCP tools rather than git CLI pushes to main. This enforced PR-based workflow for all feature work.

---

## Problems Encountered and How They Were Resolved

| Problem | Resolution |
|---------|-----------|
| Squash merge dropped seed.js (committed after PR was opened) | Detected via `server.js` SHA check on GitHub API; pushed seed.js via separate PR #3 |
| `npx skills add` required interactive input | Retried with `--agent claude-code` flag on second attempt; succeeded non-interactively |
| `updatedAt === createdAt` in store update tests | 1ms bump when system clock hasn't advanced between create and update |
| Subagent stalled (600s timeout) | Re-ran with explicit fallback instructions (curl if npx fails) and timeout guidance |
| Direct push to main blocked by hooks | Created feature branches + PRs for all non-trivial changes; only small hotfixes asked for explicit user approval |

---

## What to Improve Next Session

1. **Start next session with `/compact`** — context grew to 83% by end; compacting earlier would have kept subagents cheaper
2. **Pre-authorize direct main pushes for hotfixes** — the seed.js drama (PR #3) could have been a single push if authorized upfront for single-file fixes
3. **Subagent "go" pattern** — one subagent asked for approval mid-execution ("say go to continue"); future subagents should be written with "execute immediately, do not ask for confirmation" in the prompt
4. **Session log cadence** — session log was written only at the end; write one per phase to capture decisions while context is fresh
5. **`feat/v1-brands` still open as PR #4** — merge and tag `feat/v1-prototype` before next session starts
