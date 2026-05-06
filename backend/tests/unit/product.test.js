'use strict';

// These tests will ALL FAIL until product.js is implemented — that is correct (RED phase)

const { validateProduct, sanitizeProduct } = require('../../src/models/product');

describe('validateProduct()', () => {
  const validProduct = {
    name: 'Valid Shirt',
    description: 'A nice shirt',
    price: 29.99,
    currency: 'USD',
    category: 'apparel',
    type: 'shirt',
    images: ['https://example.com/img.jpg'],
    stock: 10,
    tags: ['summer'],
    attributes: { size: 'M', color: 'blue' },
    brandId: 'test-brand-id',
  };

  test('passes a fully valid product without throwing', () => {
    expect(() => validateProduct(validProduct)).not.toThrow();
  });

  test('throws if name is missing', () => {
    const { name, ...withoutName } = validProduct;
    expect(() => validateProduct(withoutName)).toThrow();
  });

  test('throws if name exceeds 200 characters', () => {
    expect(() => validateProduct({ ...validProduct, name: 'a'.repeat(201) })).toThrow();
  });

  test('throws if price is negative', () => {
    expect(() => validateProduct({ ...validProduct, price: -1 })).toThrow();
  });

  test('throws if price is missing', () => {
    const { price, ...withoutPrice } = validProduct;
    expect(() => validateProduct(withoutPrice)).toThrow();
  });

  test('throws if currency is not exactly 3 characters', () => {
    expect(() => validateProduct({ ...validProduct, currency: 'USDX' })).toThrow();
    expect(() => validateProduct({ ...validProduct, currency: 'US' })).toThrow();
  });

  test('throws if stock is negative', () => {
    expect(() => validateProduct({ ...validProduct, stock: -1 })).toThrow();
  });

  test('throws if attributes contains nested objects', () => {
    expect(() => validateProduct({
      ...validProduct,
      attributes: { dimensions: { width: 10, height: 20 } },
    })).toThrow();
  });
});

describe('sanitizeProduct()', () => {
  test('strips unknown top-level fields', () => {
    const result = sanitizeProduct({
      name: 'Shirt',
      price: 10,
      currency: 'USD',
      category: 'apparel',
      type: 'shirt',
      stock: 1,
      unknownField: 'should be removed',
      anotherBadField: 123,
    });
    expect(result.unknownField).toBeUndefined();
    expect(result.anotherBadField).toBeUndefined();
    expect(result.name).toBe('Shirt');
  });

  test('coerces stock to integer', () => {
    const result = sanitizeProduct({
      name: 'Shirt', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: '5.7',
    });
    expect(result.stock).toBe(5);
    expect(Number.isInteger(result.stock)).toBe(true);
  });

  test('sets defaults for missing optional fields', () => {
    const result = sanitizeProduct({
      name: 'Shirt', price: 10, currency: 'USD', category: 'apparel', type: 'shirt', stock: 1,
    });
    expect(result.images).toEqual([]);
    expect(result.tags).toEqual([]);
    expect(result.attributes).toEqual({});
    expect(result.description).toBe('');
  });
});
