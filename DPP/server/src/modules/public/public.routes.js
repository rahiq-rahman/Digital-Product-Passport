// DPP/server/src/modules/public/public.routes.js
// No authentication required — anyone can access these endpoints.
const router = require('express').Router();
const { getPublicPassport } = require('./public.controller');

// Public passport lookup by product_id — used by QR scan
router.get('/passport/:product_id', getPublicPassport);

module.exports = router;