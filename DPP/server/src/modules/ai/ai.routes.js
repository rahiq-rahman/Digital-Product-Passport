// DPP/server/src/modules/ai/ai.routes.js
// Public — no auth required (same as passport public view)
const router = require('express').Router();
const { analyzeProduct } = require('./ai.controller');

// GET /api/ai/analyze/:product_id
router.get('/analyze/:product_id', analyzeProduct);

module.exports = router;