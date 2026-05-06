'use strict';
const request = require('supertest');
const app = require('../../src/app');
const brandStore = require('../../src/store/brandStore');
const store = require('../../src/store/inMemoryStore');

beforeEach(() => { brandStore.clear(); store.clear(); });

async function createBrand(overrides = {}) {
  return request(app).post('/api/v1/brands').send({ name: 'Test Brand', ...overrides });
}

describe('POST /api/v1/brands', () => {
  test('creates brand and returns 201', async () => {
    const res = await createBrand({ name: 'Nike' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Nike');
  });
  test('returns 400 if name is missing', async () => {
    const res = await request(app).post('/api/v1/brands').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
  test('returns 409 if brand name already exists', async () => {
    await createBrand({ name: 'Nike' });
    const res = await createBrand({ name: 'Nike' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});

describe('GET /api/v1/brands', () => {
  test('returns list of all brands', async () => {
    await createBrand({ name: 'Nike' });
    await createBrand({ name: 'Adidas' });
    const res = await request(app).get('/api/v1/brands');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('GET /api/v1/brands/:id', () => {
  test('returns brand for known id', async () => {
    const { body: { data: brand } } = await createBrand({ name: 'Puma' });
    const res = await request(app).get(`/api/v1/brands/${brand.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Puma');
  });
  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/v1/brands/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/brands/:id', () => {
  test('updates brand fields', async () => {
    const { body: { data: brand } } = await createBrand({ name: 'Old' });
    const res = await request(app).put(`/api/v1/brands/${brand.id}`).send({ name: 'New', description: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New');
  });
  test('returns 404 for unknown id', async () => {
    const res = await request(app).put('/api/v1/brands/nope').send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/brands/:id', () => {
  test('deletes brand and returns 200', async () => {
    const { body: { data: brand } } = await createBrand({ name: 'ToDelete' });
    expect((await request(app).delete(`/api/v1/brands/${brand.id}`)).status).toBe(200);
    expect(brandStore.findById(brand.id)).toBeNull();
  });
  test('returns 404 for unknown id', async () => {
    expect((await request(app).delete('/api/v1/brands/nope')).status).toBe(404);
  });
});

describe('Products require valid brandId', () => {
  test('POST /api/v1/products returns 400 if brandId missing', async () => {
    const res = await request(app).post('/api/v1/products').send({
      name: 'Shirt', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 5,
    });
    expect(res.status).toBe(400);
  });
  test('POST /api/v1/products returns 400 if brandId does not exist', async () => {
    const res = await request(app).post('/api/v1/products').send({
      name: 'Shirt', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 5,
      brandId: 'nonexistent-brand-id',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REFERENCE');
  });
  test('POST /api/v1/products succeeds with valid brandId and sets brandName', async () => {
    const { body: { data: brand } } = await createBrand({ name: 'TestBrand' });
    const res = await request(app).post('/api/v1/products').send({
      name: 'Shirt', price: 29, currency: 'USD', category: 'apparel', type: 'shirt', stock: 5,
      brandId: brand.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.brandId).toBe(brand.id);
    expect(res.body.data.brandName).toBe('TestBrand');
  });
  test('GET /api/v1/products?brandId=x filters by brand', async () => {
    const b1 = (await createBrand({ name: 'BrandOne' })).body.data;
    const b2 = (await createBrand({ name: 'BrandTwo' })).body.data;
    await request(app).post('/api/v1/products').send({ name: 'P1', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: b1.id });
    await request(app).post('/api/v1/products').send({ name: 'P2', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: b2.id });
    const res = await request(app).get(`/api/v1/products?brandId=${b1.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].brandId).toBe(b1.id);
  });
});
