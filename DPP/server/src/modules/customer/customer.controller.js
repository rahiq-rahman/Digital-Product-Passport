const { fetchOwnedProducts, transferProduct } = require('./customer.service');
const { getPassportData } = require('../passport/passport.query');

const getMyProducts = async (req, res) => {
  try {
    const products = await fetchOwnedProducts(req.user);
    res.json(products);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getMyPassport = async (req, res) => {
  try {
    // Verify ownership before returning passport
    const passport = await getPassportData(req.params.product_id);
    if (!passport.product) return res.status(404).json({ error: 'Product not found' });

    // Check the customer owns it
    const owns = passport.ownership.some(o => o.to_user_id === req.user.user_id);
    if (!owns) return res.status(403).json({ error: 'You do not own this product' });

    res.json(passport);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const transfer = async (req, res) => {
  try {
    const { product_id, to_email } = req.body;
    const result = await transferProduct(product_id, to_email, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getMyProducts, getMyPassport, transfer };