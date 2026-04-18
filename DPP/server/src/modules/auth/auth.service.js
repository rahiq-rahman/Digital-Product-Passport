const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByPhone } = require('./auth.query');
const pool = require('../../config/db');

// Business logic for auth

const registerUser = async (data) => {
  const { name, phone, password, role } = data;

  const existing = await findUserByPhone(phone);
  if (existing) throw new Error('Phone already registered');

  const hashed = await bcrypt.hash(password, 10);

  const user = await createUser(name, phone, hashed, role);

  // Insert into subtype table based on role
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

  return user;
};

// Login logic
const loginUser = async (phone, password) => {
  const user = await findUserByPhone(phone);
  if (!user) throw new Error('User not found');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Wrong password');

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role_type },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { token };
};

module.exports = { registerUser, loginUser };