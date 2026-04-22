const router = require('express').Router();
const { register, verifyRegister, login, verifyLogin } = require('./auth.controller');

router.post('/register',        register);
router.post('/register/verify', verifyRegister);
router.post('/login',           login);
router.post('/login/verify',    verifyLogin);

module.exports = router;