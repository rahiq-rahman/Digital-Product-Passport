const pool = require('../../config/db');

const insertProduct = async (data, manufacturer_id) => {
  const query = `
    INSERT INTO products
    (serial_number, model_no, product_name, manufacturing_date, warranty, current_status, manufacturer_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *;
  `;

  const values = [
    data.serial_number,
    data.model_no,
    data.product_name,
    data.manufacturing_date,
    data.warranty,
    'CREATED',
    manufacturer_id
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getProductsByManufacturer = async (manufacturer_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM products WHERE manufacturer_id = $1`,
    [manufacturer_id]
  );
  return rows;
};

module.exports = { insertProduct, getProductsByManufacturer };