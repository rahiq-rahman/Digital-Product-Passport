const router = require('express').Router();
const { verifyToken } = require('./middleware/auth.middleware');
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/product.routes');
const showroomRoutes = require('./modules/showroom/showroom.routes');
const ownershipRoutes = require('./modules/ownership/ownership.routes');
const repairRoutes = require('./modules/repairs/repair.routes');
const passportRoutes = require('./modules/passport/passport.routes');

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/showroom', showroomRoutes);
router.use('/ownership', ownershipRoutes);
router.use('/repairs', repairRoutes);
router.use('/passport', passportRoutes);

// Test route — must be BEFORE module.exports
router.get('/test', verifyToken, (req, res) => {
  res.json({ message: 'Authorized', user: req.user });
});

module.exports = router;