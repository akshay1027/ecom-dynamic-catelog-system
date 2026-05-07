# ADR-009: Dynamic Variant Form UX — Variant Type with Value List

**Date:** 2026-05-07
**Status:** Accepted
**Deciders:** akshayrr
**PR:** #8 (feat/v5-dynamic-variants)

## Context

v4 hardcoded `size` as the only variant dimension in the admin form. Brands need to define their own variant types (colour, material, fit) and specify multiple values per type (e.g., colour → black, white, navy), each with its own stock. The question was how to model this in the admin UI and the form state.

## Decision

Use a hierarchical "variant type with value list" model: the admin first names a variant type (e.g., "colour"), then adds individual values under it (black=80, white=60). Each value maps to one backend variant `{ options: { colour: 'black' }, stock: 80 }`. The form state is `variantTypes: [{ key, values: [{ value, stock }] }]` which flattens to the backend's `variants` array on submit.

## Alternatives Considered

1. **Per-variant row with key-value pairs** — each variant row lets the user add any number of `key=value` pairs. Rejected: UX is confusing (user must repeat the same key across rows for every value), no enforcement of consistent key names (one row might have `colour`, another `color`), and it doesn't match how variant creation works on any major e-commerce platform (Shopify, WooCommerce all use the type+values model).

2. **Define axes first, then fill in a combination matrix** — user defines dimensions (size, colour), system generates all combinations for stock entry. Rejected: overkill for Phase 1; generates exponential rows (4 sizes × 3 colours = 12 rows); implementation complexity is 3× higher with no clear benefit for the prototype scope.

## Postgres Migration Path

The form's type+values model maps directly to the existing `product_variants` table schema. Each value row becomes one INSERT:
```sql
INSERT INTO product_variants (product_id, options, stock) VALUES
  ($id, '{"colour": "black"}', 80),
  ($id, '{"colour": "white"}', 60);
```
The `buildVariantTypes()` helper (reverse-engineering variant types from the flat variants array) is also how the admin edit form would reconstruct the UI from a `SELECT * FROM product_variants WHERE product_id = $id`.

## Consequences

+ Intuitive UX — matches how every major e-commerce admin presents variant configuration
+ Consistent key names enforced within a type (no `colour` vs `color` drift)
+ Clean flatten-on-submit: `variantTypes.flatMap(type => type.values.map(v => ({ options: { [type.key]: v.value }, stock }))))`
+ `buildVariantTypes()` helper correctly round-trips from backend variants to form state on edit
- Single-key variants only in this phase — multi-dimensional combinations (size × colour) require a separate UX decision (Phase 3+)
- Two-level nesting in form state is slightly more complex than a flat array
