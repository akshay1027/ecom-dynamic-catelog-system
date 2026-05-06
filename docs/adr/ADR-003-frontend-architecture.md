# ADR-003: React 18 + Vite with Co-located Component Tests

**Date:** 2026-05-06
**Status:** Accepted
**Deciders:** Akshay R R

## Context
Need a frontend for the catalog system that can display products, filter by attributes, and integrate with the Express API.

## Decision
React 18 + Vite 5. Component tests co-located with components (ProductCard.test.jsx next to ProductCard.jsx). Hook tests in tests/hooks/. Use Vitest (not Jest) because it reuses Vite's transform pipeline — no separate Babel config needed for ES modules.

## Alternatives Considered
1. Next.js: rejected — SSR is premature, no SEO requirement
2. Create React App: deprecated, no longer maintained
3. Separate test directory: rejected — co-location makes it obvious when a component has no test

## Consequences
+ Fast HMR with Vite, fast tests with Vitest (same transform pipeline)
+ Co-located tests deleted automatically when component is deleted
- vite.config.js does double duty (build + test config) — acceptable for prototype
