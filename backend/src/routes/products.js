'use strict';

const router = require('express').Router();
const store = require('../store');
const brandStore = require('../store/brandIndex');
const { sanitizeProduct } = require('../models/product');
const { validateCreate, validateUpdate, validateListQuery, validateVariant } = require('../middleware/validate');

function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data, error: null });
}

function sendError(res, code, message, status) {
  return res.status(status).json({ success: false, data: null, error: { code, message } });
}

function makeError(message, code = 'NOT_FOUND', status = 404) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

// POST /api/v1/products
router.post('/', validateCreate, async (req, res, next) => {
  try {
    const sanitized = sanitizeProduct(req.body);
    const brand = await brandStore.findById(sanitized.brandId);
    if (!brand) {
      return sendError(res, 'INVALID_REFERENCE', 'brandId does not reference a valid brand', 400);
    }
    sanitized.brandName = brand.name;
    const product = await store.create(sanitized);
    return sendSuccess(res, product, 201);
  } catch (err) {
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    return next(err);
  }
});

// GET /api/v1/products/attributes/schema — must be before /:id to avoid route conflict
router.get('/attributes/schema', async (req, res, next) => {
  try {
    const { category } = req.query;
    const schema = await store.getAttributeSchema(category || null);
    return sendSuccess(res, schema);
  } catch (err) {
    return next(err);
  }
});

// GET /api/v1/products — must be before /:id to avoid route conflict
router.get('/', validateListQuery, async (req, res, next) => {
  try {
    const { name, category, type, minPrice, maxPrice, tags, page, limit, brandId } = req.query;
    // req.query.attributes arrives as a nested object when bracket notation is used: ?attributes[color]=red
    const attributes = req.query.attributes;

    const filters = {};
    if (name) filters.name = name;
    if (category) filters.category = category;
    if (type) filters.type = type;
    if (minPrice !== undefined) filters.minPrice = Number(minPrice);
    if (maxPrice !== undefined) filters.maxPrice = Number(maxPrice);
    if (attributes && typeof attributes === 'object') filters.attributes = attributes;
    if (tags) filters.tags = tags;
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);
    if (brandId) filters.brandId = brandId;

    const result = await store.search(filters);
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/products/:id/variants
router.post('/:id/variants', validateVariant, async (req, res, next) => {
  try {
    const product = await store.addVariant(req.params.id, req.body);
    if (!product) return next(makeError('product not found', 'NOT_FOUND', 404));
    return sendSuccess(res, product, 201);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/v1/products/:id/variants/:vid
router.put('/:id/variants/:vid', validateVariant, async (req, res, next) => {
  try {
    const product = await store.updateVariant(req.params.id, req.params.vid, req.body);
    if (!product) return next(makeError('product or variant not found', 'NOT_FOUND', 404));
    return sendSuccess(res, product);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/v1/products/:id/variants/:vid
router.delete('/:id/variants/:vid', async (req, res, next) => {
  try {
    const product = await store.removeVariant(req.params.id, req.params.vid);
    if (!product) return next(makeError('product or variant not found', 'NOT_FOUND', 404));
    return sendSuccess(res, product);
  } catch (err) {
    return next(err);
  }
});

// GET /api/v1/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await store.findById(req.params.id);
    if (!product) {
      return sendError(res, 'NOT_FOUND', `Product ${req.params.id} not found`, 404);
    }
    return sendSuccess(res, product);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/v1/products/:id
router.put('/:id', validateUpdate, async (req, res, next) => {
  try {
    if (req.body.brandId) {
      const brand = await brandStore.findById(req.body.brandId);
      if (!brand) return sendError(res, 'INVALID_REFERENCE', 'brandId does not reference a valid brand', 400);
      req.body.brandName = brand.name;
    }
    const updated = await store.update(req.params.id, req.body);
    if (!updated) {
      return sendError(res, 'NOT_FOUND', `Product ${req.params.id} not found`, 404);
    }
    return sendSuccess(res, updated);
  } catch (err) {
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    return next(err);
  }
});

// DELETE /api/v1/products/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await store.remove(req.params.id);
    if (!deleted) {
      return sendError(res, 'NOT_FOUND', `Product ${req.params.id} not found`, 404);
    }
    return sendSuccess(res, { id: req.params.id, deleted: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
