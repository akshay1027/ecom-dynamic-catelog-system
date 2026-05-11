'use strict';
const request = require('supertest');
const app = require('../../src/app');
const userStore = require('../../src/store/userIndex');
const brandStore = require('../../src/store/brandIndex');
const store = require('../../src/store');

beforeEach(async () => {
  await userStore.clear();
  await brandStore.clear();
  await store.clear();
});

async function createAdmin(overrides = {}) {
  return userStore.create({ email: 'admin@test.com', password: 'Password1!', role: 'admin', ...overrides });
}

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  test('returns 200 and sets token cookie with correct credentials', async () => {
    await createAdmin();
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'Password1!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('admin@test.com');
    expect(res.body.data.role).toBe('admin');
    expect(res.body.data.password).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toContain('token=');
    expect(cookie).toContain('HttpOnly');
  });

  test('returns 401 with wrong password', async () => {
    await createAdmin();
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('returns 401 for unknown email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@test.com', password: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('returns 400 if email or password missing', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com' });
    expect(res.status).toBe(400);
  });
});

// ── GET /api/v1/auth/me ────────────────────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {
  test('returns 401 without cookie', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 200 with current user when authenticated', async () => {
    await createAdmin();
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'Password1!' });
    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@test.com');
    expect(res.body.data.role).toBe('admin');
    expect(res.body.data.password).toBeUndefined();
  });

  test('returns 401 with an invalid/tampered token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', 'token=thisisnotavalidjwt');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/v1/auth/logout ──────────────────────────────────────────────────

describe('POST /api/v1/auth/logout', () => {
  test('returns 200 and clears the token cookie', async () => {
    await createAdmin();
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'Password1!' });
    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);
    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'].join(';');
    expect(setCookie).toContain('token=;');
  });
});

// ── Protected routes ──────────────────────────────────────────────────────────

describe('Protected product write routes', () => {
  test('POST /api/v1/products returns 401 without auth', async () => {
    const res = await request(app).post('/api/v1/products').send({ name: 'Shirt', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1 });
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/products returns 403 for viewer role', async () => {
    await userStore.create({ email: 'viewer@test.com', password: 'Password1!', role: 'viewer' });
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'viewer@test.com', password: 'Password1!' });
    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app).post('/api/v1/products').set('Cookie', cookie)
      .send({ name: 'Shirt', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1 });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('POST /api/v1/products succeeds for admin', async () => {
    const brand = await brandStore.create({ name: 'TestBrand' });
    await createAdmin();
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'Password1!' });
    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app).post('/api/v1/products').set('Cookie', cookie)
      .send({ name: 'Shirt', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1, brandId: brand.id });
    expect(res.status).toBe(201);
  });

  test('DELETE /api/v1/products/:id returns 401 without auth', async () => {
    const res = await request(app).delete('/api/v1/products/nonexistent');
    expect(res.status).toBe(401);
  });
});

describe('Protected brand write routes', () => {
  test('POST /api/v1/brands returns 401 without auth', async () => {
    const res = await request(app).post('/api/v1/brands').send({ name: 'Nike' });
    expect(res.status).toBe(401);
  });

  test('DELETE /api/v1/brands/:id returns 401 without auth', async () => {
    const res = await request(app).delete('/api/v1/brands/nonexistent');
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/brands succeeds for admin', async () => {
    await createAdmin();
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'Password1!' });
    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app).post('/api/v1/brands').set('Cookie', cookie).send({ name: 'Nike' });
    expect(res.status).toBe(201);
  });
});

describe('Public read routes remain accessible without auth', () => {
  test('GET /api/v1/products returns 200 without auth', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
  });

  test('GET /api/v1/brands returns 200 without auth', async () => {
    const res = await request(app).get('/api/v1/brands');
    expect(res.status).toBe(200);
  });
});
