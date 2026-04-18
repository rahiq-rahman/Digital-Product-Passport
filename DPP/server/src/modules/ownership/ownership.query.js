const pool = require('../../config/db');

const createOwnership = async (data) => {
  const query = `
    INSERT INTO ownership
    (product_id, from_user_id, to_user_id, transfer_status, verification_code)
    VALUES ($1,$2,$3,'COMPLETED',$4)
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    data.product_id,
    data.from_user_id,
    data.to_user_id,
    data.code
  ]);

  return rows[0];
};

const removeFromInventory = async (product_id) => {
  await pool.query(
    `UPDATE showroom_inventory
     SET status = 'SOLD'
     WHERE product_id = $1`,
    [product_id]
  );
};

module.exports = { createOwnership, removeFromInventory };