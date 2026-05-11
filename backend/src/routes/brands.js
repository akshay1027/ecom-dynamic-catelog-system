'use strict';

const router = require('express').Router();
const brandStore = require('../store/brandIndex');
const { validateBrand, sanitizeBrand } = require('../models/brand');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data, error: null });
}
function sendError(res, code, message, status) {
  return res.status(status).json({ success: false, data: null, error: { code, message } });
}

router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    validateBrand(req.body);
    const brand = await brandStore.create(sanitizeBrand(req.body));
    return sendSuccess(res, brand, 201);
  } catch (err) {
    err.status = err.message.includes('already exists') ? 409 : 400;
    err.code = err.message.includes('already exists') ? 'CONFLICT' : 'VALIDATION_ERROR';
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    return sendSuccess(res, await brandStore.list());
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const brand = await brandStore.findById(req.params.id);
    if (!brand) return sendError(res, 'NOT_FOUND', `Brand ${req.params.id} not found`, 404);
    return sendSuccess(res, brand);
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const updated = await brandStore.update(req.params.id, req.body);
    if (!updated) return sendError(res, 'NOT_FOUND', `Brand ${req.params.id} not found`, 404);
    return sendSuccess(res, updated);
  } catch (err) {
    err.status = err.message.includes('already exists') ? 409 : 400;
    err.code = err.message.includes('already exists') ? 'CONFLICT' : 'VALIDATION_ERROR';
    return next(err);
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const deleted = await brandStore.remove(req.params.id);
    if (!deleted) return sendError(res, 'NOT_FOUND', `Brand ${req.params.id} not found`, 404);
    return sendSuccess(res, { id: req.params.id, deleted: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
