'use strict';

const app = require('./app');
const { seed } = require('./seed');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: 'server.start',
    port: PORT,
    env: process.env.NODE_ENV || 'development',
  }));
  seed();
});
