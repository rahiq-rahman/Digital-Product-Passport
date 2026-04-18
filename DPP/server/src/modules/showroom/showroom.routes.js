const router = require('express').Router();
const {
  assignProduct,
  getInventory
} = require('./showroom.controller');

const { verifyToken, checkRole } = require('../../middleware/auth.middleware');

router.post(
  '/assign',
  verifyToken,
  checkRole(['MANUFACTURER']),
  assignProduct
);

router.get(
  '/inventory',
  verifyToken,
  checkRole(['SHOWROOM']),
  getInventory
);

module.exports = router;