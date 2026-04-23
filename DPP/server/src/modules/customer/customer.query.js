const pool = require('../../config/db');

// Get all products currently owned by this customer
const getOwnedProducts = async (user_id) => {
  const { rows } = await pool.query(
    `SELECT p.*
     FROM ownership o
     JOIN products p ON o.product_id = p.product_id
     WHERE o.to_user_id = $1
       AND o.transfer_status = 'COMPLETED'
       AND o.ownership_id = (
         SELECT MAX(o2.ownership_id)
         FROM ownership o2
         WHERE o2.product_id = o.product_id
       )
     ORDER BY o.transfer_date DESC`,
    [user_id]
  );
  return rows;
};

// Transfer ownership from current customer to another user by email
const transferToUser = async (product_id, from_user_id, to_email) => {
  // Find the recipient user
  const recipientRes = await pool.query(
    `SELECT user_id, name, role_type FROM users WHERE email = $1`,
    [to_email.toLowerCase()]
  );
  const recipient = recipientRes.rows[0];
  if (!recipient) throw new Error('No user found with that email');
  if (recipient.user_id === from_user_id) throw new Error('You cannot transfer to yourself');

  // Confirm current user owns this product
  const ownerCheck = await pool.query(
    `SELECT * FROM ownership
     WHERE product_id = $1 AND to_user_id = $2 AND transfer_status = 'COMPLETED'
     ORDER BY ownership_id DESC LIMIT 1`,
    [product_id, from_user_id]
  );
  if (!ownerCheck.rows[0]) throw new Error('You do not own this product');

  // Create new ownership record
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { rows } = await pool.query(
    `INSERT INTO ownership
     (product_id, from_user_id, to_user_id, transfer_status, verification_code)
     VALUES ($1, $2, $3, 'COMPLETED', $4)
     RETURNING *`,
    [product_id, from_user_id, recipient.user_id, code]
  );

  return { ownership: rows[0], recipient };
};

module.exports = { getOwnedProducts, transferToUser };