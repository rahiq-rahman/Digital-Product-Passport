// DPP/server/src/modules/ai/ai.controller.js
const { getPassportData } = require('../passport/passport.query');
const { analyzePassport } = require('./ai.service');

const analyzeProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id || isNaN(Number(product_id))) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const passport = await getPassportData(product_id);
    if (!passport.product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Build safe passport (same stripping as public.controller)
    const safePassport = {
      product:   passport.product,
      ownership: (passport.ownership || []).map(o => ({
        name: o.name, transfer_date: o.transfer_date,
      })),
      repairs: (passport.repairs || []).map(r => ({
        issue: r.issue, repair_type: r.repair_type,
        repairshop_name: r.repairshop_name,
        repair_price: r.repair_price, repair_status: r.repair_status,
        repair_date: r.repair_date,
      })),
      events: (passport.events || []).map(e => ({
        event_type: e.event_type, description: e.description,
        event_date: e.timestamp || e.event_date,
      })),
    };

    const result = await analyzePassport(safePassport);
    res.json(result);
  } catch (err) {
    console.error('AI analysis error:', err.message);
    res.status(500).json({ error: 'AI analysis failed: ' + err.message });
  }
};

module.exports = { analyzeProduct };