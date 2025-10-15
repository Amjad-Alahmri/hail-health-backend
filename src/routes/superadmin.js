const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');

// Middleware للتحقق من Super Admin (معطل مؤقتاً)
const verifySuperAdmin = (req, res, next) => {
  // ✅ مؤقتاً - بدون تحقق من الصلاحيات للاختبار
  next();
};

// 1️⃣ جلب قائمة كل الأدمنز
router.get('/admins', verifySuperAdmin, async (req, res) => {
  try {
    console.log('📋 جلب قائمة المسؤولين...');

    const { data: admins, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .in('role', ['admin', 'super_admin', 'user'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ تم جلب ${admins.length} مسؤول`);

    res.json({
      success: true,
      count: admins.length,
      admins
    });
  } catch (error) {
    console.error('❌ خطأ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الأدمنز',
      error: error.message
    });
  }
});

// 2️⃣ إضافة أدمن جديد
router.post('/admins', verifySuperAdmin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const role = 'admin';  // ← ثابت دائماً admin (غيّره إلى 'user' لو تبي)

    console.log('➕ إضافة مسؤول:', email, '- Role:', role);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد وكلمة المرور مطلوبان'
      });
    }

    // التحقق من عدم وجود البريد
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم مسبقاً'
      });
    }

    // تشفير كلمة المرور
    const password_hash = await bcrypt.hash(password, 10);

    // إضافة الأدمن
    const { data: newAdmin, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash,
        role  // ← سيكون دائماً 'admin'
      }])
      .select('id, email, role, created_at')
      .single();

    if (error) throw error;

    console.log('✅ تم إضافة المسؤول:', newAdmin.email, '- Role:', newAdmin.role);

    res.status(201).json({
      success: true,
      message: 'تم إضافة المسؤول بنجاح',
      admin: newAdmin
    });
  } catch (error) {
    console.error('❌ خطأ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة المسؤول',
      error: error.message
    });
  }
});

// 3️⃣ حذف أدمن
router.delete('/admins/:id', verifySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ حذف مسؤول:', id);

    // منع حذف Super Admin
    const { data: targetUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    if (targetUser?.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن حذف Super Admin'
      });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('✅ تم حذف المسؤول');

    res.json({
      success: true,
      message: 'تم حذف المسؤول بنجاح'
    });
  } catch (error) {
    console.error('❌ خطأ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف المسؤول',
      error: error.message
    });
  }
});

module.exports = router;
