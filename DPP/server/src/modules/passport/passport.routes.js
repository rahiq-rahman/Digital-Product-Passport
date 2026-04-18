const router = require('express').Router();
const { getPassport } = require('./passport.controller');
const { verifyToken, checkRole } = require('../../middleware/auth.middleware');

router.get(
  '/:product_id',
  verifyToken,
  checkRole(['CUSTOMER']),
  getPassport
);

module.exports = router;