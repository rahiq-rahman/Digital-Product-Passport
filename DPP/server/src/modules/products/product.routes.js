const router = require('express').Router();
const { addProduct, getMyProducts } = require('./product.controller');
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

module.exports = router;