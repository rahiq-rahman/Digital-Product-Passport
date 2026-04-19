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
    const result = await loginUser(req.body);

    res.json({
      token: result.token,
      user: {
        user_id: result.user.user_id,
        name: result.user.name,
        role: result.user.role_type,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { register, login };