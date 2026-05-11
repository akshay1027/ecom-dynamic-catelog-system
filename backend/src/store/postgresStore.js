'use strict';

const { v4: uuidv4 } = require('uuid');
const knex = require('../db/knex');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Formatters ────────────────────────────────────────────────────────────────

function formatVariant(row) {
  return {
    id: row.id,
    options: row.options || {},
    stock: row.stock,
  };
}

function formatProduct(row, variants = []) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    currency: row.currency,
    category: row.category,
    type: row.type,
    images: row.images || [],
    stock: row.stock,
    tags: row.tags || [],
    attributes: row.attributes || {},
    brandId: row.brand_id,
    brandName: row.brand_name,
    variants,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

// ── Attribute registry helpers ────────────────────────────────────────────────

async function upsertAttributeRegistryEntry(trx, category, key, value, isVariantDimension) {
  const t = typeof value;
  if (t === 'string') {
    await trx.raw(`
      INSERT INTO attribute_registry (category, key, type, values, is_variant_dimension)
      VALUES (?, ?, 'string', ARRAY[?::text], ?)
      ON CONFLICT (category, key) DO UPDATE SET
        values = array(SELECT DISTINCT unnest(attribute_registry.values || EXCLUDED.values) ORDER BY 1),
        is_variant_dimension = attribute_registry.is_variant_dimension OR EXCLUDED.is_variant_dimension
    `, [category, key, value, isVariantDimension]);
  } else if (t === 'number') {
    await trx.raw(`
      INSERT INTO attribute_registry (category, key, type, min_val, max_val, is_variant_dimension)
      VALUES (?, ?, 'number', ?, ?, ?)
      ON CONFLICT (category, key) DO UPDATE SET
        min_val = LEAST(attribute_registry.min_val, EXCLUDED.min_val),
        max_val = GREATEST(attribute_registry.max_val, EXCLUDED.max_val),
        is_variant_dimension = attribute_registry.is_variant_dimension OR EXCLUDED.is_variant_dimension
    `, [category, key, value, value, isVariantDimension]);
  } else if (t === 'boolean') {
    await trx.raw(`
      INSERT INTO attribute_registry (category, key, type, is_variant_dimension)
      VALUES (?, ?, 'boolean', ?)
      ON CONFLICT (category, key) DO UPDATE SET
        is_variant_dimension = attribute_registry.is_variant_dimension OR EXCLUDED.is_variant_dimension
    `, [category, key, isVariantDimension]);
  }
}

async function upsertRegistryForProduct(trx, category, attributes, variants) {
  for (const [key, value] of Object.entries(attributes || {})) {
    await upsertAttributeRegistryEntry(trx, category, key, value, false);
  }
  for (const v of (variants || [])) {
    for (const [key, value] of Object.entries(v.options || {})) {
      await upsertAttributeRegistryEntry(trx, category, key, value, true);
    }
  }
}

// ── Variant dimension detection ───────────────────────────────────────────────

async function getVariantDimensions(category) {
  const rows = await knex('attribute_registry')
    .where({ is_variant_dimension: true })
    .modify(q => { if (category) q.where({ category }); });
  return new Set(rows.map(r => r.key));
}

// ── Fetch variants for a list of product ids ──────────────────────────────────

async function fetchVariants(productIds) {
  if (!productIds.length) return {};
  const rows = await knex('product_variants').whereIn('product_id', productIds);
  const map = {};
  for (const r of rows) {
    if (!map[r.product_id]) map[r.product_id] = [];
    map[r.product_id].push(formatVariant(r));
  }
  return map;
}

// ── Store API ─────────────────────────────────────────────────────────────────

async function create(data) {
  const id = uuidv4();
  const now = new Date();
  const variants = (data.variants || []).map(v => ({
    id: v.id || uuidv4(),
    options: v.options || {},
    stock: parseInt(v.stock, 10) || 0,
  }));
  const stock = variants.length > 0
    ? variants.reduce((sum, v) => sum + v.stock, 0)
    : parseInt(data.stock, 10) || 0;

  await knex.transaction(async (trx) => {
    await trx('products').insert({
      id,
      name: data.name,
      description: data.description || '',
      price: data.price,
      currency: data.currency,
      category: data.category,
      type: data.type,
      images: JSON.stringify(data.images || []),
      stock,
      tags: data.tags || [],
      attributes: data.attributes || {},
      brand_id: data.brandId,
      brand_name: data.brandName || '',
      created_at: now,
      updated_at: now,
    });

    for (const v of variants) {
      await trx('product_variants').insert({
        id: v.id,
        product_id: id,
        options: v.options,
        stock: v.stock,
        created_at: now,
        updated_at: now,
      });
    }

    await upsertRegistryForProduct(trx, data.category, data.attributes, variants);
  });

  return findById(id);
}

