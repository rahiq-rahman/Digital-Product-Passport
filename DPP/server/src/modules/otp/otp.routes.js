const router = require('express').Router();
const { verifyToken, checkRole } = require('../../middleware/auth.middleware');
const {
  initiateSale,
  confirmSale,
  initiateTransfer,
  confirmTransfer,
  initiateRepairHandler,
  confirmRepairHandler,
} = require('./otp.controller');

// Showroom: sell product via customer email + OTP
router.post('/sale/initiate', verifyToken, checkRole(['SHOWROOM']),  initiateSale);
router.post('/sale/confirm',  verifyToken, checkRole(['SHOWROOM']),  confirmSale);

// Customer: transfer ownership via recipient email + OTP
router.post('/transfer/initiate', verifyToken, checkRole(['CUSTOMER']), initiateTransfer);
router.post('/transfer/confirm',  verifyToken, checkRole(['CUSTOMER']), confirmTransfer);

// Repair: log repair via product owner OTP
router.post('/repair/initiate', verifyToken, checkRole(['REPAIR']), initiateRepairHandler);
router.post('/repair/confirm',  verifyToken, checkRole(['REPAIR']), confirmRepairHandler);

module.exports = router;