'use strict';

const { v4: uuidv4 } = require('uuid');

const store = new Map();
// Secondary indexes for fast category/type/brand filtering
const byCategory = new Map(); // category -> Set of ids
const byType = new Map();     // type -> Set of ids
const byBrand = new Map();    // brandId -> Set of ids

function addToIndex(indexMap, key, id) {
  if (!indexMap.has(key)) indexMap.set(key, new Set());
  indexMap.get(key).add(id);
}

function removeFromIndex(indexMap, key, id) {
  const set = indexMap.get(key);
  if (set) {
    set.delete(id);
    if (set.size === 0) indexMap.delete(key);
  }
}

function create(data) {
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    throw new Error('name is required');
  }
  if (data.price === undefined || data.price === null) {
    throw new Error('price is required');
  }
  if (typeof data.price !== 'number' || data.price < 0) {
    throw new Error('price must be a non-negative number');
  }
  if (!data.category) throw new Error('category is required');
  if (!data.type) throw new Error('type is required');
  if (data.stock === undefined || data.stock === null) throw new Error('stock is required');
  if (!data.brandId) throw new Error('brandId is required');

  const now = new Date().toISOString();
  const product = {
    id: uuidv4(),
    name: data.name.trim(),
    description: data.description || '',
    price: data.price,
    currency: data.currency || 'USD',
    category: data.category,
    type: data.type,
    images: data.images || [],
    stock: Math.floor(Number(data.stock)),
    tags: data.tags || [],
    attributes: data.attributes || {},
    brandId: data.brandId || '',
    brandName: data.brandName || '',
    createdAt: now,
    updatedAt: now,
  };

  store.set(product.id, product);
  addToIndex(byCategory, product.category, product.id);
  addToIndex(byType, product.type, product.id);
  addToIndex(byBrand, product.brandId, product.id);

  return { ...product };
}

function findById(id) {
  const product = store.get(id);
  return product ? { ...product } : null;
}

function update(id, patch) {
  const existing = store.get(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...patch,
    id: existing.id,               // id is immutable
    createdAt: existing.createdAt, // createdAt is immutable
    // Guarantee updatedAt is strictly after createdAt even within the same millisecond
    updatedAt: (() => {
      const now = new Date().toISOString();
      return now > existing.createdAt ? now : new Date(new Date(existing.createdAt).getTime() + 1).toISOString();
    })(),
  };

  // Merge attributes rather than replace — preserves existing keys, adds/updates new ones
  if (patch.attributes) {
    updated.attributes = { ...existing.attributes, ...patch.attributes };
  }

  // Update indexes if category, type, or brandId changed
  if (patch.category && patch.category !== existing.category) {
    removeFromIndex(byCategory, existing.category, id);
    addToIndex(byCategory, patch.category, id);
  }
  if (patch.type && patch.type !== existing.type) {
    removeFromIndex(byType, existing.type, id);
    addToIndex(byType, patch.type, id);
  }
  if (patch.brandId && patch.brandId !== existing.brandId) {
    removeFromIndex(byBrand, existing.brandId, id);
    addToIndex(byBrand, patch.brandId, id);
  }

  store.set(id, updated);
  return { ...updated };
}

function remove(id) {
  const existing = store.get(id);
  if (!existing) return false;

  removeFromIndex(byCategory, existing.category, id);
  removeFromIndex(byType, existing.type, id);
  removeFromIndex(byBrand, existing.brandId, id);
  store.delete(id);
  return true;
}

function search(filters = {}) {
  const {
    name,
    category,
    type,
    minPrice,
    maxPrice,
    attributes: attrFilters,
    tags,
    page = 1,
    limit = 20,
    brandId,
  } = filters;

  // Start with index-based candidate set when possible
  let candidates;
  if (brandId && byBrand.has(brandId) && !category && !type) {
    candidates = [...byBrand.get(brandId)].map(id => store.get(id)).filter(Boolean);
  } else if (category && byCategory.has(category)) {
    candidates = [...byCategory.get(category)].map(id => store.get(id)).filter(Boolean);
  } else if (type && byType.has(type) && !category) {
    candidates = [...byType.get(type)].map(id => store.get(id)).filter(Boolean);
  } else {
    candidates = [...store.values()];
  }

  // Apply remaining filters linearly
  const filtered = candidates.filter(product => {
    if (brandId && product.brandId !== brandId) return false;
    if (category && product.category !== category) return false;
    if (type && product.type !== type) return false;
    if (minPrice !== undefined && product.price < Number(minPrice)) return false;
    if (maxPrice !== undefined && product.price > Number(maxPrice)) return false;
    if (name && !product.name.toLowerCase().includes(name.toLowerCase())) return false;
    if (attrFilters && typeof attrFilters === 'object') {
      for (const [key, val] of Object.entries(attrFilters)) {
        // String comparison handles numeric attribute values arriving as query-string strings
        if (product.attributes[key] == null || String(product.attributes[key]) !== String(val)) return false;
      }
    }
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      if (!tagList.every(tag => product.tags.includes(tag))) return false;
    }
    return true;
  });

  const total = filtered.length;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const start = (pageNum - 1) * limitNum;
  const items = filtered.slice(start, start + limitNum).map(p => ({ ...p }));

  return { items, total, page: pageNum, limit: limitNum };
}

function clear() {
  store.clear();
  byCategory.clear();
  byType.clear();
  byBrand.clear();
}

module.exports = { create, findById, update, remove, search, clear };
