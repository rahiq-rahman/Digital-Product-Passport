const {
  insertProduct,
  getProductsByManufacturer,
  updateProductById,
  deleteProductById
} = require('./product.query');
const pool = require('../../config/db');

const createProduct = async (data, user) => {
  const product = await insertProduct(data, user.user_id);

  await pool.query(
    `INSERT INTO product_event (product_id, user_id, event_type, description)
     VALUES ($1,$2,$3,$4)`,
    [product.product_id, user.user_id, 'CREATED', 'Product created by manufacturer']
  );

  return product;
};

const fetchMyProducts = async (user) => {
  return await getProductsByManufacturer(user.user_id);
};

const editProduct = async (product_id, data, user) => {
  const product = await updateProductById(product_id, data, user.user_id);
  if (!product) throw new Error('Product not found or not authorized');

  await pool.query(
    `INSERT INTO product_event (product_id, user_id, event_type, description)
     VALUES ($1,$2,$3,$4)`,
    [product_id, user.user_id, 'UPDATED', 'Product details updated by manufacturer']
  );

  return product;
};

const removeProduct = async (product_id, user) => {
  const product = await deleteProductById(product_id, user.user_id);
  if (!product) throw new Error('Product not found or not authorized');
  return product;
};

module.exports = { createProduct, fetchMyProducts, editProduct, removeProduct };