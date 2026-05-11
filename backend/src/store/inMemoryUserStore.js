'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 10;
const users = new Map();

function formatUser(user, includeHash = false) {
  const out = {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  if (includeHash) out.password_hash = user.password_hash;
  return out;
}

async function create({ email, password, role = 'viewer' }) {
  if (!email || !password) throw new Error('email and password are required');
  const normalised = email.toLowerCase().trim();
  for (const u of users.values()) {
    if (u.email === normalised) throw new Error(`user with email "${email}" already exists`);
  }
  const now = new Date().toISOString();
  const user = {
    id: uuidv4(),
    email: normalised,
    password_hash: await bcrypt.hash(password, SALT_ROUNDS),
    role,
    createdAt: now,
    updatedAt: now,
  };
  users.set(user.id, user);
  return formatUser(user);
}

async function findByEmail(email) {
  if (!email) return null;
  const normalised = email.toLowerCase().trim();
  for (const u of users.values()) {
    if (u.email === normalised) return formatUser(u, true);
  }
  return null;
}

async function findById(id) {
  const u = users.get(id);
  return u ? formatUser(u) : null;
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

async function clear() {
  users.clear();
}

module.exports = { create, findByEmail, findById, verifyPassword, clear };
