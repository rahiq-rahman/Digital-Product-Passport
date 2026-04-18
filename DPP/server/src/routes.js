const router = require('express').Router();
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/product.routes');
const showroomRoutes = require('./modules/showroom/showroom.routes');

// Use auth routes
router.use('/auth', authRoutes);

// Use product routes
router.use('/products', productRoutes);

// Use showroom routes
router.use('/showroom', showroomRoutes);

module.exports = router;

// Test route to verify token middleware
const { verifyToken } = require('./middleware/auth.middleware');

router.get('/test', verifyToken, (req, res) => {
  res.json({ message: 'Authorized', user: req.user });
});