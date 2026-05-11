# Session 2026-05-11 — v6: Frontend Performance

**Branch:** feat/v6-frontend-perf → merged as PR #12
**Starting tests:** 223 (139 backend, 84 frontend)
**Ending tests:** 258 (139 backend, 119 frontend)

## Goals
Eliminate per-keystroke API requests, add response caching, and fix missing cleanup in useEffect hooks (CLAUDE.md non-negotiable violation in useBrands).

## Architecture Decisions Made
None — all changes followed established patterns. No tradeoffs requiring an ADR.

## Key Technical Decisions
- `useDebounce` extracted as its own hook (300ms) rather than inline useMemo — reusable across SearchFilter, AttributeFilters, and future inputs
- Module-level `Map` for the products response cache (not component state) — cache survives re-renders without triggering them; `invalidateProductCache()` exported for post-mutation cleanup
- AbortController over the previous cancelled-flag pattern in all three hooks — actually cancels in-flight network requests rather than just ignoring the response
- `useDeferredValue` in CatalogPage renders input at full priority while keeping stale results visible with opacity indicator during transitions
- `signal` param threaded through `productsApi.list`, `getAttributeSchema`, and `brandsApi.list` so abort propagates to the fetch call

## Files Added/Changed
- `frontend/src/hooks/useDebounce.js` + `.test.js` — new hook, 95 tests
- `frontend/src/hooks/useProducts.js` — cache + AbortController + signal
- `frontend/src/api/products.js` — signal param on all three API calls
- `frontend/src/components/SearchFilter/SearchFilter.jsx` + `.test.jsx` — debounced text + price inputs
- `frontend/src/components/AttributeFilters/AttributeFilters.jsx` + `.test.jsx` — debounced number range inputs
- `frontend/src/pages/CatalogPage.jsx` — useDeferredValue + stale-results opacity
- `frontend/tests/hooks/useProducts.test.js` — cache + abort + signal tests

## Tests Green At End
Backend: 139/139 | Frontend: 119/119 | Total: 258/258
