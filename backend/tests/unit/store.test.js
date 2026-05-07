'use strict';

// These tests will ALL FAIL until inMemoryStore.js is implemented — that is correct (RED phase)

const store = require('../../src/store/inMemoryStore');

beforeEach(() => {
  store.clear();
});

describe('store.create()', () => {
  test('assigns a uuid id and sets createdAt and updatedAt timestamps', () => {
    const product = store.create({
      name: 'Test Shirt',
      price: 29.99,
      currency: 'USD',
      category: 'apparel',
      type: 'shirt',
      stock: 10,
      brandId: 'test-brand-id',
      brandName: 'Test Brand',
    });
    expect(product.id).toBeDefined();
    expect(typeof product.id).toBe('string');
    expect(product.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(product.createdAt).toBeDefined();
    expect(product.updatedAt).toBeDefined();
    expect(product.createdAt).toBe(product.updatedAt);
  });

  test('sets default values for optional fields', () => {
    const product = store.create({
      name: 'Test Sofa',
      price: 499,
      currency: 'USD',
      category: 'furniture',
      type: 'sofa',
      stock: 2,
      brandId: 'test-brand-id',
      brandName: 'Test Brand',
    });
    expect(product.images).toEqual([]);
    expect(product.tags).toEqual([]);
    expect(product.attributes).toEqual({});
    expect(product.description).toBe('');
  });

  test('stores custom attributes', () => {
    const product = store.create({
      name: 'Blue Shirt',
      price: 25,
      currency: 'USD',
      category: 'apparel',
      type: 'shirt',
      stock: 5,
      attributes: { size: 'M', color: 'blue', material: 'cotton' },
      brandId: 'test-brand-id',
      brandName: 'Test Brand',
    });
    expect(product.attributes.size).toBe('M');
    expect(product.attributes.color).toBe('blue');
    expect(product.attributes.material).toBe('cotton');
  });

  test('throws if required field name is missing', () => {
    expect(() => store.create({ price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: 'test-brand-id' }))
      .toThrow();
  });

  test('throws if required field price is missing', () => {
    expect(() => store.create({ name: 'Shirt', currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: 'test-brand-id' }))
      .toThrow();
  });

  test('throws if price is negative', () => {
    expect(() => store.create({ name: 'Shirt', price: -1, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: 'test-brand-id' }))
      .toThrow();
  });

  test('throws if brandId is missing', () => {
    expect(() => store.create({ name: 'Shirt', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1 }))
      .toThrow();
  });
});

describe('store.findById()', () => {
  test('returns the product for a known id', () => {
    const created = store.create({ name: 'Lamp', price: 50, currency: 'USD', category: 'furniture', type: 'lamp', stock: 3, brandId: 'test-brand-id', brandName: 'Test Brand' });
    const found = store.findById(created.id);
    expect(found).not.toBeNull();
    expect(found.id).toBe(created.id);
    expect(found.name).toBe('Lamp');
  });

  test('returns null for an unknown id', () => {
    expect(store.findById('nonexistent-id')).toBeNull();
  });
});

describe('store.update()', () => {
  test('merges patch fields and updates updatedAt but not createdAt', () => {
    const created = store.create({ name: 'Sofa', price: 300, currency: 'USD', category: 'furniture', type: 'sofa', stock: 1, brandId: 'test-brand-id', brandName: 'Test Brand' });
    const originalCreatedAt = created.createdAt;

    // Small delay to ensure updatedAt differs
    const updated = store.update(created.id, { price: 350, stock: 2 });
    expect(updated.price).toBe(350);
    expect(updated.stock).toBe(2);
    expect(updated.name).toBe('Sofa'); // unchanged field preserved
    expect(updated.createdAt).toBe(originalCreatedAt);
    expect(updated.updatedAt).not.toBe(originalCreatedAt);
  });

  test('returns null for unknown id', () => {
    expect(store.update('nonexistent', { price: 100 })).toBeNull();
  });

  test('merges attributes (existing keys preserved, new keys added)', () => {
    const created = store.create({
      name: 'Laptop', price: 999, currency: 'USD', category: 'electronics', type: 'laptop', stock: 5,
      attributes: { brand: 'Dell', ram: '16GB' },
      brandId: 'test-brand-id', brandName: 'Test Brand',
    });
    const updated = store.update(created.id, { attributes: { ram: '32GB', storage: '1TB' } });
    expect(updated.attributes.brand).toBe('Dell'); // preserved
    expect(updated.attributes.ram).toBe('32GB');   // updated
    expect(updated.attributes.storage).toBe('1TB'); // new
  });
});

describe('store.remove()', () => {
  test('returns true and removes the product for a known id', () => {
    const created = store.create({ name: 'Chair', price: 150, currency: 'USD', category: 'furniture', type: 'chair', stock: 4, brandId: 'test-brand-id', brandName: 'Test Brand' });
    expect(store.remove(created.id)).toBe(true);
    expect(store.findById(created.id)).toBeNull();
  });

  test('returns false for an unknown id', () => {
    expect(store.remove('nonexistent')).toBe(false);
  });
});

describe('store.search()', () => {
  beforeEach(() => {
    store.create({ name: 'Red T-Shirt', price: 20, currency: 'USD', category: 'apparel', type: 'tshirt', stock: 10, attributes: { color: 'red', size: 'M' }, tags: ['sale', 'summer'], brandId: 'brand-apparel', brandName: 'Apparel Co' });
    store.create({ name: 'Blue Jeans', price: 60, currency: 'USD', category: 'apparel', type: 'jeans', stock: 5, attributes: { color: 'blue', size: 'L' }, tags: ['summer'], brandId: 'brand-apparel', brandName: 'Apparel Co' });
    store.create({ name: 'Oak Desk', price: 400, currency: 'USD', category: 'furniture', type: 'desk', stock: 2, attributes: { material: 'oak', color: 'brown' }, tags: [], brandId: 'brand-furniture', brandName: 'Furniture Co' });
    store.create({ name: 'Gaming Laptop', price: 1200, currency: 'USD', category: 'electronics', type: 'laptop', stock: 3, attributes: { brand: 'Asus', ram: '32GB' }, tags: ['sale'], brandId: 'brand-electronics', brandName: 'Electronics Co' });
    store.create({ name: 'Pine Bookshelf', price: 150, currency: 'USD', category: 'furniture', type: 'bookshelf', stock: 8, attributes: { material: 'pine', color: 'white' }, tags: [], brandId: 'brand-furniture', brandName: 'Furniture Co' });
  });

  test('returns all products with no filters (default pagination)', () => {
    const result = store.search({});
    expect(result.items).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  test('filters by category', () => {
    const result = store.search({ category: 'furniture' });
    expect(result.items).toHaveLength(2);
    result.items.forEach(p => expect(p.category).toBe('furniture'));
  });

  test('filters by type', () => {
    const result = store.search({ type: 'laptop' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Gaming Laptop');
  });

  test('filters by minPrice and maxPrice (inclusive)', () => {
    const result = store.search({ minPrice: 60, maxPrice: 400 });
    expect(result.items).toHaveLength(3); // Jeans(60), Desk(400), Bookshelf(150)
    result.items.forEach(p => {
      expect(p.price).toBeGreaterThanOrEqual(60);
      expect(p.price).toBeLessThanOrEqual(400);
    });
  });

  test('filters by a custom attribute', () => {
    const result = store.search({ attributes: { color: 'red' } });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Red T-Shirt');
  });

  test('filters by name (case-insensitive substring)', () => {
    const result = store.search({ name: 'desk' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Oak Desk');
  });

  test('filters by tags — product must have ALL specified tags', () => {
    const result = store.search({ tags: ['sale', 'summer'] });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Red T-Shirt');
  });

  test('paginates correctly with page=2&limit=2', () => {
    const result = store.search({ page: 2, limit: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(2);
  });

  test('returns empty items array when no products match', () => {
    const result = store.search({ category: 'nonexistent' });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe('attributeRegistry', () => {
  it('getAttributeSchema returns empty object when no products', () => {
    expect(store.getAttributeSchema('electronics')).toEqual({});
  });

  it('derives type: string with distinct values', () => {
    store.create({ name: 'A', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: 'b1', attributes: { color: 'red' } });
    store.create({ name: 'B', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: 'b1', attributes: { color: 'blue' } });
    const schema = store.getAttributeSchema('apparel');
    expect(schema.color).toEqual({ type: 'string', values: ['blue', 'red'] }); // sorted
  });

  it('derives type: number with min and max', () => {
    store.create({ name: 'A', price: 10, currency: 'USD', category: 'electronics', type: 'laptop', stock: 1, brandId: 'b1', attributes: { ram_gb: 8 } });
    store.create({ name: 'B', price: 10, currency: 'USD', category: 'electronics', type: 'laptop', stock: 1, brandId: 'b1', attributes: { ram_gb: 32 } });
    const schema = store.getAttributeSchema('electronics');
    expect(schema.ram_gb).toEqual({ type: 'number', min: 8, max: 32 });
  });

  it('derives type: boolean', () => {
    store.create({ name: 'A', price: 10, currency: 'USD', category: 'apparel', type: 'jacket', stock: 1, brandId: 'b1', attributes: { waterproof: true } });
    const schema = store.getAttributeSchema('apparel');
    expect(schema.waterproof).toEqual({ type: 'boolean' });
  });

  it('returns null category schema after clear()', () => {
    store.create({ name: 'A', price: 10, currency: 'USD', category: 'electronics', type: 'laptop', stock: 1, brandId: 'b1', attributes: { ram_gb: 16 } });
    store.clear();
    expect(store.getAttributeSchema('electronics')).toEqual({});
  });

  it('schema updates when product is updated with new attribute values', () => {
    const p = store.create({ name: 'A', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: 'b1', attributes: { color: 'red' } });
    store.update(p.id, { attributes: { color: 'green' } });
    const schema = store.getAttributeSchema('apparel');
    expect(schema.color.values).toContain('green');
  });
});

describe('search: attribute multi-value OR', () => {
  it('returns products matching any value in array', () => {
    store.create({ name: 'Red', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: 'b1', attributes: { color: 'red' } });
    store.create({ name: 'Blue', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: 'b1', attributes: { color: 'blue' } });
    store.create({ name: 'Green', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: 'b1', attributes: { color: 'green' } });
    const result = store.search({ attributes: { color: ['red', 'blue'] } });
    expect(result.total).toBe(2);
    expect(result.items.map(p => p.name).sort()).toEqual(['Blue', 'Red']);
  });

  it('treats empty array as no filter (returns all)', () => {
    store.create({ name: 'X', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: 'b1', attributes: { color: 'red' } });
    const result = store.search({ attributes: { color: [] } });
    expect(result.total).toBe(1);
  });
});

describe('search: attribute numeric range', () => {
  beforeEach(() => {
    store.create({ name: 'Low', price: 10, currency: 'USD', category: 'electronics', type: 'laptop', stock: 1, brandId: 'b1', attributes: { ram_gb: 8 } });
    store.create({ name: 'Mid', price: 10, currency: 'USD', category: 'electronics', type: 'laptop', stock: 1, brandId: 'b1', attributes: { ram_gb: 16 } });
    store.create({ name: 'High', price: 10, currency: 'USD', category: 'electronics', type: 'laptop', stock: 1, brandId: 'b1', attributes: { ram_gb: 32 } });
  });

  it('filters by min only', () => {
    const result = store.search({ attributes: { ram_gb: { min: 16 } } });
    expect(result.total).toBe(2);
  });

  it('filters by max only', () => {
    const result = store.search({ attributes: { ram_gb: { max: 16 } } });
    expect(result.total).toBe(2);
  });

  it('filters by both min and max', () => {
    const result = store.search({ attributes: { ram_gb: { min: 16, max: 16 } } });
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Mid');
  });

  it('excludes product when attribute is non-numeric for range filter', () => {
    store.create({ name: 'TextAttr', price: 10, currency: 'USD', category: 'electronics', type: 'laptop', stock: 1, brandId: 'b1', attributes: { ram_gb: 'na' } });
    const result = store.search({ attributes: { ram_gb: { min: 8 } } });
    expect(result.items.every(p => p.name !== 'TextAttr')).toBe(true);
  });
});

describe('store.search() by brandId', () => {
  beforeEach(() => {
    store.create({ name: 'Alpha Shoe', price: 80, currency: 'USD', category: 'apparel', type: 'shoe', stock: 5, brandId: 'brand-alpha', brandName: 'Alpha' });
    store.create({ name: 'Alpha Bag', price: 60, currency: 'USD', category: 'apparel', type: 'bag', stock: 3, brandId: 'brand-alpha', brandName: 'Alpha' });
    store.create({ name: 'Beta Desk', price: 300, currency: 'USD', category: 'furniture', type: 'desk', stock: 1, brandId: 'brand-beta', brandName: 'Beta' });
  });

  test('returns products matching brandId using byBrand index', () => {
    const result = store.search({ brandId: 'brand-alpha' });
    expect(result.items).toHaveLength(2);
    result.items.forEach(p => expect(p.brandId).toBe('brand-alpha'));
  });

  test('returns empty array when brandId has no products', () => {
    const result = store.search({ brandId: 'brand-nonexistent' });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  test('combines brandId filter with category filter', () => {
    const result = store.search({ brandId: 'brand-alpha', category: 'apparel' });
    expect(result.items).toHaveLength(2);
    result.items.forEach(p => {
      expect(p.brandId).toBe('brand-alpha');
      expect(p.category).toBe('apparel');
    });
  });
});
