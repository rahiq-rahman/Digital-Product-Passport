const router = require('express').Router();
const { getMyProducts, getMyPassport, transfer } = require('./customer.controller');
const { verifyToken, checkRole } = require('../../middleware/auth.middleware');

const auth = [verifyToken, checkRole(['CUSTOMER'])];

router.get('/products',              ...auth, getMyProducts);
router.get('/passport/:product_id',  ...auth, getMyPassport);
router.post('/transfer',             ...auth, transfer);

module.exports = router;