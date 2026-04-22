const {
  registerUser,
  verifyRegisterOTP,
  loginUser,
  verifyLoginOTP,
} = require('./auth.service');

const register = async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const verifyRegister = async (req, res) => {
  try {
    const result = await verifyRegisterOTP(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const verifyLogin = async (req, res) => {
  try {
    const result = await verifyLoginOTP(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { register, verifyRegister, login, verifyLogin };