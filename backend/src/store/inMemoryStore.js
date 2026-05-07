'use strict';

const { v4: uuidv4 } = require('uuid');

const store = new Map();
// Secondary indexes for fast category/type/brand filtering
const byCategory = new Map(); // category -> Set of ids
const byType = new Map();     // type -> Set of ids
const byBrand = new Map();    // brandId -> Set of ids

// Attribute registry: category → { [key]: { type, values: Set, min, max } }
// Maintained on every product write — O(1) reads at query time
const attributeRegistry = new Map();

function addToIndex(indexMap, key, id) {
  if (!indexMap.has(key)) indexMap.set(key, new Set());
  indexMap.get(key).add(id);
}

function updateRegistry(category, attributes, isVariantDimension = false) {
  if (!attributes || typeof attributes !== 'object') return;
  if (!attributeRegistry.has(category)) attributeRegistry.set(category, {});
  const catReg = attributeRegistry.get(category);
  for (const [key, val] of Object.entries(attributes)) {
    if (!catReg[key]) catReg[key] = { type: null, values: new Set(), min: Infinity, max: -Infinity, isVariantDimension: false };
    const entry = catReg[key];
    if (isVariantDimension) entry.isVariantDimension = true;
    if (typeof val === 'boolean') {
      if (entry.type === null) entry.type = 'boolean';
    } else if (typeof val === 'number') {
      entry.type = entry.type === 'string' ? 'string' : 'number';
      entry.min = Math.min(entry.min, val);
      entry.max = Math.max(entry.max, val);
    } else {
      entry.type = 'string';
      entry.values.add(String(val));
    }
  }
}

function mergeAllCategories() {
  const merged = {};
  for (const catSchema of attributeRegistry.values()) {
    for (const [key, entry] of Object.entries(catSchema)) {
      if (!merged[key]) {
        merged[key] = { type: entry.type, values: new Set(entry.values), min: entry.min, max: entry.max, isVariantDimension: entry.isVariantDimension || false };
      } else {
        if (entry.type === 'string') merged[key].type = 'string';
        entry.values.forEach(v => merged[key].values.add(v));
        if (typeof entry.min === 'number') merged[key].min = Math.min(merged[key].min, entry.min);
        if (typeof entry.max === 'number') merged[key].max = Math.max(merged[key].max, entry.max);
        // OR logic: if any category marks this as a variant dimension, it is one
        if (entry.isVariantDimension) merged[key].isVariantDimension = true;
      }
    }
  }
  return merged;
}

function serializeSchema(schema) {
  const result = {};
  for (const [key, entry] of Object.entries(schema)) {
    if (entry.type === 'boolean') {
      result[key] = { type: 'boolean', isVariantDimension: entry.isVariantDimension || false };
    } else if (entry.type === 'number') {
      result[key] = { type: 'number', min: entry.min === Infinity ? 0 : entry.min, max: entry.max === -Infinity ? 0 : entry.max, isVariantDimension: entry.isVariantDimension || false };
    } else if (entry.type === 'string') {
      result[key] = { type: 'string', values: [...entry.values].sort(), isVariantDimension: entry.isVariantDimension || false };
    }
  }
  return result;
}

function getAttributeSchema(category) {
  const source = category
    ? (attributeRegistry.get(category) || {})
    : mergeAllCategories();
  return serializeSchema(source);
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

  // If variants are provided, compute stock as sum of variant stocks
  const inputVariants = Array.isArray(data.variants) ? data.variants : [];
  // Assign IDs to any variants that lack one
  const variants = inputVariants.map(v => ({
    id: v.id || crypto.randomUUID(),
    options: v.options || {},
    stock: typeof v.stock === 'number' ? v.stock : 0,
  }));
  const computedStock = variants.length > 0
    ? variants.reduce((sum, v) => sum + v.stock, 0)
    : Math.floor(Number(data.stock));

  const product = {
    id: uuidv4(),
    name: data.name.trim(),
    description: data.description || '',
    price: data.price,
    currency: data.currency || 'USD',
    category: data.category,
    type: data.type,
    images: data.images || [],
    stock: computedStock,
    tags: data.tags || [],
    attributes: data.attributes || {},
    variants,
    brandId: data.brandId || '',
    brandName: data.brandName || '',
    createdAt: now,
    updatedAt: now,
  };

  store.set(product.id, product);
  addToIndex(byCategory, product.category, product.id);
  addToIndex(byType, product.type, product.id);
  addToIndex(byBrand, product.brandId, product.id);
  updateRegistry(product.category, product.attributes, false);
  for (const v of product.variants) {
    updateRegistry(product.category, v.options, true);
  }

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
  updateRegistry(updated.category, updated.attributes, false);
  for (const v of (updated.variants || [])) {
    updateRegistry(updated.category, v.options, true);
  }
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
        const catReg = attributeRegistry.get(product.category) || {};
        const isVariantDim = catReg[key]?.isVariantDimension || false;

        if (isVariantDim) {
          if (Array.isArray(val) && val.length === 0) continue; // no filter = pass
          const matchingVariants = (product.variants || []).filter(v => {
            const vVal = v.options[key];
            if (vVal == null) return false;
            if (Array.isArray(val)) {
              return val.map(String).includes(String(vVal));
            }
            return String(vVal) === String(val);
          }).filter(v => v.stock > 0);
          if (matchingVariants.length === 0) return false;
        } else {
          const productVal = product.attributes[key];
          if (productVal == null) return false;
          if (Array.isArray(val)) {
            if (val.length === 0) continue; // empty array = no filter
            if (!val.map(String).includes(String(productVal))) return false;
          } else if (val !== null && typeof val === 'object') {
            // Numeric range: { min?, max? }
            const numVal = Number(productVal);
            if (isNaN(numVal)) return false;
            if (val.min !== undefined && val.min !== '' && numVal < Number(val.min)) return false;
            if (val.max !== undefined && val.max !== '' && numVal > Number(val.max)) return false;
          } else {
            // Exact match (backward-compatible)
            if (String(productVal) !== String(val)) return false;
          }
        }
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

function recomputeStockFromVariants(product) {
  product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  product.updatedAt = new Date().toISOString();
}

function addVariant(productId, variantData) {
  const product = store.get(productId);
  if (!product) return null;

  const variant = {
    id: crypto.randomUUID(),
    options: variantData.options || {},
    stock: typeof variantData.stock === 'number' ? variantData.stock : 0,
  };
  product.variants.push(variant);
  recomputeStockFromVariants(product);
  store.set(productId, product);
  updateRegistry(product.category, variant.options, true);
  return { ...product };
}

function updateVariant(productId, variantId, patch) {
  const product = store.get(productId);
  if (!product) return null;

  const variantIndex = product.variants.findIndex(v => v.id === variantId);
  if (variantIndex === -1) return null;

  product.variants[variantIndex] = { ...product.variants[variantIndex], ...patch, id: variantId };
  recomputeStockFromVariants(product);
  store.set(productId, product);
  updateRegistry(product.category, product.variants[variantIndex].options, true);
  return { ...product };
}

function removeVariant(productId, variantId) {
  const product = store.get(productId);
  if (!product) return null;

  product.variants = product.variants.filter(v => v.id !== variantId);
  recomputeStockFromVariants(product);
  store.set(productId, product);
  return { ...product };
}

function clear() {
  store.clear();
  byCategory.clear();
  byType.clear();
  byBrand.clear();
  attributeRegistry.clear();
}

module.exports = { create, findById, update, remove, search, clear, getAttributeSchema, addVariant, updateVariant, removeVariant };
