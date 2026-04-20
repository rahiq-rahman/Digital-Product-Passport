const router = require('express').Router();
const { addProduct, getMyProducts, updateProduct, deleteProduct } = require('./product.controller');
const { verifyToken, checkRole } = require('../../middleware/auth.middleware');

router.post(
  '/',
  verifyToken,
  checkRole(['MANUFACTURER']),
  addProduct
);

router.get(
  '/my',
  verifyToken,
  checkRole(['MANUFACTURER']),
  getMyProducts
);

router.put(
  '/:id',
  verifyToken,
  checkRole(['MANUFACTURER']),
  updateProduct
);

router.delete(
  '/:id',
  verifyToken,
  checkRole(['MANUFACTURER']),
  deleteProduct
);

module.exports = router;