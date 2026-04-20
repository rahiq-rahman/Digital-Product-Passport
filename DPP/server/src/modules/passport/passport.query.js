const pool = require('../../config/db');

const getPassportData = async (product_id) => {
  const productQuery = `
    SELECT * FROM products WHERE product_id = $1;
  `;

  const ownershipQuery = `
    SELECT o.*, u.name
    FROM ownership o
    JOIN users u ON o.to_user_id = u.user_id
    WHERE o.product_id = $1
    ORDER BY o.transfer_date;
  `;

  const repairQuery = `
    SELECT r.*, u.name AS repairshop_name
    FROM repair_record r
    JOIN users u ON r.repairshop_id = u.user_id
    WHERE r.product_id = $1
    ORDER BY r.created_at;
  `;

  const eventQuery = `
    SELECT e.*, u.name
    FROM product_event e
    JOIN users u ON e.user_id = u.user_id
    WHERE e.product_id = $1
    ORDER BY e.event_date;
  `;

  const product = await pool.query(productQuery, [product_id]);
  const ownership = await pool.query(ownershipQuery, [product_id]);
  const repairs = await pool.query(repairQuery, [product_id]);
  const events = await pool.query(eventQuery, [product_id]);

  return {
    product: product.rows[0],
    ownership: ownership.rows,
    repairs: repairs.rows,
    events: events.rows
  };
};

module.exports = { getPassportData };