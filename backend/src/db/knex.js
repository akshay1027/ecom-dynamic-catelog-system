'use strict';

const knexConfig = require('../../knexfile');

const env = process.env.NODE_ENV || 'development';
const config = knexConfig[env] || knexConfig.development;

const knex = require('knex')(config);

module.exports = knex;
