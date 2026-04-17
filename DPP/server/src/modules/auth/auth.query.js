const pool = require('../../config/db');

// Database queries for auth
const createUser = async (name, phone, password, role) => {
  const query = `
    INSERT INTO users (name, phone, password, role_type)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [name, phone, password, role];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Find user by phone number
const findUserByPhone = async (phone) => {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE phone = $1`,
    [phone]
  );
  return rows[0];
};

module.exports = { createUser, findUserByPhone };