const { addRepairRecord } = require('./repair.service');

const addRepair = async (req, res) => {
  try {
    const result = await addRepairRecord(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { addRepair };