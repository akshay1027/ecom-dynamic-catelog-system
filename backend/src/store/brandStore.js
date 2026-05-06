'use strict';

const { v4: uuidv4 } = require('uuid');

const brands = new Map();

function create(data) {
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    throw new Error('brand name is required');
  }
  for (const b of brands.values()) {
    if (b.name.toLowerCase() === data.name.trim().toLowerCase()) {
      throw new Error(`brand with name "${data.name}" already exists`);
    }
  }
  const now = new Date().toISOString();
  const brand = {
    id: uuidv4(),
    name: data.name.trim(),
    logoUrl: data.logoUrl || '',
    description: data.description || '',
    website: data.website || '',
    createdAt: now,
    updatedAt: now,
  };
  brands.set(brand.id, brand);
  return { ...brand };
}

function findById(id) {
  const b = brands.get(id);
  return b ? { ...b } : null;
}

function list() {
  return [...brands.values()].map(b => ({ ...b }));
}

function update(id, patch) {
  const existing = brands.get(id);
  if (!existing) return null;
  if (patch.name !== undefined) {
    if (typeof patch.name !== 'string' || patch.name.trim() === '') throw new Error('brand name must be a non-empty string');
    for (const [bid, b] of brands.entries()) {
      if (bid !== id && b.name.toLowerCase() === patch.name.trim().toLowerCase()) {
        throw new Error(`brand with name "${patch.name}" already exists`);
      }
    }
  }
  const updated = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    name: patch.name ? patch.name.trim() : existing.name,
  };
  brands.set(id, updated);
  return { ...updated };
}

function remove(id) {
  if (!brands.has(id)) return false;
  brands.delete(id);
  return true;
}

function clear() {
  brands.clear();
}

module.exports = { create, findById, list, update, remove, clear };
