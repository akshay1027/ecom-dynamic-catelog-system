'use strict';

const ALLOWED_FIELDS = new Set(['name', 'logoUrl', 'description', 'website']);

function validateBrand(data) {
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    throw new Error('brand name is required');
  }
  if (data.name.length > 100) throw new Error('brand name must not exceed 100 characters');
  if (data.website && data.website.length > 0) {
    try { new URL(data.website); } catch { throw new Error('website must be a valid URL'); }
  }
}

function sanitizeBrand(data) {
  const sanitized = {};
  for (const field of ALLOWED_FIELDS) {
    if (data[field] !== undefined) sanitized[field] = data[field];
  }
  sanitized.logoUrl = sanitized.logoUrl || '';
  sanitized.description = sanitized.description || '';
  sanitized.website = sanitized.website || '';
  return sanitized;
}

module.exports = { validateBrand, sanitizeBrand };
