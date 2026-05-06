# ecom-dynamic-catelog-system — Agent Context

## What This Is
Dynamic e-commerce catalog prototype. In-memory store (swappable to DB). Backend: Node.js + Express 5 (port 3001). Frontend: React 19 + Vite 6 (port 5173). Tests: Jest (backend), Vitest + RTL (frontend).

## TDD Contract
Write failing test FIRST (RED). Confirm it fails. Write minimum code to pass (GREEN). Refactor. PostToolUse hooks auto-run tests on every save. Stop hook blocks exit if tests are red.

## Store Contract
`backend/src/store/inMemoryStore.js` exports exactly: `{ create, findById, update, remove, search, clear }`. Nothing outside store/ touches the Map directly.

## API Contract
Base URL: /api/v1/products. Response envelope: `{ success, data, error }`. Attribute filtering: `?attributes[key]=val`. See docs/adr/ADR-002-api-design.md.

## Non-Negotiables
- app.js never calls listen() — required for Supertest
- All errors logged: { timestamp, operation, input, error, stack }
- No hardcoded secrets — env vars only
- All useEffect in frontend hooks must have cleanup functions
