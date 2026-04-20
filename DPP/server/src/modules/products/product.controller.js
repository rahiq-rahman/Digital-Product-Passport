const { createProduct, fetchMyProducts, editProduct, removeProduct } = require('./product.service');

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

const updateProduct = async (req, res) => {
  try {
    const product = await editProduct(req.params.id, req.body, req.user);
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await removeProduct(req.params.id, req.user);
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { addProduct, getMyProducts, updateProduct, deleteProduct };