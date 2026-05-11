'use strict';

const brandStore = require('../../src/store/postgresBrandStore');

const REQUIRES_DB = !!process.env.DATABASE_URL;
const describeIfDb = REQUIRES_DB ? describe : describe.skip;

describeIfDb('postgresBrandStore', () => {
  beforeEach(async () => {
    await brandStore.clear();
  });

  describe('create', () => {
    test('returns brand with auto-generated id and timestamps', async () => {
      const b = await brandStore.create({ name: 'TestBrand' });
      expect(b.id).toBeDefined();
      expect(b.name).toBe('TestBrand');
      expect(b.createdAt).toBeDefined();
      expect(b.updatedAt).toBeDefined();
    });

    test('throws on duplicate name (case-insensitive)', async () => {
      await brandStore.create({ name: 'Acme' });
      await expect(brandStore.create({ name: 'acme' })).rejects.toThrow();
    });

    test('throws on missing name', async () => {
      await expect(brandStore.create({ name: '' })).rejects.toThrow();
    });

    test('stores optional fields', async () => {
      const b = await brandStore.create({
        name: 'Acme',
        logoUrl: 'https://example.com/logo.png',
        description: 'A brand',
        website: 'https://acme.com',
      });
      expect(b.logoUrl).toBe('https://example.com/logo.png');
      expect(b.description).toBe('A brand');
      expect(b.website).toBe('https://acme.com');
    });
  });

  describe('findById', () => {
    test('returns null for unknown id', async () => {
      const result = await brandStore.findById('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });

    test('returns brand for known id', async () => {
      const created = await brandStore.create({ name: 'Acme' });
      const found = await brandStore.findById(created.id);
      expect(found.id).toBe(created.id);
      expect(found.name).toBe('Acme');
    });
  });

  describe('list', () => {
    test('returns empty array initially', async () => {
      const brands = await brandStore.list();
      expect(brands).toEqual([]);
    });

    test('returns all created brands', async () => {
      await brandStore.create({ name: 'Alpha' });
      await brandStore.create({ name: 'Beta' });
      const brands = await brandStore.list();
      expect(brands).toHaveLength(2);
    });
  });

  describe('update', () => {
    test('returns null for unknown id', async () => {
      const result = await brandStore.update('00000000-0000-0000-0000-000000000000', { name: 'X' });
      expect(result).toBeNull();
    });

    test('updates name and refreshes updatedAt', async () => {
      const created = await brandStore.create({ name: 'OldName' });
      await new Promise(r => setTimeout(r, 10));
      const updated = await brandStore.update(created.id, { name: 'NewName' });
      expect(updated.name).toBe('NewName');
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });

    test('preserves id and createdAt', async () => {
      const created = await brandStore.create({ name: 'Stable' });
      const updated = await brandStore.update(created.id, { description: 'desc' });
      expect(updated.id).toBe(created.id);
      expect(updated.createdAt).toBe(created.createdAt);
    });
  });

  describe('remove', () => {
    test('returns false for unknown id', async () => {
      expect(await brandStore.remove('00000000-0000-0000-0000-000000000000')).toBe(false);
    });

    test('removes brand', async () => {
      const b = await brandStore.create({ name: 'ToDelete' });
      expect(await brandStore.remove(b.id)).toBe(true);
      expect(await brandStore.findById(b.id)).toBeNull();
    });
  });

  describe('clear', () => {
    test('removes all brands', async () => {
      await brandStore.create({ name: 'A' });
      await brandStore.create({ name: 'B' });
      await brandStore.clear();
      expect(await brandStore.list()).toHaveLength(0);
    });
  });
});
