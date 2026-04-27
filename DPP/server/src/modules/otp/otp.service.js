const pool = require('../../config/db');
const { generateOTP, saveOTP, verifyOTP } = require('../../config/otpStore');
const { sendOTPEmail } = require('../../config/mailer');

// ── Showroom: initiate sale by customer email ────────────────────────────────
// Step 1: look up customer by email, send OTP to them
const initiateShowroomSale = async (product_id, customer_email, showroom_user) => {
  // Validate product exists and belongs to this showroom & is IN_SHOWROOM
  const productCheck = await pool.query(
    `SELECT p.* FROM products p
     JOIN showroom_inventory si ON si.product_id = p.product_id
     WHERE p.product_id = $1 AND si.showroom_id = $2 AND si.status = 'IN_SHOWROOM'`,
    [product_id, showroom_user.user_id]
  );
  if (!productCheck.rows[0]) throw new Error('Product not found in your showroom inventory');

  // Find customer
  const customerRes = await pool.query(
    `SELECT user_id, name, email, role_type FROM users WHERE email = $1`,
    [customer_email.toLowerCase()]
  );
  const customer = customerRes.rows[0];
  if (!customer) throw new Error('No user found with that email address');
  if (customer.role_type !== 'CUSTOMER') throw new Error('That email does not belong to a customer account');

  // Generate & send OTP to customer
  const otp = generateOTP();
  const otpKey = `sale:${product_id}:${customer.user_id}`;
  saveOTP(otpKey, otp);
  await sendOTPEmail(customer.email, otp);

  return {
    customer_id:   customer.user_id,
    customer_name: customer.name,
    customer_email: customer.email,
    product:       productCheck.rows[0],
  };
};

// Step 2: verify OTP and complete the sale
const confirmShowroomSale = async (product_id, customer_id, otp, showroom_user) => {
  const otpKey = `sale:${product_id}:${customer_id}`;
  const result = verifyOTP(otpKey, otp);
  if (!result.valid) throw new Error(result.reason);

  // Re-validate product still available
  const productCheck = await pool.query(
    `SELECT p.* FROM products p
     JOIN showroom_inventory si ON si.product_id = p.product_id
     WHERE p.product_id = $1 AND si.showroom_id = $2 AND si.status = 'IN_SHOWROOM'`,
    [product_id, showroom_user.user_id]
  );
  if (!productCheck.rows[0]) throw new Error('Product is no longer available');

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Create ownership record
  await pool.query(
    `INSERT INTO ownership (product_id, from_user_id, to_user_id, transfer_status, verification_code)
     VALUES ($1, $2, $3, 'COMPLETED', $4)`,
    [product_id, showroom_user.user_id, customer_id, code]
  );

  // Mark showroom inventory as sold
  await pool.query(
    `UPDATE showroom_inventory SET status = 'SOLD' WHERE product_id = $1`,
    [product_id]
  );

  // Update product status
  await pool.query(
    `UPDATE products SET current_status = 'SOLD' WHERE product_id = $1`,
    [product_id]
  );

  // Log event
  await pool.query(
    `INSERT INTO product_event (product_id, user_id, event_type, description)
     VALUES ($1, $2, 'SOLD_TO_CUSTOMER', $3)`,
    [product_id, showroom_user.user_id, `Product sold to customer ${customer_id} via OTP confirmation`]
  );

  return { success: true, product_id, customer_id };
};

// ── Customer: initiate transfer by recipient email ───────────────────────────
// Step 1: look up recipient, verify sender owns product, send OTP to recipient
const initiateCustomerTransfer = async (product_id, to_email, from_user) => {
  // Verify ownership
  const ownerCheck = await pool.query(
    `SELECT * FROM ownership
     WHERE product_id = $1 AND to_user_id = $2 AND transfer_status = 'COMPLETED'
     ORDER BY ownership_id DESC LIMIT 1`,
    [product_id, from_user.user_id]
  );
  if (!ownerCheck.rows[0]) throw new Error('You do not own this product');

  // Find recipient
  const recipientRes = await pool.query(
    `SELECT user_id, name, email, role_type FROM users WHERE email = $1`,
    [to_email.toLowerCase()]
  );
  const recipient = recipientRes.rows[0];
  if (!recipient) throw new Error('No user found with that email address');
  if (recipient.user_id === from_user.user_id) throw new Error('You cannot transfer to yourself');

  // Get product info
  const productRes = await pool.query(`SELECT * FROM products WHERE product_id = $1`, [product_id]);
  const product = productRes.rows[0];
  if (!product) throw new Error('Product not found');

  // Send OTP to recipient
  const otp = generateOTP();
  const otpKey = `transfer:${product_id}:${recipient.user_id}`;
  saveOTP(otpKey, otp);
  await sendOTPEmail(recipient.email, otp);

  return {
    recipient_id:    recipient.user_id,
    recipient_name:  recipient.name,
    recipient_email: recipient.email,
    product,
  };
};

