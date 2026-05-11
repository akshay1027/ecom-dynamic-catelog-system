'use strict';

module.exports = function authorize(role) {
  return function (req, res, next) {
    if (req.user?.role !== role) {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
    next();
  };
};
