const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/anonymous', authController.loginAnonymous);  // ← عدلناه
router.post('/create-superadmin', authController.createSuperAdmin);
 
module.exports = router; 
