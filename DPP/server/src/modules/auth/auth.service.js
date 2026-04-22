const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByPhone, findUserByEmail } = require('./auth.query');
const { generateOTP, saveOTP, verifyOTP } = require('../../config/otpStore');
const { sendOTPEmail } = require('../../config/mailer');
const pool = require('../../config/db');

// ── Register (step 1) ──────────────────────────────────────────────
// Creates the user, sends OTP — user is not active until OTP verified
const registerUser = async (data) => {
  const { name, phone, email, password, role } = data;

  if (!email) throw new Error('Email is required');

  const existingPhone = await findUserByPhone(phone);
  if (existingPhone) throw new Error('Phone already registered');

  const existingEmail = await findUserByEmail(email);
  if (existingEmail) throw new Error('Email already registered');

  const hashed = await bcrypt.hash(password, 10);
  const user = await createUser(name, phone, email, hashed, role);

  // Insert into role subtype table
  if (role === 'MANUFACTURER') {
    await pool.query(
      `INSERT INTO manufacturer (user_id, company_name, factory_name, license_no)
       VALUES ($1, $2, $3, $4)`,
      [user.user_id, 'Default Company', 'Default Factory', 'LIC123']
    );
  }
  if (role === 'SHOWROOM') {
    await pool.query(
      `INSERT INTO showroom (user_id, showroom_name, location, trade_license)
       VALUES ($1, $2, $3, $4)`,
      [user.user_id, 'Default Showroom', 'Dhaka', 'TL123']
    );
  }
  if (role === 'REPAIR') {
    await pool.query(
      `INSERT INTO repairshop (user_id, shop_name, location, certificate_no)
       VALUES ($1, $2, $3, $4)`,
      [user.user_id, 'Default Repair', 'Dhaka', 'CERT123']
    );
  }
  if (role === 'CUSTOMER') {
    await pool.query(
      `INSERT INTO customer (user_id, nid, address)
       VALUES ($1, $2, $3)`,
      [user.user_id, 'NID123', 'Dhaka']
    );
  }

  // Generate and send OTP
  const otp = generateOTP();
  saveOTP(email, otp);
  await sendOTPEmail(email, otp);

  return { message: 'OTP sent to your email', email };
};

// ── Verify register OTP ────────────────────────────────────────────
const verifyRegisterOTP = async ({ email, otp }) => {
  const result = verifyOTP(email, otp);
  if (!result.valid) throw new Error(result.reason);

  const user = await findUserByEmail(email);
  if (!user) throw new Error('User not found');

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role_type },
    process.env.JWT_SECRET
  );

  return { user, token };
};

// ── Login (step 1) ─────────────────────────────────────────────────
// Validates credentials, sends OTP
const loginUser = async ({ phone, password }) => {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE phone = $1',
    [phone]
  );
  if (rows.length === 0) throw new Error('User not found');

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid password');

  if (!user.email) throw new Error('No email on file — contact support');

  // Send OTP to registered email
  const otp = generateOTP();
  saveOTP(user.email, otp);
  await sendOTPEmail(user.email, otp);

  return { message: 'OTP sent to your registered email', email: user.email };
};

// ── Verify login OTP ───────────────────────────────────────────────
const verifyLoginOTP = async ({ email, otp }) => {
  const result = verifyOTP(email, otp);
  if (!result.valid) throw new Error(result.reason);

  const user = await findUserByEmail(email);
  if (!user) throw new Error('User not found');

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role_type },
    process.env.JWT_SECRET
  );

  return { user, token };
};

module.exports = { registerUser, verifyRegisterOTP, loginUser, verifyLoginOTP };