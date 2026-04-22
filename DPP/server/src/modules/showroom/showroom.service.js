const pool = require('../../config/db');
const {
  assignProductToShowroom,
  getInventoryByShowroom,
  getAllShowrooms
} = require('./showroom.query');

const sendToShowroom = async (product_id, showroom_id, user) => {

  // Check product exists and belongs to this manufacturer
  const productCheck = await pool.query(
    `SELECT * FROM products WHERE product_id = $1`,
    [product_id]
  );
  if (!productCheck.rows[0]) throw new Error('Product not found');
  if (productCheck.rows[0].current_status !== 'CREATED') {
    throw new Error('Product has already been dispatched or sold');
  }

  // Check not already in any showroom
  const alreadySent = await pool.query(
    `SELECT * FROM showroom_inventory WHERE product_id = $1 AND status = 'IN_SHOWROOM'`,
    [product_id]
  );
  if (alreadySent.rows.length > 0) {
    throw new Error('Product is already in a showroom');
  }

  const inventory = await assignProductToShowroom(product_id, showroom_id);

  // Update product status
  await pool.query(
    `UPDATE products SET current_status = 'IN_SHOWROOM' WHERE product_id = $1`,
    [product_id]
  );

  await pool.query(
    `INSERT INTO product_event (product_id, user_id, event_type, description)
     VALUES ($1,$2,$3,$4)`,
    [product_id, user.user_id, 'MOVED_TO_SHOWROOM', `Product sent to showroom ${showroom_id}`]
  );

  return inventory;
};

const viewInventory = async (user) => {
  return await getInventoryByShowroom(user.user_id);
};

const fetchAllShowrooms = async () => {
  return await getAllShowrooms();
};

module.exports = { sendToShowroom, viewInventory, fetchAllShowrooms };