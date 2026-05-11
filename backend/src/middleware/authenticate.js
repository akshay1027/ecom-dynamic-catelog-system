'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function makeUnauthorized(res) {
  return res.status(401).json({
    success: false,
    data: null,
    error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
  });
}

module.exports = function authenticate(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return makeUnauthorized(res);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return makeUnauthorized(res);
  }
};
