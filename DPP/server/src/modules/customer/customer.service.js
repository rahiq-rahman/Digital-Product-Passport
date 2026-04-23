const pool = require('../../config/db');
const { getOwnedProducts, transferToUser } = require('./customer.query');

const fetchOwnedProducts = async (user) => {
  return await getOwnedProducts(user.user_id);
};

const transferProduct = async (product_id, to_email, user) => {
  const result = await transferToUser(product_id, user.user_id, to_email);

  // Log the event
  await pool.query(
    `INSERT INTO product_event (product_id, user_id, event_type, description)
     VALUES ($1, $2, $3, $4)`,
    [
      product_id,
      user.user_id,
      'OWNERSHIP_TRANSFERRED',
      `Ownership transferred to ${result.recipient.name} (${to_email})`
    ]
  );

  return result;
};

module.exports = { fetchOwnedProducts, transferProduct };