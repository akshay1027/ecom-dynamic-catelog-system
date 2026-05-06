'use strict';

const request = require('supertest');
const app = require('../../src/app');
const store = require('../../src/store/inMemoryStore');

beforeEach(() => {
  store.clear();
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

  test('merges attributes — existing keys preserved, new keys added', async () => {
    const created = await createProduct({ attributes: { size: 'M', color: 'blue' } });
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/v1/products/${id}`)
      .send({ attributes: { color: 'green', material: 'silk' } });

    expect(res.status).toBe(200);
    expect(res.body.data.attributes.size).toBe('M');       // preserved
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

// ─── GET /api/v1/products (search/list) ──────────────────────────────────────

describe('GET /api/v1/products', () => {
  beforeEach(async () => {
    await createProduct({ name: 'Red T-Shirt', price: 20, category: 'apparel', type: 'tshirt', stock: 10, attributes: { color: 'red', size: 'M' }, tags: ['sale', 'summer'] });
    await createProduct({ name: 'Blue Jeans', price: 60, category: 'apparel', type: 'jeans', stock: 5, attributes: { color: 'blue', size: 'L' }, tags: ['summer'] });
    await createProduct({ name: 'Oak Desk', price: 400, category: 'furniture', type: 'desk', stock: 2, attributes: { material: 'oak', color: 'brown' }, tags: [] });
    await createProduct({ name: 'Gaming Laptop', price: 1200, category: 'electronics', type: 'laptop', stock: 3, attributes: { brand: 'Asus', ram: '32GB' }, tags: ['sale'] });
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
