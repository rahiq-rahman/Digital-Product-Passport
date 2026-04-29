const router = require('express').Router();
const { verifyToken } = require('./middleware/auth.middleware');
const authRoutes     = require('./modules/auth/auth.routes');
const productRoutes  = require('./modules/products/product.routes');
const showroomRoutes = require('./modules/showroom/showroom.routes');
const ownershipRoutes= require('./modules/ownership/ownership.routes');
const repairRoutes   = require('./modules/repairs/repair.routes');
const passportRoutes = require('./modules/passport/passport.routes');
const customerRoutes = require('./modules/customer/customer.routes');
const otpRoutes      = require('./modules/otp/otp.routes');
const publicRoutes   = require('./modules/public/public.routes');

router.use('/auth',      authRoutes);
router.use('/products',  productRoutes);
router.use('/showroom',  showroomRoutes);
router.use('/ownership', ownershipRoutes);
router.use('/repairs',   repairRoutes);
router.use('/passport',  passportRoutes);
router.use('/customer',  customerRoutes);
router.use('/otp',       otpRoutes);
router.use('/public',    publicRoutes);   // ← no auth, accessible by anyone

// Test route
router.get('/test', verifyToken, (req, res) => {
  res.json({ message: 'Authorized', user: req.user });
});

module.exports = router;