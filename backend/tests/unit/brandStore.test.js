'use strict';
const brandStore = require('../../src/store/brandStore');

beforeEach(() => brandStore.clear());

describe('brandStore.create()', () => {
  test('creates a brand with id and timestamps', () => {
    const brand = brandStore.create({ name: 'Nike' });
    expect(brand.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(brand.name).toBe('Nike');
    expect(brand.createdAt).toBeDefined();
  });
  test('throws if name is missing', () => {
    expect(() => brandStore.create({})).toThrow();
  });
  test('throws if brand name already exists (case-insensitive)', () => {
    brandStore.create({ name: 'Nike' });
    expect(() => brandStore.create({ name: 'nike' })).toThrow();
  });
  test('sets default empty strings for optional fields', () => {
    const brand = brandStore.create({ name: 'Adidas' });
    expect(brand.logoUrl).toBe('');
    expect(brand.description).toBe('');
    expect(brand.website).toBe('');
  });
});

describe('brandStore.findById()', () => {
  test('returns brand for known id', () => {
    const created = brandStore.create({ name: 'Puma' });
    expect(brandStore.findById(created.id)).toMatchObject({ name: 'Puma' });
  });
  test('returns null for unknown id', () => {
    expect(brandStore.findById('nope')).toBeNull();
  });
});

describe('brandStore.list()', () => {
  test('returns all brands', () => {
    brandStore.create({ name: 'Brand A' });
    brandStore.create({ name: 'Brand B' });
    expect(brandStore.list()).toHaveLength(2);
  });
  test('returns empty array when no brands', () => {
    expect(brandStore.list()).toEqual([]);
  });
});

describe('brandStore.update()', () => {
  test('updates name and refreshes updatedAt', () => {
    const brand = brandStore.create({ name: 'Old Name' });
    const updated = brandStore.update(brand.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
    expect(updated.createdAt).toBe(brand.createdAt);
  });
  test('returns null for unknown id', () => {
    expect(brandStore.update('nope', { name: 'X' })).toBeNull();
  });
  test('throws on duplicate name during update', () => {
    const a = brandStore.create({ name: 'Brand A' });
    brandStore.create({ name: 'Brand B' });
    expect(() => brandStore.update(a.id, { name: 'Brand B' })).toThrow();
  });
});

describe('brandStore.remove()', () => {
  test('returns true and removes brand', () => {
    const brand = brandStore.create({ name: 'To Delete' });
    expect(brandStore.remove(brand.id)).toBe(true);
    expect(brandStore.findById(brand.id)).toBeNull();
  });
  test('returns false for unknown id', () => {
    expect(brandStore.remove('nope')).toBe(false);
  });
});
