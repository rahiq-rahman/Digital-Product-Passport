const { registerUser, loginUser } = require('./auth.service');

// Controller for auth routes
const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Controller for login route
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const result = await loginUser(phone, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { register, login };