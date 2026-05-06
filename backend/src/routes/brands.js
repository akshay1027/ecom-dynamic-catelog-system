'use strict';

const router = require('express').Router();
const brandStore = require('../store/brandStore');
const { validateBrand, sanitizeBrand } = require('../models/brand');

function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data, error: null });
}
function sendError(res, code, message, status) {
  return res.status(status).json({ success: false, data: null, error: { code, message } });
}

router.post('/', (req, res, next) => {
  try {
    validateBrand(req.body);
    const brand = brandStore.create(sanitizeBrand(req.body));
    return sendSuccess(res, brand, 201);
  } catch (err) {
    err.status = err.message.includes('already exists') ? 409 : 400;
    err.code = err.message.includes('already exists') ? 'CONFLICT' : 'VALIDATION_ERROR';
    return next(err);
  }
});

router.get('/', (req, res) => sendSuccess(res, brandStore.list()));

router.get('/:id', (req, res) => {
  const brand = brandStore.findById(req.params.id);
  if (!brand) return sendError(res, 'NOT_FOUND', `Brand ${req.params.id} not found`, 404);
  return sendSuccess(res, brand);
});

router.put('/:id', (req, res, next) => {
  try {
    const updated = brandStore.update(req.params.id, req.body);
    if (!updated) return sendError(res, 'NOT_FOUND', `Brand ${req.params.id} not found`, 404);
    return sendSuccess(res, updated);
  } catch (err) {
    err.status = err.message.includes('already exists') ? 409 : 400;
    err.code = err.message.includes('already exists') ? 'CONFLICT' : 'VALIDATION_ERROR';
    return next(err);
  }
});

router.delete('/:id', (req, res) => {
  const deleted = brandStore.remove(req.params.id);
  if (!deleted) return sendError(res, 'NOT_FOUND', `Brand ${req.params.id} not found`, 404);
  return sendSuccess(res, { id: req.params.id, deleted: true });
});

module.exports = router;
