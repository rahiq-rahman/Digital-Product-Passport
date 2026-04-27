const {
  initiateShowroomSale,
  confirmShowroomSale,
  initiateCustomerTransfer,
  confirmCustomerTransfer,
  initiateRepair,
  confirmRepair,
} = require('./otp.service');

// ── Showroom sale ─────────────────────────────────────────────────────────────
const initiateSale = async (req, res) => {
  try {
    const { product_id, customer_email } = req.body;
    const result = await initiateShowroomSale(product_id, customer_email, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const confirmSale = async (req, res) => {
  try {
    const { product_id, customer_id, otp } = req.body;
    const result = await confirmShowroomSale(product_id, customer_id, otp, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── Customer transfer ─────────────────────────────────────────────────────────
const initiateTransfer = async (req, res) => {
  try {
    const { product_id, to_email } = req.body;
    const result = await initiateCustomerTransfer(product_id, to_email, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const confirmTransfer = async (req, res) => {
  try {
    const { product_id, recipient_id, otp } = req.body;
    const result = await confirmCustomerTransfer(product_id, recipient_id, otp, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── Repair ────────────────────────────────────────────────────────────────────
const initiateRepairHandler = async (req, res) => {
  try {
    const { product_id } = req.body;
    const result = await initiateRepair(product_id, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const confirmRepairHandler = async (req, res) => {
  try {
    const result = await confirmRepair(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  initiateSale,
  confirmSale,
  initiateTransfer,
  confirmTransfer,
  initiateRepairHandler,
  confirmRepairHandler,
};