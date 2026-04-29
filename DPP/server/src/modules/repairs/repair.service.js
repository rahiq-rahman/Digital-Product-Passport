const pool = require('../../config/db');
const { insertRepair, getRepairsByShop, updateRepairStatus } = require('./repair.query');

const addRepairRecord = async (data, user) => {
  const repair = await insertRepair(data, user.user_id);

  await pool.query(
    `INSERT INTO product_event (product_id, user_id, event_type, description)
     VALUES ($1,$2,$3,$4)`,
    [data.product_id, user.user_id, 'REPAIR_ADDED', `Repair added: ${data.issue}`]
  );

  return repair;
};

const fetchRepairJobs = async (user) => {
  return await getRepairsByShop(user.user_id);
};

const changeRepairStatus = async (repair_id, new_status, user) => {
  const ALLOWED = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  if (!ALLOWED.includes(new_status)) throw new Error('Invalid status');

  const updated = await updateRepairStatus(repair_id, user.user_id, new_status);
  if (!updated) throw new Error('Repair record not found or not authorized');

  // Log status change event
  await pool.query(
    `INSERT INTO product_event (product_id, user_id, event_type, description)
     VALUES ($1,$2,$3,$4)`,
    [
      updated.product_id,
      user.user_id,
      'REPAIR_STATUS_UPDATED',
      `Repair #${repair_id} status changed to ${new_status}`,
    ]
  );

  return updated;
};

module.exports = { addRepairRecord, fetchRepairJobs, changeRepairStatus };