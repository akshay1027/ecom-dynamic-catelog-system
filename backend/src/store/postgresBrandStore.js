'use strict';

const knex = require('../db/knex');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatBrand(row) {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    description: row.description,
    website: row.website,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

async function create(data) {
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    throw new Error('brand name is required');
  }
  const name = data.name.trim();
  const now = new Date();
  try {
    const [row] = await knex('brands').insert({
      name,
      logo_url: data.logoUrl || '',
      description: data.description || '',
      website: data.website || '',
      created_at: now,
      updated_at: now,
    }).returning('*');
    return formatBrand(row);
  } catch (err) {
    if (err.code === '23505') {
      throw new Error(`brand with name "${name}" already exists`);
    }
    throw err;
  }
}

async function findById(id) {
  if (!UUID_RE.test(id)) return null;
  const row = await knex('brands').where({ id }).first();
  return row ? formatBrand(row) : null;
}

async function list() {
  const rows = await knex('brands').orderBy('created_at', 'asc');
  return rows.map(formatBrand);
}

async function update(id, patch) {
  if (!UUID_RE.test(id)) return null;
  const existing = await knex('brands').where({ id }).first();
  if (!existing) return null;

  const updates = { updated_at: new Date() };

  if (patch.name !== undefined) {
    if (typeof patch.name !== 'string' || patch.name.trim() === '') {
      throw new Error('brand name must be a non-empty string');
    }
    updates.name = patch.name.trim();
  }
  if (patch.logoUrl !== undefined) updates.logo_url = patch.logoUrl;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.website !== undefined) updates.website = patch.website;

  try {
    const [row] = await knex('brands').where({ id }).update(updates).returning('*');
    return formatBrand(row);
  } catch (err) {
    if (err.code === '23505') {
      throw new Error(`brand with name "${updates.name}" already exists`);
    }
    throw err;
  }
}

async function remove(id) {
  if (!UUID_RE.test(id)) return false;
  const count = await knex('brands').where({ id }).delete();
  return count > 0;
}

async function clear() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clear() is only available in the test environment');
  }
  await knex.raw('TRUNCATE TABLE brands RESTART IDENTITY CASCADE');
}

module.exports = { create, findById, list, update, remove, clear };
