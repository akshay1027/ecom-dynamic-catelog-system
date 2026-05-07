'use strict';

// ALLOWED_FIELDS is the single source of truth for what fields are permitted in the API.
// Any field not in this set is stripped by sanitizeProduct() before it reaches the store.
const ALLOWED_FIELDS = new Set([
  'name', 'description', 'price', 'currency', 'category', 'type',
  'images', 'stock', 'tags', 'attributes', 'brandId', 'brandName', 'variants',
]);

function validateProduct(data) {
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    throw new Error('name is required and must be a non-empty string');
  }
  if (data.name.length > 200) {
    throw new Error('name must not exceed 200 characters');
  }
  if (data.price === undefined || data.price === null) {
    throw new Error('price is required');
  }
  if (typeof data.price !== 'number' || data.price < 0) {
    throw new Error('price must be a non-negative number');
  }
  if (!data.currency || typeof data.currency !== 'string' || data.currency.length !== 3) {
    throw new Error('currency must be a 3-character ISO 4217 code');
  }
  if (!data.category || typeof data.category !== 'string') {
    throw new Error('category is required');
  }
  if (!data.type || typeof data.type !== 'string') {
    throw new Error('type is required');
  }
  if (data.stock === undefined || data.stock === null || Number(data.stock) < 0) {
    throw new Error('stock must be a non-negative number');
  }
  if (!data.brandId || typeof data.brandId !== 'string') {
    throw new Error('brandId is required');
  }
  if (data.attributes && typeof data.attributes === 'object') {
    for (const [key, val] of Object.entries(data.attributes)) {
      if (val !== null && typeof val === 'object') {
        throw new Error(`attributes must be flat: key "${key}" has a nested object value`);
      }
    }
  }
}

function sanitizeProduct(data) {
  const sanitized = {};
  for (const field of ALLOWED_FIELDS) {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  }
  // Apply defaults for optional fields
  sanitized.description = sanitized.description || '';
  sanitized.images = sanitized.images || [];
  sanitized.tags = sanitized.tags || [];
  sanitized.attributes = sanitized.attributes || {};
  // Coerce stock to integer — query strings and form data may deliver it as a string
  if (sanitized.stock !== undefined) {
    sanitized.stock = Math.floor(Number(sanitized.stock));
  }
  sanitized.variants = Array.isArray(sanitized.variants) ? sanitized.variants : [];
  return sanitized;
}

module.exports = { validateProduct, sanitizeProduct };
