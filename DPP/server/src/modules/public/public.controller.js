// DPP/server/src/modules/public/public.controller.js
const { getPassportData } = require('../passport/passport.query');

const getPublicPassport = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id || isNaN(Number(product_id))) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    const passport = await getPassportData(product_id);
    if (!passport.product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // Return public view — ownership names, repair history, event timeline
    // Sensitive: omit owner emails, user IDs
    const safeOwnership = (passport.ownership || []).map(o => ({
      name:          o.name,
      transfer_date: o.transfer_date,
    }));
    const safeRepairs = (passport.repairs || []).map(r => ({
      issue:          r.issue,
      repair_type:    r.repair_type,
      repairshop_name:r.repairshop_name,
      repair_price:   r.repair_price,
      estimated_time: r.estimated_time,
      repair_date:    r.repair_date,
      repair_status:  r.repair_status,
    }));
    const safeEvents = (passport.events || []).map(e => ({
      event_type:  e.event_type,
      description: e.description,
      event_date:  e.timestamp || e.event_date,
    }));
    res.json({
      product:   passport.product,
      ownership: safeOwnership,
      repairs:   safeRepairs,
      events:    safeEvents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getPublicPassport };