const router = require('express').Router();
const { addRepair } = require('./repair.controller');
const { verifyToken, checkRole } = require('../../middleware/auth.middleware');

router.post(
  '/',
  verifyToken,
  checkRole(['REPAIR']),
  addRepair
);

module.exports = router;