const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// تسجيل مستخدم جديد
router.post('/register', authController.register);

// تسجيل دخول بالبريد وكلمة المرور (Admin)
router.post('/login', authController.login);

// جديد - تسجيل دخول مجهول (User)
router.post('/login/anonymous', authController.loginAnonymous);

module.exports = router;
