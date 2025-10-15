const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Routes الموجودة
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/anonymous', authController.loginAnonymous);
router.post('/create-superadmin', authController.createSuperAdmin);

// ✅ جديد - GET /api/auth/me - جلب بيانات المستخدم الحالي
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔐 /auth/me - Token:', token ? 'موجود' : 'غير موجود');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح - Token مطلوب'
      });
    }

    // التحقق من Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('👤 Decoded Token:', decoded);

    // جلب بيانات المستخدم من Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.id)
      .single();

    console.log('📊 User from DB:', user);

    if (error || !user) {
      console.log('❌ خطأ في جلب User:', error);
      return res.status(404).json({
        success: false,
        message: 'مستخدم غير موجود'
      });
    }

    console.log('✅ تم جلب بيانات المستخدم - Role:', user.role);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ خطأ في /auth/me:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Token غير صالح'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Token منتهي'
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message
    });
  }
});

module.exports = router;