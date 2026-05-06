# ADR-004: Local useState + Custom Hook, No Global State Library

**Date:** 2026-05-06
**Status:** Accepted
**Deciders:** Akshay R R

## Context
Frontend needs to fetch and display products with filters. Decide whether to introduce a global state library.

## Decision
All product state lives in a custom useProducts(filters) hook. Filters are lifted to App.jsx and passed down as props. No Redux, Zustand, or Context API for this prototype.

## Alternatives Considered
1. React Context: rejected — only one data domain, Context adds indirection without benefit
2. Zustand: rejected — no cross-component state sharing that requires a store at prototype scale
3. React Query/SWR: rejected for prototype speed — hook interface is designed to be drop-in replaced with useQuery when caching is needed

## Consequences
+ Zero dependencies beyond React
+ useProducts is a thin wrapper — swap to React Query with no changes to consuming components
- No request deduplication or caching (acceptable at prototype scale)
