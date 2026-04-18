const { createProduct, fetchMyProducts } = require('./product.service');

const addProduct = async (req, res) => {
  try {
    const product = await createProduct(req.body, req.user);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const products = await fetchMyProducts(req.user);
    res.json(products);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { addProduct, getMyProducts };