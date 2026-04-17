const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByPhone } = require('./auth.query');

// Business logic for auth
const registerUser = async (data) => {
  const { name, phone, password, role } = data;

  const existing = await findUserByPhone(phone);
  if (existing) throw new Error('Phone already registered');

  const hashed = await bcrypt.hash(password, 10);

  const user = await createUser(name, phone, hashed, role);
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