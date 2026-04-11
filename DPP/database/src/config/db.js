const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'rahiq',
  port: 5432,
  database: 'digital product passport',
});

module.exports = pool;