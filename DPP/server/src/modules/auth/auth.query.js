const pool = require('../../config/db');

const createUser = async (name, phone, email, password, role) => {
  const query = `
    INSERT INTO users (name, phone, email, password, role_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [name, phone, email, password, role]);
  return rows[0];
};

const findUserByPhone = async (phone) => {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE phone = $1`,
    [phone]
  );
  return rows[0];
};

const findUserByEmail = async (email) => {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return rows[0];
};

module.exports = { createUser, findUserByPhone, findUserByEmail };