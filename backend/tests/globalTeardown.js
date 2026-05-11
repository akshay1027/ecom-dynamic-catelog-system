'use strict';

module.exports = async () => {
  if (!process.env.DATABASE_URL) return;
  const knex = require('../src/db/knex');
  await knex.destroy();
};
