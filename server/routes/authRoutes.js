const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.protect, authController.logout);
router.get('/me', authController.protect, authController.getMe);

module.exports = router;