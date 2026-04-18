const pool = require('../../config/db');
const { createOwnership, removeFromInventory } = require('./ownership.query');

const transferOwnership = async (data, user) => {
  const { product_id, customer_id } = data;

  // generate simple verification code
  const code = Math.random().toString(36).substring(2, 8);

  const ownership = await createOwnership({
    product_id,
    from_user_id: user.user_id,   // showroom
    to_user_id: customer_id,
    code
  });

  await removeFromInventory(product_id);

  await pool.query(
    `INSERT INTO product_event (product_id, user_id, event_type, description)
     VALUES ($1,$2,$3,$4)`,
    [
      product_id,
      user.user_id,
      'SOLD_TO_CUSTOMER',
      `Product sold to customer ${customer_id}`
    ]
  );

  return ownership;
};

module.exports = { transferOwnership };