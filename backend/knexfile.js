'use strict';

require('dotenv').config({ path: `${__dirname}/.env` });

/** @type {import('knex').Knex.Config} */
const base = {
  client: 'pg',
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
};

module.exports = {
  development: {
    ...base,
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
  },

  test: {
    ...base,
    connection: process.env.DATABASE_URL,
    pool: { min: 1, max: 5 },
  },

  production: {
    ...base,
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
};
