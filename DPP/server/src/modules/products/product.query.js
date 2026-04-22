const pool = require('../../config/db');

const insertProduct = async (data, manufacturer_id) => {
  const query = `
    INSERT INTO products
    (serial_number, model_no, product_name, manufacturing_date, warranty, description, current_status, manufacturer_id)
    VALUES ($1,$2,$3,$4,$5,$6,'CREATED',$7)
    RETURNING *;
  `;
  const values = [
    data.serial_number,
    data.model_no,
    data.product_name,
    data.manufacturing_date,
    data.warranty,
    data.description || null,
    manufacturer_id
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getProductsByManufacturer = async (manufacturer_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM products WHERE manufacturer_id = $1 ORDER BY manufacturing_date DESC`,
    [manufacturer_id]
  );
  return rows;
};

const updateProductById = async (product_id, data, manufacturer_id) => {
  const query = `
    UPDATE products SET
      product_name = $1,
      serial_number = $2,
      model_no = $3,
      manufacturing_date = $4,
      warranty = $5,
      description = $6
    WHERE product_id = $7 AND manufacturer_id = $8
    RETURNING *;
  `;
  const values = [
    data.product_name,
    data.serial_number,
    data.model_no,
    data.manufacturing_date,
    data.warranty,
    data.description || null,
    product_id,
    manufacturer_id
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const deleteProductById = async (product_id, manufacturer_id) => {

  // Verify ownership first
  const check = await pool.query(
    `SELECT * FROM products WHERE product_id = $1 AND manufacturer_id = $2`,
    [product_id, manufacturer_id]
  );
  if (!check.rows[0]) return null;

  // Delete all dependent rows first
  await pool.query(`DELETE FROM product_event      WHERE product_id = $1`, [product_id]);
  await pool.query(`DELETE FROM showroom_inventory  WHERE product_id = $1`, [product_id]);
  await pool.query(`DELETE FROM repair_record       WHERE product_id = $1`, [product_id]);
  await pool.query(`DELETE FROM ownership           WHERE product_id = $1`, [product_id]);

  // Now safe to delete the product
  const { rows } = await pool.query(
    `DELETE FROM products WHERE product_id = $1 AND manufacturer_id = $2 RETURNING *`,
    [product_id, manufacturer_id]
  );
  return rows[0];
};

module.exports = {
  insertProduct,
  getProductsByManufacturer,
  updateProductById,
  deleteProductById
};