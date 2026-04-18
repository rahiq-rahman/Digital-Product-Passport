const pool = require('../../config/db');

const insertRepair = async (data, repairshop_id) => {
  const query = `
    INSERT INTO repair_record
    (product_id, repairshop_id, issue, repair_type, repair_price, estimated_time, repair_status)
    VALUES ($1,$2,$3,$4,$5,$6,'IN_PROGRESS')
    RETURNING *;
  `;

  const values = [
    data.product_id,
    repairshop_id,
    data.issue,
    data.repair_type,
    data.repair_price,
    data.estimated_time
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = { insertRepair };