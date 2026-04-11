const router = require('express').Router();

router.get('/', (req, res) => {
  res.send('DPP API Running');
});

module.exports = router;