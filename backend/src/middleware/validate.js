'use strict';

function makeError(message, code = 'VALIDATION_ERROR', status = 400) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function validateCreate(req, res, next) {
  const { name, price, currency, category, type, stock, attributes, brandId } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return next(makeError('name is required'));
  }
  if (name.length > 200) {
    return next(makeError('name must not exceed 200 characters'));
  }
  if (price === undefined || price === null) {
    return next(makeError('price is required'));
  }
  if (typeof price !== 'number' || price < 0) {
    return next(makeError('price must be a non-negative number'));
  }
  if (!currency || typeof currency !== 'string' || currency.length !== 3) {
    return next(makeError('currency must be a 3-character ISO 4217 code'));
  }
  if (!category || typeof category !== 'string') {
    return next(makeError('category is required'));
  }
  if (!type || typeof type !== 'string') {
    return next(makeError('type is required'));
  }
  if (stock === undefined || stock === null) {
    return next(makeError('stock is required'));
  }
  if (Number(stock) < 0) {
    return next(makeError('stock must be non-negative'));
  }
  if (!brandId || typeof brandId !== 'string') {
    return next(makeError('brandId is required'));
  }
  if (attributes && typeof attributes === 'object') {
    for (const [key, val] of Object.entries(attributes)) {
      if (val !== null && typeof val === 'object') {
        return next(makeError(`attributes must be flat: key "${key}" has a nested object value`));
      }
    }
  }

  next();
}

function validateUpdate(req, res, next) {
  const { price, currency, stock, attributes, name } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return next(makeError('name must be a non-empty string'));
  }
  if (name !== undefined && name.length > 200) {
    return next(makeError('name must not exceed 200 characters'));
  }
  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    return next(makeError('price must be a non-negative number'));
  }
  if (currency !== undefined && (typeof currency !== 'string' || currency.length !== 3)) {
    return next(makeError('currency must be a 3-character ISO 4217 code'));
  }
  if (stock !== undefined && Number(stock) < 0) {
    return next(makeError('stock must be non-negative'));
  }
  if (attributes !== undefined && typeof attributes === 'object') {
    for (const [key, val] of Object.entries(attributes)) {
      if (val !== null && typeof val === 'object') {
        return next(makeError(`attributes must be flat: key "${key}" has a nested object value`));
      }
    }
  }

  next();
}

function validateListQuery(req, res, next) {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return next(makeError('page must be a positive integer'));
    }
  }
  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      return next(makeError('limit must be an integer between 1 and 100'));
    }
  }

  next();
}

module.exports = { validateCreate, validateUpdate, validateListQuery };
