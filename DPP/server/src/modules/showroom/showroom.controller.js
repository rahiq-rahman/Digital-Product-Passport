const { sendToShowroom, viewInventory, fetchAllShowrooms } = require('./showroom.service');

const assignProduct = async (req, res) => {
  try {
    const { product_id, showroom_id } = req.body;
    const result = await sendToShowroom(product_id, showroom_id, req.user);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getInventory = async (req, res) => {
  try {
    const data = await viewInventory(req.user);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getShowrooms = async (req, res) => {
  try {
    const data = await fetchAllShowrooms();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { assignProduct, getInventory, getShowrooms };