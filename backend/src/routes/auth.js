'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const userStore = require('../store/userIndex');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

function makeError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function setCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
  });
}

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return next(makeError(400, 'VALIDATION_ERROR', 'email and password are required'));
    }

    const user = await userStore.findByEmail(email);
    if (!user) return next(makeError(401, 'INVALID_CREDENTIALS', 'Invalid credentials'));

    const valid = await userStore.verifyPassword(password, user.password_hash);
    if (!valid) return next(makeError(401, 'INVALID_CREDENTIALS', 'Invalid credentials'));

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    setCookie(res, token);

    res.status(200).json({
      success: true,
      data: { id: user.id, email: user.email, role: user.role },
      error: null,
    });
  } catch (err) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), operation: 'auth.login', error: err.message, stack: err.stack }));
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  res.status(200).json({ success: true, data: null, error: null });
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await userStore.findById(req.user.sub);
    if (!user) return next(makeError(401, 'UNAUTHORIZED', 'User not found'));
    res.status(200).json({ success: true, data: { id: user.id, email: user.email, role: user.role }, error: null });
  } catch (err) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), operation: 'auth.me', error: err.message, stack: err.stack }));
    next(err);
  }
});

module.exports = router;
