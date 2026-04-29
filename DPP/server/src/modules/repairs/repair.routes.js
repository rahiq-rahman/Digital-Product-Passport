const router = require('express').Router();
const { addRepair, getRepairJobs, updateStatus } = require('./repair.controller');
const { verifyToken, checkRole } = require('../../middleware/auth.middleware');

const auth = [verifyToken, checkRole(['REPAIR'])];

// Original: log a repair (now via OTP, kept for direct use)
router.post('/', ...auth, addRepair);

// New: get all repair jobs for this shop
router.get('/jobs', ...auth, getRepairJobs);

// New: update status of a repair job
router.patch('/:repair_id/status', ...auth, updateStatus);

module.exports = router;