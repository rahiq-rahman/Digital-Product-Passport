const { transferOwnership } = require('./ownership.service');

const transfer = async (req, res) => {
  try {
    const result = await transferOwnership(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { transfer };