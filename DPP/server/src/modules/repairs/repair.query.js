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
    data.repair_price || null,
    data.estimated_time || null,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getRepairsByShop = async (repairshop_id) => {
  const query = `
    SELECT
      r.*,
      p.product_name,
      p.serial_number,
      p.model_no,
      p.current_status  AS product_status,
      u_owner.name      AS owner_name,
      u_owner.email     AS owner_email
    FROM repair_record r
    JOIN products p ON r.product_id = p.product_id
    LEFT JOIN ownership o ON (
      o.product_id = r.product_id
      AND o.transfer_status = 'COMPLETED'
      AND o.ownership_id = (
        SELECT MAX(o2.ownership_id)
        FROM ownership o2
        WHERE o2.product_id = r.product_id
      )
    )
    LEFT JOIN users u_owner ON o.to_user_id = u_owner.user_id
    WHERE r.repairshop_id = $1
    ORDER BY r.repair_date DESC;
  `;
  const { rows } = await pool.query(query, [repairshop_id]);
  return rows;
};

const updateRepairStatus = async (repair_id, repairshop_id, new_status) => {
  const { rows } = await pool.query(
    `UPDATE repair_record
     SET repair_status = $1
     WHERE repair_id = $2 AND repairshop_id = $3
     RETURNING *`,
    [new_status, repair_id, repairshop_id]
  );
  return rows[0] || null;
};

module.exports = { insertRepair, getRepairsByShop, updateRepairStatus };