async function findById(id) {
  if (!UUID_RE.test(id)) return null;
  const row = await knex('products').where({ id }).first();
  if (!row) return null;
  const variantMap = await fetchVariants([id]);
  return formatProduct(row, variantMap[id] || []);
}

async function update(id, patch) {
  if (!UUID_RE.test(id)) return null;
  const existing = await knex('products').where({ id }).first();
  if (!existing) return null;

  const now = new Date();
  const updates = { updated_at: now };

  const allowedScalars = ['name', 'description', 'price', 'currency', 'category', 'type', 'stock', 'brand_id', 'brand_name'];
  const mapping = { brandId: 'brand_id', brandName: 'brand_name' };

  for (const [k, v] of Object.entries(patch)) {
    const col = mapping[k] || k;
    if (allowedScalars.includes(col)) updates[col] = v;
  }
  if (patch.images !== undefined) updates.images = JSON.stringify(patch.images);
  if (patch.tags !== undefined) updates.tags = patch.tags;
  if (patch.attributes !== undefined) updates.attributes = patch.attributes;

  await knex.transaction(async (trx) => {
    await trx('products').where({ id }).update(updates);
    const category = patch.category || existing.category;
    if (patch.attributes) {
      await upsertRegistryForProduct(trx, category, patch.attributes, []);
    }
  });

  return findById(id);
}

async function remove(id) {
  if (!UUID_RE.test(id)) return false;
  const count = await knex('products').where({ id }).delete();
  return count > 0;
}

async function search(rawFilters) {
  const filters = rawFilters || {};
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));

  // Extract known scalar filters
  const { name, category, type, brandId, minPrice, maxPrice, tags } = filters;

  // Extract attribute filters — supports two call conventions:
  // 1. Nested object from route: filters.attributes = { color: 'red' }
  // 2. Flat bracket-notation from direct store calls: filters['attributes[color]'] = 'red'
  const attrFilters = {};
  if (filters.attributes && typeof filters.attributes === 'object') {
    Object.assign(attrFilters, filters.attributes);
  }
  for (const [k, v] of Object.entries(filters)) {
    const m = k.match(/^attributes\[(.+)\]$/);
    if (m) attrFilters[m[1]] = v;
  }

  // Determine which attribute keys are variant dimensions
  const variantDims = attrFilters && Object.keys(attrFilters).length
    ? await getVariantDimensions(category || null)
    : new Set();

  // Build base query
  const q = knex('products');

  if (name) q.whereILike('name', `%${name}%`);
  if (category) q.where({ category });
  if (type) q.where({ type });
  if (brandId) q.where({ brand_id: brandId });
  if (minPrice !== undefined) q.where('price', '>=', parseFloat(minPrice));
  if (maxPrice !== undefined) q.where('price', '<=', parseFloat(maxPrice));

  if (tags) {
    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagArr.length) q.whereRaw('tags @> ?', [tagArr]);
  }

  // Attribute filters
  for (const [key, value] of Object.entries(attrFilters)) {
    if (variantDims.has(key)) {
      const values = Array.isArray(value) ? value : [value];
      q.where(function () {
        for (const v of values) {
          this.orWhereExists(
            knex('product_variants')
              .where('product_variants.product_id', knex.ref('products.id'))
              .whereRaw('product_variants.options @> ?', [JSON.stringify({ [key]: v })])
              .where('product_variants.stock', '>', 0)
          );
        }
      });
    } else if (value && typeof value === 'object' && !Array.isArray(value) && ('min' in value || 'max' in value)) {
      if (value.min !== undefined) q.whereRaw(`(attributes->>'${key}')::numeric >= ?`, [value.min]);
      if (value.max !== undefined) q.whereRaw(`(attributes->>'${key}')::numeric <= ?`, [value.max]);
    } else if (Array.isArray(value)) {
      q.where(function () {
        for (const v of value) {
          this.orWhereRaw('attributes @> ?', [JSON.stringify({ [key]: v })]);
        }
      });
    } else {
      q.whereRaw('attributes @> ?', [JSON.stringify({ [key]: value })]);
    }
  }

  // Count total matching rows
  const [{ count }] = await q.clone().count('id as count');
  const total = parseInt(count, 10);

  // Fetch page
  const rows = await q.orderBy('created_at', 'desc').limit(limit).offset((page - 1) * limit);

  const variantMap = await fetchVariants(rows.map(r => r.id));
  const items = rows.map(r => formatProduct(r, variantMap[r.id] || []));

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getAttributeSchema(category) {
  const q = knex('attribute_registry');
  if (category) q.where({ category });
  const rows = await q;

  const merged = {};
  for (const row of rows) {
    const key = row.key;
    if (!merged[key]) {
      merged[key] = { type: row.type, isVariantDimension: row.is_variant_dimension };
      if (row.type === 'string') merged[key].values = [...(row.values || [])];
      if (row.type === 'number') {
        merged[key].min = row.min_val !== null ? parseFloat(row.min_val) : undefined;
        merged[key].max = row.max_val !== null ? parseFloat(row.max_val) : undefined;
      }
    } else {
      if (row.is_variant_dimension) merged[key].isVariantDimension = true;
      if (row.type === 'string' && row.values) {
        const existing = new Set(merged[key].values || []);
        for (const v of row.values) existing.add(v);
        merged[key].values = [...existing];
      }
      if (row.type === 'number') {
        const nMin = row.min_val !== null ? parseFloat(row.min_val) : undefined;
        const nMax = row.max_val !== null ? parseFloat(row.max_val) : undefined;
        if (nMin !== undefined) merged[key].min = merged[key].min !== undefined ? Math.min(merged[key].min, nMin) : nMin;
        if (nMax !== undefined) merged[key].max = merged[key].max !== undefined ? Math.max(merged[key].max, nMax) : nMax;
      }
    }
  }
  return merged;
}

