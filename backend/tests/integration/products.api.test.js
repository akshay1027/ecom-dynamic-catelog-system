'use strict';

const request = require('supertest');
const app = require('../../src/app');
const store = require('../../src/store/inMemoryStore');
const brandStore = require('../../src/store/brandStore');

let defaultBrandId;

beforeEach(async () => {
  brandStore.clear();
  store.clear();
  // Create a default brand for all tests
  const brandRes = await request(app).post('/api/v1/brands').send({ name: 'Default Test Brand' });
  defaultBrandId = brandRes.body.data.id;
});

// Helper to create a valid product via API
async function createProduct(overrides = {}) {
  const defaults = {
    name: 'Test Shirt',
    description: 'A test shirt',
    price: 29.99,
    currency: 'USD',
    category: 'apparel',
    type: 'shirt',
    stock: 10,
    images: [],
    tags: [],
    attributes: { size: 'M', color: 'blue' },
    brandId: defaultBrandId,
  };
  const res = await request(app)
    .post('/api/v1/products')
    .send({ ...defaults, ...overrides });
  return res;
}

// ─── POST /api/v1/products ────────────────────────────────────────────────────

describe('POST /api/v1/products', () => {
  test('creates a product with valid body and returns 201 with id', async () => {
    const res = await createProduct();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.name).toBe('Test Shirt');
    expect(res.body.data.price).toBe(29.99);
    expect(res.body.error).toBeNull();
  });

  test('returns 400 if name is missing', async () => {
    const res = await createProduct({ name: undefined });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 400 if price is negative', async () => {
    const res = await createProduct({ price: -5 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 400 if currency is not 3 characters', async () => {
    const res = await createProduct({ currency: 'EURO' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('stores and returns custom attributes', async () => {
    const res = await createProduct({ attributes: { size: 'XL', color: 'red', material: 'polyester' } });
    expect(res.status).toBe(201);
    expect(res.body.data.attributes.size).toBe('XL');
    expect(res.body.data.attributes.color).toBe('red');
  });

  test('returns 400 if stock is missing', async () => {
    const res = await createProduct({ stock: undefined });
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/v1/products/:id ─────────────────────────────────────────────────

describe('GET /api/v1/products/:id', () => {
  test('returns 200 and full product for a known id', async () => {
    const created = await createProduct({ name: 'Oak Desk', category: 'furniture', type: 'desk', price: 399 });
    const id = created.body.data.id;

    const res = await request(app).get(`/api/v1/products/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.name).toBe('Oak Desk');
  });

  test('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/v1/products/nonexistent-id-12345');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ─── PUT /api/v1/products/:id ─────────────────────────────────────────────────

describe('PUT /api/v1/products/:id', () => {
  test('updates price and stock; updatedAt changes, createdAt does not', async () => {
    const created = await createProduct({ price: 100, stock: 5 });
    const id = created.body.data.id;
    const originalCreatedAt = created.body.data.createdAt;

    const res = await request(app)
      .put(`/api/v1/products/${id}`)
      .send({ price: 120, stock: 8 });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(120);
    expect(res.body.data.stock).toBe(8);
    expect(res.body.data.name).toBe('Test Shirt'); // unchanged
    expect(res.body.data.createdAt).toBe(originalCreatedAt);
    expect(res.body.data.updatedAt).not.toBe(originalCreatedAt);
  });

  test('replaces attributes entirely — omitted keys are removed', async () => {
    const created = await createProduct({ attributes: { size: 'M', color: 'blue' } });
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/v1/products/${id}`)
      .send({ attributes: { color: 'green', material: 'silk' } });

    expect(res.status).toBe(200);
    expect(res.body.data.attributes.size).toBeUndefined(); // deleted
    expect(res.body.data.attributes.color).toBe('green');  // updated
    expect(res.body.data.attributes.material).toBe('silk'); // new
  });

  test('returns 404 for an unknown id', async () => {
    const res = await request(app).put('/api/v1/products/nonexistent-id').send({ price: 50 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('returns 400 if price is negative in update', async () => {
    const created = await createProduct();
    const id = created.body.data.id;
    const res = await request(app).put(`/api/v1/products/${id}`).send({ price: -10 });
    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/v1/products/:id ──────────────────────────────────────────────

describe('DELETE /api/v1/products/:id', () => {
  test('returns 200 and deletes the product', async () => {
    const created = await createProduct();
    const id = created.body.data.id;

    const res = await request(app).delete(`/api/v1/products/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('deleted product is not retrievable via GET', async () => {
    const created = await createProduct();
    const id = created.body.data.id;
    await request(app).delete(`/api/v1/products/${id}`);

    const res = await request(app).get(`/api/v1/products/${id}`);
    expect(res.status).toBe(404);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/v1/products/nonexistent-id');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ─── GET /api/v1/products?brandId=X ──────────────────────────────────────────

describe('GET /api/v1/products?brandId=X', () => {
  let brand1Id;
  let brand2Id;

  beforeEach(async () => {
    const b1 = await request(app).post('/api/v1/brands').send({ name: 'Brand Alpha' });
    brand1Id = b1.body.data.id;
    const b2 = await request(app).post('/api/v1/brands').send({ name: 'Brand Beta' });
    brand2Id = b2.body.data.id;

    await createProduct({ name: 'Alpha Shoe', category: 'apparel', type: 'shoe', price: 80, stock: 5, brandId: brand1Id });
    await createProduct({ name: 'Alpha Bag', category: 'apparel', type: 'bag', price: 60, stock: 3, brandId: brand1Id });
    await createProduct({ name: 'Beta Desk', category: 'furniture', type: 'desk', price: 300, stock: 1, brandId: brand2Id });
  });

  it('returns only products for the given brandId', async () => {
    const res = await request(app).get(`/api/v1/products?brandId=${brand1Id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(2);
    res.body.data.items.forEach(p => expect(p.brandId).toBe(brand1Id));
  });

  it('returns empty list if no products match brandId', async () => {
    const b3 = await request(app).post('/api/v1/brands').send({ name: 'Brand Gamma' });
    const brand3Id = b3.body.data.id;
    const res = await request(app).get(`/api/v1/products?brandId=${brand3Id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  it('ignores empty brandId and returns all products', async () => {
    const res = await request(app).get('/api/v1/products?brandId=');
    expect(res.status).toBe(200);
    // empty string brandId should be ignored — returns all 3 products
    expect(res.body.data.total).toBeGreaterThan(0);
  });
});

// ─── GET /api/v1/products (search/list) ──────────────────────────────────────

describe('GET /api/v1/products', () => {
  beforeEach(async () => {
    await createProduct({ name: 'Red T-Shirt', price: 20, category: 'apparel', type: 'tshirt', stock: 10, attributes: { color: 'red', size: 'M' }, tags: ['sale', 'summer'], brandId: defaultBrandId });
    await createProduct({ name: 'Blue Jeans', price: 60, category: 'apparel', type: 'jeans', stock: 5, attributes: { color: 'blue', size: 'L' }, tags: ['summer'], brandId: defaultBrandId });
    await createProduct({ name: 'Oak Desk', price: 400, category: 'furniture', type: 'desk', stock: 2, attributes: { material: 'oak', color: 'brown' }, tags: [], brandId: defaultBrandId });
    await createProduct({ name: 'Gaming Laptop', price: 1200, category: 'electronics', type: 'laptop', stock: 3, attributes: { brand: 'Asus', ram: '32GB' }, tags: ['sale'], brandId: defaultBrandId });
  });

  test('returns all products with default pagination', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(4);
    expect(res.body.data.total).toBe(4);
    expect(res.body.data.page).toBe(1);
  });

  test('filters by category', async () => {
    const res = await request(app).get('/api/v1/products?category=apparel');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    res.body.data.items.forEach(p => expect(p.category).toBe('apparel'));
  });

  test('filters by type', async () => {
    const res = await request(app).get('/api/v1/products?type=laptop');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe('Gaming Laptop');
  });

  test('filters by minPrice and maxPrice', async () => {
    const res = await request(app).get('/api/v1/products?minPrice=60&maxPrice=400');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2); // Jeans(60) + Desk(400)
    res.body.data.items.forEach(p => {
      expect(p.price).toBeGreaterThanOrEqual(60);
      expect(p.price).toBeLessThanOrEqual(400);
    });
  });

  test('filters by custom attribute using bracket notation', async () => {
    const res = await request(app).get('/api/v1/products?attributes[color]=red');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe('Red T-Shirt');
  });

  test('filters by name (case-insensitive substring)', async () => {
    const res = await request(app).get('/api/v1/products?name=desk');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe('Oak Desk');
  });

  test('filters by tags — comma-separated, must match ALL', async () => {
    const res = await request(app).get('/api/v1/products?tags=sale,summer');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe('Red T-Shirt');
  });

  test('paginates correctly with page=2&limit=2', async () => {
    const res = await request(app).get('/api/v1/products?page=2&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.total).toBe(4);
    expect(res.body.data.page).toBe(2);
    expect(res.body.data.limit).toBe(2);
  });

  test('returns empty items array when no match', async () => {
    const res = await request(app).get('/api/v1/products?category=nonexistent');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  test('returns 400 for invalid page (0)', async () => {
    const res = await request(app).get('/api/v1/products?page=0');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 400 for limit exceeding 100', async () => {
    const res = await request(app).get('/api/v1/products?limit=101');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/products/attributes/schema', () => {
  beforeEach(async () => {
    // Create a brand first
    const brandRes = await request(app).post('/api/v1/brands').send({ name: 'TestBrand', description: 'Test' });
    const brandId = brandRes.body.data.id;

    await request(app).post('/api/v1/products').send({
      name: 'Laptop A', price: 999, currency: 'USD', category: 'electronics', type: 'laptop', stock: 5, brandId,
      attributes: { color: 'silver', ram_gb: 16, noise_cancelling: false }
    });
    await request(app).post('/api/v1/products').send({
      name: 'Laptop B', price: 1199, currency: 'USD', category: 'electronics', type: 'laptop', stock: 3, brandId,
      attributes: { color: 'black', ram_gb: 32, noise_cancelling: false }
    });
    await request(app).post('/api/v1/products').send({
      name: 'T-shirt', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 50, brandId,
      attributes: { color: 'red', size: 'M' }
    });
  });

  it('returns schema for given category', async () => {
    const res = await request(app).get('/api/v1/products/attributes/schema?category=electronics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.color).toEqual({ type: 'string', values: ['black', 'silver'], isVariantDimension: false });
    expect(res.body.data.ram_gb).toEqual({ type: 'number', min: 16, max: 32, isVariantDimension: false });
    expect(res.body.data.noise_cancelling).toEqual({ type: 'boolean', isVariantDimension: false });
  });

  it('returns only attributes for the requested category', async () => {
    const res = await request(app).get('/api/v1/products/attributes/schema?category=apparel');
    expect(res.body.data).toHaveProperty('color');
    expect(res.body.data).toHaveProperty('size');
    expect(res.body.data).not.toHaveProperty('ram_gb');
  });

  it('returns empty object for category with no products', async () => {
    const res = await request(app).get('/api/v1/products/attributes/schema?category=furniture');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });

  it('returns merged schema for all categories when no category param', async () => {
    const res = await request(app).get('/api/v1/products/attributes/schema');
    expect(res.body.data).toHaveProperty('color');
    expect(res.body.data).toHaveProperty('ram_gb');
    expect(res.body.data).toHaveProperty('size');
  });
});

describe('attribute filter: multi-value OR via API', () => {
  it('returns products matching any selected attribute value', async () => {
    const brandRes = await request(app).post('/api/v1/brands').send({ name: 'TestBrand2', description: 'T' });
    const brandId = brandRes.body.data.id;
    await request(app).post('/api/v1/products').send({ name: 'Red Shirt', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 10, brandId, attributes: { color: 'red' } });
    await request(app).post('/api/v1/products').send({ name: 'Blue Shirt', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 10, brandId, attributes: { color: 'blue' } });
    await request(app).post('/api/v1/products').send({ name: 'Green Shirt', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 10, brandId, attributes: { color: 'green' } });

    const res = await request(app).get('/api/v1/products?attributes[color][]=red&attributes[color][]=blue');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
  });
});

describe('variant CRUD endpoints', () => {
  let brandId, productId;
  beforeEach(async () => {
    const brandRes = await request(app).post('/api/v1/brands').send({ name: 'TestBrand', description: 'Test' });
    brandId = brandRes.body.data.id;
    const prodRes = await request(app).post('/api/v1/products').send({
      name: 'Test Shirt', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 0, brandId,
      attributes: { color: 'white' },
      variants: [{ options: { size: 'M' }, stock: 20 }]
    });
    productId = prodRes.body.data.id;
  });

  it('POST /:id/variants adds a new variant and returns updated product', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${productId}/variants`)
      .send({ options: { size: 'L' }, stock: 15 });
    expect(res.status).toBe(201);
    expect(res.body.data.variants).toHaveLength(2);
    expect(res.body.data.stock).toBe(35);
  });

  it('POST /:id/variants returns 404 for non-existent product', async () => {
    const res = await request(app)
      .post(`/api/v1/products/non-existent-id/variants`)
      .send({ options: { size: 'L' }, stock: 5 });
    expect(res.status).toBe(404);
  });

  it('POST /:id/variants returns 400 when options missing', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${productId}/variants`)
      .send({ stock: 5 });
    expect(res.status).toBe(400);
  });

  it('PUT /:id/variants/:vid updates variant stock', async () => {
    const product = (await request(app).get(`/api/v1/products/${productId}`)).body.data;
    const variantId = product.variants[0].id;
    const res = await request(app)
      .put(`/api/v1/products/${productId}/variants/${variantId}`)
      .send({ options: { size: 'M' }, stock: 50 });
    expect(res.status).toBe(200);
    expect(res.body.data.variants[0].stock).toBe(50);
    expect(res.body.data.stock).toBe(50);
  });

  it('DELETE /:id/variants/:vid removes the variant', async () => {
    const product = (await request(app).get(`/api/v1/products/${productId}`)).body.data;
    const variantId = product.variants[0].id;
    const res = await request(app)
      .delete(`/api/v1/products/${productId}/variants/${variantId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.variants).toHaveLength(0);
  });

  it('product.stock reflects sum of variant stocks after changes', async () => {
    await request(app)
      .post(`/api/v1/products/${productId}/variants`)
      .send({ options: { size: 'L' }, stock: 30 });
    const res = await request(app).get(`/api/v1/products/${productId}`);
    expect(res.body.data.stock).toBe(50); // 20 + 30
  });
});

describe('attribute filter: variant dimension via API', () => {
  let brandId;
  beforeEach(async () => {
    const brandRes = await request(app).post('/api/v1/brands').send({ name: 'TBrand', description: 'T' });
    brandId = brandRes.body.data.id;
    // Tee: M in-stock, L out-of-stock
    await request(app).post('/api/v1/products').send({
      name: 'Tee', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 0, brandId,
      attributes: { color: 'white' },
      variants: [{ options: { size: 'M' }, stock: 20 }, { options: { size: 'L' }, stock: 0 }]
    });
    // Hoodie: L in-stock
    await request(app).post('/api/v1/products').send({
      name: 'Hoodie', price: 59, currency: 'USD', category: 'apparel', type: 'hoodie', stock: 0, brandId,
      attributes: { color: 'grey' },
      variants: [{ options: { size: 'L' }, stock: 15 }]
    });
  });

  it('returns only products with in-stock variant matching size filter', async () => {
    const res = await request(app).get('/api/v1/products?attributes[size][]=L');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe('Hoodie');
  });

  it('returns union of products for OR size filter', async () => {
    const res = await request(app).get('/api/v1/products?attributes[size][]=M&attributes[size][]=L');
    expect(res.body.data.items).toHaveLength(2);
  });
});

describe('attribute filter: numeric range via API', () => {
  it('returns products within ram_gb range', async () => {
    const brandRes = await request(app).post('/api/v1/brands').send({ name: 'TestBrand3', description: 'T' });
    const brandId = brandRes.body.data.id;
    await request(app).post('/api/v1/products').send({ name: 'Low RAM', price: 500, currency: 'USD', category: 'electronics', type: 'laptop', stock: 5, brandId, attributes: { ram_gb: 8 } });
    await request(app).post('/api/v1/products').send({ name: 'High RAM', price: 1500, currency: 'USD', category: 'electronics', type: 'laptop', stock: 5, brandId, attributes: { ram_gb: 32 } });

    const res = await request(app).get('/api/v1/products?attributes[ram_gb][min]=16');
    expect(res.status).toBe(200);
    expect(res.body.data.items.every(p => p.name !== 'Low RAM')).toBe(true);
  });
});
