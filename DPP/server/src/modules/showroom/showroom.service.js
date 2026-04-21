const pool = require('../../config/db');
const {
  assignProductToShowroom,
  getInventoryByShowroom,
  getAllShowrooms
} = require('./showroom.query');

const sendToShowroom = async (product_id, showroom_id, user) => {
  const inventory = await assignProductToShowroom(product_id, showroom_id);

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