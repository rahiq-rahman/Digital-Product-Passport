const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'rahiq',
  host: 'rahiq',
  port: 5432,
  database: 'dpp',
});

module.exports = pool;