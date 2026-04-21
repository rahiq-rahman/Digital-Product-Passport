const router = require('express').Router();
const { assignProduct, getInventory, getShowrooms } = require('./showroom.controller');
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

router.get(
  '/all',
  verifyToken,
  checkRole(['MANUFACTURER']),
  getShowrooms
);

module.exports = router;