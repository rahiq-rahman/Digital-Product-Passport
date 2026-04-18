const router = require('express').Router();
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/product.routes');

// Use auth routes
router.use('/auth', authRoutes);

// Use product routes
router.use('/products', productRoutes);

module.exports = router;

// Test route to verify token middleware
const { verifyToken } = require('./middleware/auth.middleware');

router.get('/test', verifyToken, (req, res) => {
  res.json({ message: 'Authorized', user: req.user });
});