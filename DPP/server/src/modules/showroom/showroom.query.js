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
    `SELECT p.*, si.status as inventory_status
     FROM showroom_inventory si
     JOIN products p ON si.product_id = p.product_id
     WHERE si.showroom_id = $1
     ORDER BY si.inventory_id DESC`,
    [showroom_id]
  );
  return rows;
};

const getAllShowrooms = async () => {
  const { rows } = await pool.query(
    `SELECT u.user_id, u.name, s.showroom_name, s.location
     FROM users u
     JOIN showroom s ON u.user_id = s.user_id
     WHERE u.role_type = 'SHOWROOM'`
  );
  return rows;
};

module.exports = { assignProductToShowroom, getInventoryByShowroom, getAllShowrooms };