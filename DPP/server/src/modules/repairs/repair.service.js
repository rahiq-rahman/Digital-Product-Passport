const pool = require('../../config/db');
const { insertRepair } = require('./repair.query');

const addRepairRecord = async (data, user) => {
  const repair = await insertRepair(data, user.user_id);

  await pool.query(
    `INSERT INTO product_event (product_id, user_id, event_type, description)
     VALUES ($1,$2,$3,$4)`,
    [
      data.product_id,
      user.user_id,
      'REPAIR_ADDED',
      `Repair added: ${data.issue}`
    ]
  );

  return repair;
};

module.exports = { addRepairRecord };