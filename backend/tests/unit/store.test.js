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
    expect(schema.color).toEqual({ type: 'string', values: ['blue', 'red'], isVariantDimension: false }); // sorted
  });

  it('derives type: number with min and max', () => {
    store.create({ name: 'A', price: 10, currency: 'USD', category: 'electronics', type: 'laptop', stock: 1, brandId: 'b1', attributes: { ram_gb: 8 } });
    store.create({ name: 'B', price: 10, currency: 'USD', category: 'electronics', type: 'laptop', stock: 1, brandId: 'b1', attributes: { ram_gb: 32 } });
    const schema = store.getAttributeSchema('electronics');
    expect(schema.ram_gb).toEqual({ type: 'number', min: 8, max: 32, isVariantDimension: false });
  });

  it('derives type: boolean', () => {
    store.create({ name: 'A', price: 10, currency: 'USD', category: 'apparel', type: 'jacket', stock: 1, brandId: 'b1', attributes: { waterproof: true } });
    const schema = store.getAttributeSchema('apparel');
    expect(schema.waterproof).toEqual({ type: 'boolean', isVariantDimension: false });
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

describe('registry: isVariantDimension', () => {
  it('marks attribute as isVariantDimension true when set via variant options', () => {
    store.create({ name: 'Tee', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 0, brandId: 'b1',
      attributes: { color: 'white' },
      variants: [{ options: { size: 'M' }, stock: 20 }]
    });
    const schema = store.getAttributeSchema('apparel');
    expect(schema.size.isVariantDimension).toBe(true);
    expect(schema.color.isVariantDimension).toBe(false);
  });

  it('scalar attribute not from variants has isVariantDimension false', () => {
    store.create({ name: 'Laptop', price: 999, currency: 'USD', category: 'electronics', type: 'laptop', stock: 5, brandId: 'b1',
      attributes: { ram_gb: 16 },
      variants: []
    });
    const schema = store.getAttributeSchema('electronics');
    expect(schema.ram_gb.isVariantDimension).toBe(false);
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

describe('search: variant dimension filtering', () => {
  beforeEach(() => {
    store.create({ name: 'Tee', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 0, brandId: 'b1',
      attributes: { color: 'white' },
      variants: [
        { options: { size: 'S' }, stock: 25 },
        { options: { size: 'M' }, stock: 0 },  // out of stock
        { options: { size: 'L' }, stock: 30 },
      ]
    });
    store.create({ name: 'Hoodie', price: 59, currency: 'USD', category: 'apparel', type: 'hoodie', stock: 0, brandId: 'b1',
      attributes: { color: 'grey' },
      variants: [
        { options: { size: 'M' }, stock: 10 },
        { options: { size: 'L' }, stock: 15 },
      ]
    });
  });

  it('returns product when in-stock variant matches size filter', () => {
    const result = store.search({ attributes: { size: 'M' } });
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Hoodie');  // Tee's M is out of stock
  });

  it('excludes product when matching variant has stock = 0', () => {
    const result = store.search({ attributes: { size: 'M' } });
    expect(result.items.every(p => p.name !== 'Tee')).toBe(true);
  });

  it('returns product matching any size in OR filter', () => {
    const result = store.search({ attributes: { size: ['S', 'L'] } });
    // Tee has in-stock S and L; Hoodie has in-stock L
    expect(result.total).toBe(2);
  });

  it('excludes product when no in-stock variant matches OR filter', () => {
    const result = store.search({ attributes: { size: ['M'] } });
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Hoodie');
  });

  it('treats empty array filter as no-op for variant dimension', () => {
    const result = store.search({ attributes: { size: [] } });
    expect(result.total).toBe(2);
  });

  it('products without variants pass through variant dimension filter check', () => {
    store.create({ name: 'Laptop', price: 999, currency: 'USD', category: 'electronics', type: 'laptop', stock: 5, brandId: 'b1',
      attributes: { ram_gb: 16 }, variants: []
    });
    // size is only isVariantDimension for apparel; filter by size should not affect electronics
    const result = store.search({ category: 'electronics', attributes: { ram_gb: { min: 8 } } });
    expect(result.total).toBe(1);
  });
});

describe('variant CRUD', () => {
  let productId;
  beforeEach(() => {
    const p = store.create({ name: 'Shirt', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 0, brandId: 'b1',
      attributes: { color: 'white' }, variants: [{ options: { size: 'M' }, stock: 20 }]
    });
    productId = p.id;
  });

  it('addVariant: appends variant and recomputes product stock', () => {
    const result = store.addVariant(productId, { options: { size: 'L' }, stock: 15 });
    expect(result.variants).toHaveLength(2);
    expect(result.stock).toBe(35); // 20 + 15
  });

  it('addVariant: returns null for non-existent product', () => {
    expect(store.addVariant('non-existent', { options: { size: 'M' }, stock: 5 })).toBeNull();
  });

  it('updateVariant: updates stock and recomputes product stock', () => {
    const p = store.findById(productId);
    const variantId = p.variants[0].id;
    const result = store.updateVariant(productId, variantId, { stock: 50 });
    expect(result.variants[0].stock).toBe(50);
    expect(result.stock).toBe(50);
  });

  it('removeVariant: removes variant and recomputes product stock', () => {
    const p = store.findById(productId);
    const variantId = p.variants[0].id;
    const result = store.removeVariant(productId, variantId);
    expect(result.variants).toHaveLength(0);
    expect(result.stock).toBe(0);
  });

  it('removeVariant: returns null for non-existent product', () => {
    expect(store.removeVariant('non-existent', 'vid')).toBeNull();
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
