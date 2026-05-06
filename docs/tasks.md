# Tasks

## Status Legend
- [ ] Not started
- [~] In progress  
- [x] Done
- [!] Blocked

## Phase 0: Workflow Bootstrap
- [ ] git init
- [ ] npx skills add
- [ ] .claude/settings.json hooks
- [ ] pre-commit hook (chmod +x)
- [ ] docs structure
- [ ] CLAUDE.md
- [ ] GitHub repo creation
- [ ] Initial commit + push

## Phase 1: Data Layer + ADRs
- [ ] ADR-001: Data model
- [ ] ADR-002: API design
- [ ] backend/package.json + jest.config.js
- [ ] npm install (backend)
- [ ] RED: store.test.js (12 tests)
- [ ] RED: product.test.js (8 tests)
- [ ] GREEN: inMemoryStore.js
- [ ] GREEN: product.js
- [ ] REFACTOR: clean up
- [ ] All 20 unit tests green

## Phase 2: Backend API (TDD)
- [ ] RED: products.api.test.js (~32 integration tests)
- [ ] src/app.js
- [ ] src/routes/products.js
- [ ] src/middleware/validate.js
- [ ] GREEN: all routes passing
- [ ] REFACTOR: sendSuccess/sendError helpers
- [ ] All ~32 tests green

## Phase 3: Frontend (TDD)
- [ ] ADR-003: Frontend architecture
- [ ] ADR-004: State management
- [ ] frontend/package.json + vite.config.js
- [ ] npm install (frontend)
- [ ] RED: ProductCard.test.jsx (6 tests)
- [ ] RED: ProductList.test.jsx (5 tests)
- [ ] RED: SearchFilter.test.jsx (6 tests)
- [ ] RED: useProducts.test.js (6 tests)
- [ ] GREEN: all components + hook
- [ ] REFACTOR: formatPrice, AttributeBadge
- [ ] All ~23 frontend tests green

## Phase 4: Integration + Release
- [ ] Update CORS (allow localhost:5173)
- [ ] Verify Vite proxy config
- [ ] Add CSS (ProductList grid, ProductCard, SearchFilter)
- [ ] Smoke test (seed + verify in browser)
- [ ] Create GitHub branch: feat/initial-catalog-system
- [ ] Push all files via GitHub MCP
- [ ] Create GitHub PR
- [ ] Update docs/tasks.md (all done)
- [ ] Write session log
