'use strict';

const bcrypt = require('bcryptjs');
const knex = require('../db/knex');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SALT_ROUNDS = 10;

function formatUser(row, includeHash = false) {
  const user = {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
  if (includeHash) user.password_hash = row.password_hash;
  return user;
}

async function create({ email, password, role = 'viewer' }) {
  if (!email || !password) throw new Error('email and password are required');
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date();
  try {
    const [row] = await knex('users').insert({
      email: email.toLowerCase().trim(),
      password_hash,
      role,
      created_at: now,
      updated_at: now,
    }).returning('*');
    return formatUser(row);
  } catch (err) {
    if (err.code === '23505') throw new Error(`user with email "${email}" already exists`);
    throw err;
  }
}

async function findByEmail(email) {
  if (!email) return null;
  const row = await knex('users').whereRaw('LOWER(email) = ?', [email.toLowerCase().trim()]).first();
  return row ? formatUser(row, true) : null;
}

async function findById(id) {
  if (!UUID_RE.test(id)) return null;
  const row = await knex('users').where({ id }).first();
  return row ? formatUser(row) : null;
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

async function clear() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clear() is only available in the test environment');
  }
  await knex.raw('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
}

module.exports = { create, findByEmail, findById, verifyPassword, clear };
