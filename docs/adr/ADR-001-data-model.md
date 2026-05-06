# ADR-001: Product Data Model with Flat Dynamic Attributes

**Date:** 2026-05-06
**Status:** Accepted
**Deciders:** Akshay R R

## Context
We need a product model that supports multiple product categories (apparel, furniture, electronics), each with different attribute sets. We need to prototype quickly with an in-memory store and swap to a real DB later without rewriting business logic.

## Decision
Store all category-specific attributes in a flat `attributes: {}` object (string/number/boolean values only, no nesting). Core fields (name, price, category, type, stock) remain top-level.

## Alternatives Considered
1. **Typed sub-schemas per category** (ApparelProduct extends Product): rejected — creates a class hierarchy that doesn't serialize cleanly to JSON and requires a discriminator column in any future SQL schema.
2. **EAV (Entity-Attribute-Value) table pattern**: rejected for prototype speed — premature for an in-memory store and adds query complexity without benefit.
3. **Nested attributes** (e.g., `attributes.dimensions.width`): rejected — complicates query filter parsing (`?attributes[dimensions][width]=10`) and JSON flattening on the API boundary.

## Consequences
+ Simple to serialize/deserialize — plain JSON, no ORM needed
+ API filter `?attributes[key]=value` maps directly to `product.attributes[key] === value`
+ Easy to migrate: flat attributes become a JSONB column in Postgres or a separate EAV table
- No schema enforcement on attribute keys per category (add a category-attribute registry in a future ADR if needed)
- Linear scan required for attribute-based searches (acceptable at prototype scale)
