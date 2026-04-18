const pool = require('../../config/db');

const assignProductToShowroom = async (product_id, showroom_id) => {
  const query = `
    INSERT INTO showroom_inventory (product_id, showroom_id, status)
    VALUES ($1, $2, 'IN_SHOWROOM')
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [product_id, showroom_id]);
  return rows[0];
};

const getInventoryByShowroom = async (showroom_id) => {
  const { rows } = await pool.query(
    `SELECT p.* FROM showroom_inventory si
     JOIN products p ON si.product_id = p.product_id
     WHERE si.showroom_id = $1 AND si.status = 'IN_SHOWROOM'`,
    [showroom_id]
  );
  return rows;
};

module.exports = { assignProductToShowroom, getInventoryByShowroom };