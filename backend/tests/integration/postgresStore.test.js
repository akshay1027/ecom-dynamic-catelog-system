'use strict';

const store = require('../../src/store/postgresStore');
const brandStore = require('../../src/store/postgresBrandStore');

const REQUIRES_DB = !!process.env.DATABASE_URL;
const describeIfDb = REQUIRES_DB ? describe : describe.skip;

describeIfDb('postgresStore', () => {
  let brand;

  beforeEach(async () => {
    await store.clear();
    await brandStore.clear();
    brand = await brandStore.create({ name: 'TestBrand' });
  });

  function makeProduct(overrides = {}) {
    return {
      name: 'Test Shirt',
      price: 29.99,
      currency: 'USD',
      category: 'apparel',
      type: 'shirt',
      stock: 10,
      brandId: brand.id,
      brandName: brand.name,
      attributes: { color: 'white', material: 'cotton' },
      ...overrides,
    };
  }

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    test('returns product with all required fields and auto-generated id/timestamps', async () => {
      const p = await store.create(makeProduct());
      expect(p.id).toBeDefined();
      expect(p.name).toBe('Test Shirt');
      expect(p.price).toBe(29.99);
      expect(p.currency).toBe('USD');
      expect(p.category).toBe('apparel');
      expect(p.type).toBe('shirt');
      expect(p.brandId).toBe(brand.id);
      expect(p.brandName).toBe('TestBrand');
      expect(p.createdAt).toBeDefined();
      expect(p.updatedAt).toBeDefined();
    });

    test('persists and retrieves product', async () => {
      const created = await store.create(makeProduct());
      const found = await store.findById(created.id);
      expect(found).not.toBeNull();
      expect(found.id).toBe(created.id);
    });

    test('sets stock from direct field when no variants', async () => {
      const p = await store.create(makeProduct({ stock: 50 }));
      expect(p.stock).toBe(50);
    });

    test('computes stock as sum of variant stocks', async () => {
      const p = await store.create(makeProduct({
        variants: [
          { options: { size: 'S' }, stock: 10 },
          { options: { size: 'M' }, stock: 20 },
          { options: { size: 'L' }, stock: 15 },
        ],
      }));
      expect(p.stock).toBe(45);
      expect(p.variants).toHaveLength(3);
    });

    test('upserts attribute_registry on create', async () => {
      await store.create(makeProduct({
        attributes: { color: 'white', weight_kg: 0.5 },
      }));
      const schema = await store.getAttributeSchema('apparel');
      expect(schema.color).toBeDefined();
      expect(schema.color.type).toBe('string');
      expect(schema.weight_kg).toBeDefined();
      expect(schema.weight_kg.type).toBe('number');
    });

    test('marks variant options as isVariantDimension in registry', async () => {
      await store.create(makeProduct({
        variants: [{ options: { size: 'M' }, stock: 5 }],
      }));
      const schema = await store.getAttributeSchema('apparel');
      expect(schema.size.isVariantDimension).toBe(true);
    });
  });

  // ── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    test('returns null for unknown id', async () => {
      const result = await store.findById('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });

    test('returns product with variants included', async () => {
      const created = await store.create(makeProduct({
        variants: [{ options: { size: 'M' }, stock: 5 }],
      }));
      const found = await store.findById(created.id);
      expect(found.variants).toHaveLength(1);
      expect(found.variants[0].options).toEqual({ size: 'M' });
      expect(found.variants[0].stock).toBe(5);
    });

    test('returns correct attribute types', async () => {
      const created = await store.create(makeProduct({
        attributes: { color: 'blue', weight_kg: 1.5, is_sale: true },
      }));
      const found = await store.findById(created.id);
      expect(found.attributes.color).toBe('blue');
      expect(found.attributes.weight_kg).toBe(1.5);
      expect(found.attributes.is_sale).toBe(true);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    test('returns null for unknown id', async () => {
      const result = await store.update('00000000-0000-0000-0000-000000000000', { name: 'X' });
      expect(result).toBeNull();
    });

    test('updates specified fields and refreshes updatedAt', async () => {
      const created = await store.create(makeProduct());
      await new Promise(r => setTimeout(r, 10));
      const updated = await store.update(created.id, { name: 'Updated Shirt', price: 49.99 });
      expect(updated.name).toBe('Updated Shirt');
      expect(updated.price).toBe(49.99);
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });

    test('preserves id and createdAt', async () => {
      const created = await store.create(makeProduct());
      const updated = await store.update(created.id, { name: 'X' });
      expect(updated.id).toBe(created.id);
      expect(updated.createdAt).toBe(created.createdAt);
    });

    test('updates attribute_registry when attributes change', async () => {
      const created = await store.create(makeProduct({ attributes: { color: 'white' } }));
      await store.update(created.id, { attributes: { color: 'black', size_eu: 42 } });
      const schema = await store.getAttributeSchema('apparel');
      expect(schema.size_eu).toBeDefined();
      expect(schema.size_eu.type).toBe('number');
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    test('returns false for unknown id', async () => {
      expect(await store.remove('00000000-0000-0000-0000-000000000000')).toBe(false);
    });

    test('removes product and cascades to variants', async () => {
      const created = await store.create(makeProduct({
        variants: [{ options: { size: 'M' }, stock: 5 }],
      }));
      expect(await store.remove(created.id)).toBe(true);
      expect(await store.findById(created.id)).toBeNull();
    });
  });

  // ── search ──────────────────────────────────────────────────────────────────

  describe('search', () => {
    beforeEach(async () => {
      await store.create(makeProduct({ name: 'White Shirt', category: 'apparel', price: 20, attributes: { color: 'white' } }));
      await store.create(makeProduct({ name: 'Blue Jeans', category: 'apparel', type: 'jeans', price: 80, attributes: { color: 'blue' } }));
      await store.create(makeProduct({ name: 'Oak Desk', category: 'furniture', type: 'desk', price: 500, attributes: { material: 'oak' } }));
    });

    test('returns all products with no filters', async () => {
      const result = await store.search({});
      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(3);
    });

    test('filters by category', async () => {
      const result = await store.search({ category: 'apparel' });
      expect(result.total).toBe(2);
      result.items.forEach(p => expect(p.category).toBe('apparel'));
    });

    test('filters by type', async () => {
      const result = await store.search({ type: 'jeans' });
      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Blue Jeans');
    });

    test('filters by minPrice and maxPrice', async () => {
      const result = await store.search({ minPrice: 50, maxPrice: 600 });
      expect(result.total).toBe(2);
      result.items.forEach(p => expect(p.price).toBeGreaterThanOrEqual(50));
    });

    test('filters by name substring (case-insensitive)', async () => {
      const result = await store.search({ name: 'shirt' });
      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('White Shirt');
    });

    test('filters by non-variant attribute (exact match)', async () => {
      const result = await store.search({ 'attributes[color]': 'blue' });
      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Blue Jeans');
    });

    test('filters by non-variant attribute (array OR logic)', async () => {
      const result = await store.search({ 'attributes[color]': ['white', 'blue'] });
      expect(result.total).toBe(2);
    });

    test('filters by variant dimension', async () => {
      await store.create(makeProduct({
        name: 'Red Shirt M',
        variants: [
          { options: { size: 'M' }, stock: 10 },
          { options: { size: 'L' }, stock: 5 },
        ],
      }));
      const mResult = await store.search({ 'attributes[size]': 'M' });
      expect(mResult.items.some(p => p.name === 'Red Shirt M')).toBe(true);
    });

    test('paginates results', async () => {
      const page1 = await store.search({ limit: 2, page: 1 });
      const page2 = await store.search({ limit: 2, page: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page2.items).toHaveLength(1);
      expect(page1.total).toBe(3);
    });

    test('filters by tags (all must match)', async () => {
      await store.create(makeProduct({ name: 'Tagged Shirt', tags: ['sale', 'new'] }));
      const result = await store.search({ tags: 'sale,new' });
      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Tagged Shirt');
    });
  });

  // ── getAttributeSchema ───────────────────────────────────────────────────────

  describe('getAttributeSchema', () => {
    test('returns empty object for unknown category', async () => {
      const schema = await store.getAttributeSchema('nonexistent');
      expect(schema).toEqual({});
    });

    test('returns merged schema across all categories when no category given', async () => {
      await store.create(makeProduct({ category: 'apparel', attributes: { color: 'blue' } }));
      await store.create(makeProduct({ category: 'furniture', type: 'desk', attributes: { material: 'wood' } }));
      const schema = await store.getAttributeSchema();
      expect(schema.color).toBeDefined();
      expect(schema.material).toBeDefined();
    });

    test('accumulates string values across products', async () => {
      await store.create(makeProduct({ attributes: { color: 'red' } }));
      await store.create(makeProduct({ attributes: { color: 'blue' } }));
      const schema = await store.getAttributeSchema('apparel');
      expect(schema.color.values).toContain('red');
      expect(schema.color.values).toContain('blue');
    });

    test('tracks min/max for number attributes', async () => {
      await store.create(makeProduct({ attributes: { weight_kg: 1.0 } }));
      await store.create(makeProduct({ attributes: { weight_kg: 3.5 } }));
      const schema = await store.getAttributeSchema('apparel');
      expect(schema.weight_kg.min).toBe(1.0);
      expect(schema.weight_kg.max).toBe(3.5);
    });
  });

  // ── variant operations ───────────────────────────────────────────────────────

  describe('addVariant', () => {
    test('adds variant and recomputes product stock', async () => {
      const p = await store.create(makeProduct({ stock: 0, variants: [] }));
      const updated = await store.addVariant(p.id, { options: { size: 'M' }, stock: 20 });
      expect(updated.variants).toHaveLength(1);
      expect(updated.stock).toBe(20);
    });

    test('returns null for unknown product', async () => {
      const result = await store.addVariant('00000000-0000-0000-0000-000000000000', { options: {}, stock: 1 });
      expect(result).toBeNull();
    });
  });

  describe('updateVariant', () => {
    test('updates variant stock and recomputes product stock', async () => {
      const p = await store.create(makeProduct({
        variants: [{ options: { size: 'S' }, stock: 5 }, { options: { size: 'M' }, stock: 10 }],
      }));
      const variantId = p.variants[0].id;
      const updated = await store.updateVariant(p.id, variantId, { stock: 20 });
      expect(updated.variants.find(v => v.id === variantId).stock).toBe(20);
      expect(updated.stock).toBe(30);
    });

    test('returns null for unknown variant', async () => {
      const p = await store.create(makeProduct());
      const result = await store.updateVariant(p.id, '00000000-0000-0000-0000-000000000000', { stock: 1 });
      expect(result).toBeNull();
    });
  });

  describe('removeVariant', () => {
    test('removes variant and recomputes stock', async () => {
      const p = await store.create(makeProduct({
        variants: [{ options: { size: 'S' }, stock: 5 }, { options: { size: 'M' }, stock: 10 }],
      }));
      const variantId = p.variants[0].id;
      const updated = await store.removeVariant(p.id, variantId);
      expect(updated.variants).toHaveLength(1);
      expect(updated.stock).toBe(10);
    });
  });

  // ── clear ────────────────────────────────────────────────────────────────────

  describe('clear', () => {
    test('removes all products', async () => {
      await store.create(makeProduct());
      await store.create(makeProduct({ name: 'Another' }));
      await store.clear();
      const result = await store.search({});
      expect(result.total).toBe(0);
    });
  });
});