// Step 2: verify OTP and complete transfer
const confirmCustomerTransfer = async (product_id, recipient_id, otp, from_user) => {
  const otpKey = `transfer:${product_id}:${recipient_id}`;
  const result = verifyOTP(otpKey, otp);
  if (!result.valid) throw new Error(result.reason);

  // Re-verify ownership
  const ownerCheck = await pool.query(
    `SELECT * FROM ownership
     WHERE product_id = $1 AND to_user_id = $2 AND transfer_status = 'COMPLETED'
     ORDER BY ownership_id DESC LIMIT 1`,
    [product_id, from_user.user_id]
  );
  if (!ownerCheck.rows[0]) throw new Error('You do not own this product');

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  await pool.query(
    `INSERT INTO ownership (product_id, from_user_id, to_user_id, transfer_status, verification_code)
     VALUES ($1, $2, $3, 'COMPLETED', $4)`,
    [product_id, from_user.user_id, recipient_id, code]
  );

  // Get recipient info for response
  const recipientRes = await pool.query(
    `SELECT name, email FROM users WHERE user_id = $1`, [recipient_id]
  );

  await pool.query(
    `INSERT INTO product_event (product_id, user_id, event_type, description)
     VALUES ($1, $2, 'OWNERSHIP_TRANSFERRED', $3)`,
    [product_id, from_user.user_id, `Ownership transferred to user ${recipient_id} via OTP`]
  );

  return { success: true, recipient: recipientRes.rows[0] };
};

// ── Repair: send OTP to current product owner ────────────────────────────────
// Step 1: validate product exists, find current owner, send OTP
const initiateRepair = async (product_id, repairshop_user) => {
  // Validate product exists — fixes FK violation
  const productRes = await pool.query(
    `SELECT * FROM products WHERE product_id = $1`, [product_id]
  );
  const product = productRes.rows[0];
  if (!product) throw new Error('Product not found. Please check the product ID.');

  // Find current owner (latest completed ownership record)
  const ownerRes = await pool.query(
    `SELECT u.user_id, u.name, u.email
     FROM ownership o
     JOIN users u ON o.to_user_id = u.user_id
     WHERE o.product_id = $1 AND o.transfer_status = 'COMPLETED'
     ORDER BY o.ownership_id DESC LIMIT 1`,
    [product_id]
  );

  let owner = ownerRes.rows[0];

  // If no ownership record exists, owner is the manufacturer
  if (!owner) {
    const mfgRes = await pool.query(
      `SELECT u.user_id, u.name, u.email
       FROM products p
       JOIN users u ON p.manufacturer_id = u.user_id
       WHERE p.product_id = $1`,
      [product_id]
    );
    owner = mfgRes.rows[0];
  }

  if (!owner) throw new Error('Could not determine product owner to send OTP');

  // Send OTP to owner
  const otp = generateOTP();
  const otpKey = `repair:${product_id}:${repairshop_user.user_id}`;
  saveOTP(otpKey, otp);
  await sendOTPEmail(owner.email, otp);

  return {
    owner_name:  owner.name,
    owner_email: owner.email,
    product,
  };
};

// Step 2: verify OTP and create repair record
const confirmRepair = async (data, repairshop_user) => {
  const { product_id, otp, issue, repair_type, repair_price, estimated_time } = data;

  const otpKey = `repair:${product_id}:${repairshop_user.user_id}`;
  const result = verifyOTP(otpKey, otp);
  if (!result.valid) throw new Error(result.reason);

  // Re-validate product exists (guards FK constraint)
  const productRes = await pool.query(
    `SELECT * FROM products WHERE product_id = $1`, [product_id]
  );
  if (!productRes.rows[0]) throw new Error('Product not found');

  // Insert repair record
  const repairRes = await pool.query(
    `INSERT INTO repair_record
       (product_id, repairshop_id, issue, repair_type, repair_price, estimated_time, repair_status)
     VALUES ($1, $2, $3, $4, $5, $6, 'IN_PROGRESS')
     RETURNING *`,
    [product_id, repairshop_user.user_id, issue, repair_type, repair_price || null, estimated_time || null]
  );

  // Log event
  await pool.query(
    `INSERT INTO product_event (product_id, user_id, event_type, description)
     VALUES ($1, $2, 'REPAIR_ADDED', $3)`,
    [product_id, repairshop_user.user_id, `Repair added (owner OTP confirmed): ${issue}`]
  );

  return repairRes.rows[0];
};

module.exports = {
  initiateShowroomSale,
  confirmShowroomSale,
  initiateCustomerTransfer,
  confirmCustomerTransfer,
  initiateRepair,
  confirmRepair,
};