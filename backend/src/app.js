'use strict';

const express = require('express');
const cors = require('cors');
const productsRouter = require('./routes/products');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cors());

app.use('/api/v1/products', productsRouter);

// Global error handler — 4-arg signature required by Express
app.use((err, req, res, next) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: 'express-error-handler',
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  }));
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    data: null,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status === 500 ? 'Internal server error' : err.message,
    },
  });
});

module.exports = app;
