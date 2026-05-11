'use strict';

const useInMemory = !process.env.DATABASE_URL || process.env.USE_IN_MEMORY === 'true';

module.exports = useInMemory
  ? require('./brandStore')
  : require('./postgresBrandStore');
