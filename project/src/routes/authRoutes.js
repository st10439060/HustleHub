const express = require('express');
const router = express.Router();

const { register, login, me, health } = require('../controllers/authController');
const { registerRules, loginRules, validate } = require('../middleware/validators');
const { authenticate } = require('../middleware/auth');

router.get('/health', health);
router.post('/register', registerRules(), validate, register);
router.post('/login', loginRules(), validate, login);
router.get('/me', authenticate, me);

module.exports = router;
