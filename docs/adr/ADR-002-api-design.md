# ADR-002: RESTful API Design at /api/v1

**Date:** 2026-05-06
**Status:** Accepted
**Deciders:** Akshay R R

## Context
Define the API contract before writing routes so integration tests can be written first (TDD).

## Decision
RESTful resource API at `/api/v1/products`. Filter parameters use query strings with bracket notation for dynamic attributes. All responses use a consistent envelope.

## Endpoint Specification

| Method | Path | Success Status |
|--------|------|----------------|
| POST | /api/v1/products | 201 |
| GET | /api/v1/products/:id | 200 |
| PUT | /api/v1/products/:id | 200 |
| DELETE | /api/v1/products/:id | 200 |
| GET | /api/v1/products | 200 |

## Query Parameters for GET /api/v1/products
- `name` — case-insensitive substring match on name
- `category` — exact match
- `type` — exact match
- `minPrice`, `maxPrice` — inclusive range on price
- `attributes[key]=value` — filter on attributes object key
- `tags` — comma-separated, product must have ALL specified tags
- `page` — 1-indexed, default 1
- `limit` — default 20, max 100

## Response Envelope
Success:
```json
{ "success": true, "data": <payload>, "error": null }
```
Error:
```json
{ "success": false, "data": null, "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": {} } }
```

## HTTP Status Codes
- 200: success
- 201: created
- 400: validation error
- 404: not found
- 500: internal error

## Authentication
No authentication for this prototype. Document here so it is a conscious decision, not an omission.

## Consequences
+ Bracket notation `attributes[key]=value` is standard (supported by qs, axios)
+ Envelope pattern means frontend never needs to check HTTP status for business logic
- PUT is treated as partial update (PATCH semantics) — documented to avoid confusion
