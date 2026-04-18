const { viewPassport } = require('./passport.service');

const getPassport = async (req, res) => {
  try {
    const result = await viewPassport(
      req.params.product_id,
      req.user
    );
    res.json(result);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

module.exports = { getPassport };