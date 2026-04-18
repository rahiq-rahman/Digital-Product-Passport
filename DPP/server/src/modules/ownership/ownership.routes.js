const router = require('express').Router();
const { transfer } = require('./ownership.controller');
const { verifyToken, checkRole } = require('../../middleware/auth.middleware');

router.post(
  '/transfer',
  verifyToken,
  checkRole(['SHOWROOM']),
  transfer
);

module.exports = router;