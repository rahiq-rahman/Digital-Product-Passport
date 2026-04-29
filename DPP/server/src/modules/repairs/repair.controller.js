const { addRepairRecord, fetchRepairJobs, changeRepairStatus } = require('./repair.service');

const addRepair = async (req, res) => {
  try {
    const result = await addRepairRecord(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getRepairJobs = async (req, res) => {
  try {
    const jobs = await fetchRepairJobs(req.user);
    res.json(jobs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { repair_id } = req.params;
    const { status } = req.body;
    const result = await changeRepairStatus(repair_id, status, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { addRepair, getRepairJobs, updateStatus };