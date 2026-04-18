const router = require('express').Router();
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/product.routes');
const showroomRoutes = require('./modules/showroom/showroom.routes');
const ownershipRoutes = require('./modules/ownership/ownership.routes');
const repairRoutes = require('./modules/repairs/repair.routes');
const passportRoutes = require('./modules/passport/passport.routes');

// Use auth routes
router.use('/auth', authRoutes);

// Use product routes
router.use('/products', productRoutes);

// Use showroom routes
router.use('/showroom', showroomRoutes);

// Use ownership routes
router.use('/ownership', ownershipRoutes);

// Use repair routes
router.use('/repairs', repairRoutes);

// Use passport routes
router.use('/passport', passportRoutes);

module.exports = router;

// Test route to verify token middleware
const { verifyToken } = require('./middleware/auth.middleware');

router.get('/test', verifyToken, (req, res) => {
  res.json({ message: 'Authorized', user: req.user });
});