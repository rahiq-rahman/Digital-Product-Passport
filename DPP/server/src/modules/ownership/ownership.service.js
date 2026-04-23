const pool = require('../../config/db');
const { createOwnership, removeFromInventory } = require('./ownership.query');

const transferOwnership = async (data, user) => {
  const { product_id, customer_id } = data;

  // Check product exists and is in showroom
  const productCheck = await pool.query(
    `SELECT * FROM products WHERE product_id = $1`,
    [product_id]
  );
  if (!productCheck.rows[0]) throw new Error('Product not found');
  if (productCheck.rows[0].current_status !== 'IN_SHOWROOM') {
    throw new Error('Product is not available for sale');
  }

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const ownership = await createOwnership({
    product_id,
    from_user_id: user.user_id,
    to_user_id:   customer_id,
    code
  });

  // Mark showroom inventory as sold
  await removeFromInventory(product_id);

  // ← This was missing — update the product status
  await pool.query(
    `UPDATE products SET current_status = 'SOLD' WHERE product_id = $1`,
    [product_id]
  );

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