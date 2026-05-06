# Tasks

## Status Legend
- [ ] Not started
- [~] In progress  
- [x] Done
- [!] Blocked

## Phase 0: Workflow Bootstrap
- [x] git init
- [x] npx skills add
- [x] .claude/settings.json hooks
- [x] pre-commit hook (chmod +x)
- [x] docs structure
- [x] CLAUDE.md
- [x] GitHub repo creation
- [x] Initial commit + push

## Phase 1: Data Layer + ADRs
- [x] ADR-001: Data model
- [x] ADR-002: API design
- [x] backend/package.json + jest.config.js
- [x] npm install (backend)
- [x] RED: store.test.js (12 tests)
- [x] RED: product.test.js (8 tests)
- [x] GREEN: inMemoryStore.js
- [x] GREEN: product.js
- [x] REFACTOR: clean up
- [x] All 20 unit tests green

## Phase 2: Backend API (TDD)
- [x] RED: products.api.test.js (~32 integration tests)
- [x] src/app.js
- [x] src/routes/products.js
- [x] src/middleware/validate.js
- [x] GREEN: all routes passing
- [x] REFACTOR: sendSuccess/sendError helpers
- [x] All ~32 tests green (59 total: 33 unit + 26 integration)

## Phase 3: Frontend (TDD)
- [x] ADR-003: Frontend architecture
- [x] ADR-004: State management
- [x] frontend/package.json + vite.config.js
- [x] npm install (frontend)
- [x] RED: ProductCard.test.jsx (6 tests)
- [x] RED: ProductList.test.jsx (5 tests)
- [x] RED: SearchFilter.test.jsx (6 tests)
- [x] RED: useProducts.test.js (6 tests)
- [x] GREEN: all components + hook
- [x] REFACTOR: formatPrice, AttributeBadge
- [x] All ~23 frontend tests green

## Phase 4: Integration + Release
- [x] Update CORS (allow localhost:5173)
- [x] Verify Vite proxy config
- [x] Add CSS (ProductList grid, ProductCard, SearchFilter)
- [x] Smoke test (seed + verify in browser)
- [x] Create GitHub branch: feat/phase-4-integration-and-styling
- [x] Push all files via GitHub MCP
- [x] Create GitHub PR
- [x] Update docs/tasks.md (all done)
- [x] Write session log