// ── Variant operations ────────────────────────────────────────────────────────

async function recomputeStock(trx, productId) {
  const [{ total }] = await trx('product_variants')
    .where({ product_id: productId })
    .sum('stock as total');
  await trx('products')
    .where({ id: productId })
    .update({ stock: parseInt(total, 10) || 0, updated_at: new Date() });
}

async function addVariant(productId, variantData) {
  if (!UUID_RE.test(productId)) return null;
  const exists = await knex('products').where({ id: productId }).first();
  if (!exists) return null;

  const id = variantData.id || uuidv4();
  const now = new Date();

  await knex.transaction(async (trx) => {
    await trx('product_variants').insert({
      id,
      product_id: productId,
      options: variantData.options || {},
      stock: parseInt(variantData.stock, 10) || 0,
      created_at: now,
      updated_at: now,
    });
    await recomputeStock(trx, productId);
    await upsertRegistryForProduct(trx, exists.category, {}, [{ options: variantData.options || {} }]);
  });

  return findById(productId);
}

async function updateVariant(productId, variantId, patch) {
  if (!UUID_RE.test(productId) || !UUID_RE.test(variantId)) return null;
  const product = await knex('products').where({ id: productId }).first();
  if (!product) return null;
  const variant = await knex('product_variants').where({ id: variantId, product_id: productId }).first();
  if (!variant) return null;

  const updates = { updated_at: new Date() };
  if (patch.options !== undefined) updates.options = patch.options;
  if (patch.stock !== undefined) updates.stock = parseInt(patch.stock, 10);

  await knex.transaction(async (trx) => {
    await trx('product_variants').where({ id: variantId }).update(updates);
    await recomputeStock(trx, productId);
  });

  return findById(productId);
}

async function removeVariant(productId, variantId) {
  if (!UUID_RE.test(productId)) return null;
  const product = await knex('products').where({ id: productId }).first();
  if (!product) return null;

  await knex.transaction(async (trx) => {
    await trx('product_variants').where({ id: variantId, product_id: productId }).delete();
    await recomputeStock(trx, productId);
  });

  return findById(productId);
}

async function clear() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clear() is only available in the test environment');
  }
  await knex.raw('TRUNCATE TABLE product_variants, attribute_registry, products RESTART IDENTITY CASCADE');
}

module.exports = {
  create,
  findById,
  update,
  remove,
  search,
  getAttributeSchema,
  addVariant,
  updateVariant,
  removeVariant,
  clear,
};
