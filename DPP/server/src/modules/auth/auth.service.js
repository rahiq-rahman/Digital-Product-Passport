const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserByPhone } = require('./auth.query');
const { generateOTP, saveOTP, verifyOTP } = require('../../config/otpStore');
const { sendOTPEmail } = require('../../config/mailer');
const pool = require('../../config/db');

// true in production, false in dev (set REQUIRE_OTP=false in .env)
const OTP_REQUIRED = process.env.REQUIRE_OTP === 'true';

const signToken = (user) =>
  jwt.sign(
    { user_id: user.user_id, role: user.role_type },
    process.env.JWT_SECRET
  );

const userPayload = (user, token) => ({
  token,
  user: {
    user_id: user.user_id,
    name:    user.name,
    role:    user.role_type,
  },
});

// ── Register (step 1) ──────────────────────────────────────────────
const registerUser = async (data) => {
  const { name, phone, email, password, role } = data;

  if (!email) throw new Error('Email is required');
  if (!name || !password || !role) throw new Error('All fields are required');

  const existingEmail = await findUserByEmail(email);
  if (existingEmail) throw new Error('Email already registered');

  if (phone) {
    const existingPhone = await findUserByPhone(phone);
    if (existingPhone) throw new Error('Phone already registered');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await createUser(name, phone || null, email.toLowerCase(), hashed, role);

  // Insert into role subtype table
  const subtypes = {
    MANUFACTURER: () => pool.query(
      `INSERT INTO manufacturer (user_id, company_name, factory_name, license_no) VALUES ($1,$2,$3,$4)`,
      [user.user_id, 'Default Company', 'Default Factory', 'LIC123']
    ),
    SHOWROOM: () => pool.query(
      `INSERT INTO showroom (user_id, showroom_name, location, trade_license) VALUES ($1,$2,$3,$4)`,
      [user.user_id, 'Default Showroom', 'Dhaka', 'TL123']
    ),
    REPAIR: () => pool.query(
      `INSERT INTO repairshop (user_id, shop_name, location, certificate_no) VALUES ($1,$2,$3,$4)`,
      [user.user_id, 'Default Repair', 'Dhaka', 'CERT123']
    ),
    CUSTOMER: () => pool.query(
      `INSERT INTO customer (user_id, nid, address) VALUES ($1,$2,$3)`,
      [user.user_id, 'NID123', 'Dhaka']
    ),
  };
  if (subtypes[role]) await subtypes[role]();

  if (OTP_REQUIRED) {
    const otp = generateOTP();
    saveOTP(email.toLowerCase(), otp);
    await sendOTPEmail(email, otp);
    return { requireOTP: true, email: email.toLowerCase(), message: 'OTP sent to your email' };
  }

  // Dev mode — register and log in immediately
  const token = signToken(user);
  return { requireOTP: false, ...userPayload(user, token) };
};

// ── Verify register OTP ────────────────────────────────────────────
const verifyRegisterOTP = async ({ email, otp }) => {
  const result = verifyOTP(email.toLowerCase(), otp);
  if (!result.valid) throw new Error(result.reason);

  const user = await findUserByEmail(email);
  if (!user) throw new Error('User not found');

  return userPayload(user, signToken(user));
};

// ── Login (step 1) ─────────────────────────────────────────────────
const loginUser = async ({ email, password }) => {
  if (!email || !password) throw new Error('Email and password are required');

  const user = await findUserByEmail(email);
  if (!user) throw new Error('No account found with this email');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Incorrect password');

  if (OTP_REQUIRED) {
    const otp = generateOTP();
    saveOTP(email.toLowerCase(), otp);
    await sendOTPEmail(email, otp);
    return { requireOTP: true, email: email.toLowerCase(), message: 'OTP sent to your email' };
  }

  // Dev mode — skip OTP, return token immediately
  return { requireOTP: false, ...userPayload(user, signToken(user)) };
};

// ── Verify login OTP ───────────────────────────────────────────────
const verifyLoginOTP = async ({ email, otp }) => {
  const result = verifyOTP(email.toLowerCase(), otp);
  if (!result.valid) throw new Error(result.reason);

  const user = await findUserByEmail(email);
  if (!user) throw new Error('User not found');

  return userPayload(user, signToken(user));
};

module.exports = { registerUser, verifyRegisterOTP, loginUser, verifyLoginOTP };