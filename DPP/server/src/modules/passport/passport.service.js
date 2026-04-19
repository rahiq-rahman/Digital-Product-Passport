const pool = require('../../config/db');
const { getPassportData } = require('./passport.query');

const viewPassport = async (product_id, user) => {
  if (user.role === 'CUSTOMER') {
    const checkOwnership = await pool.query(
      `SELECT * FROM ownership WHERE product_id = $1 AND to_user_id = $2`,
      [product_id, user.user_id]
    );
    if (checkOwnership.rows.length === 0) {
      throw new Error('You do not own this product');
    }
  }

  return await getPassportData(product_id);
};

module.exports = { viewPassport };