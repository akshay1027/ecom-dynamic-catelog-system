'use strict';

const { validateVariant } = require('../../src/middleware/validate');

function runMiddleware(body) {
  const req = { body };
  const errors = [];
  const next = (err) => { if (err) errors.push(err); };
  validateVariant(req, {}, next);
  return errors;
}

describe('validateVariant()', () => {
  test('passes when options is valid object and stock is present', () => {
    const errors = runMiddleware({ options: { size: 'M' }, stock: 10 });
    expect(errors).toHaveLength(0);
  });

  test('returns 400 when options is missing', () => {
    const errors = runMiddleware({ stock: 5 });
    expect(errors).toHaveLength(1);
    expect(errors[0].status).toBe(400);
  });

  test('returns 400 when options is an array', () => {
    const errors = runMiddleware({ options: ['M', 'L'], stock: 5 });
    expect(errors).toHaveLength(1);
    expect(errors[0].status).toBe(400);
  });

  test('returns 400 when stock is negative', () => {
    const errors = runMiddleware({ options: { size: 'M' }, stock: -1 });
    expect(errors).toHaveLength(1);
    expect(errors[0].status).toBe(400);
  });

  test('passes when stock is omitted (update case)', () => {
    const errors = runMiddleware({ options: { size: 'M' } });
    expect(errors).toHaveLength(0);
  });
});
