const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// ✅ Middleware للتحقق من Super Admin
const verifySuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح - Token مطلوب'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.id)
      .single();

    if (error || !user || user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح - صلاحيات Super Admin مطلوبة'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token غير صالح'
    });
  }
};

// جلب الأدمنز
router.get('/admins', verifySuperAdmin, async (req, res) => {
  try {
    const { data: admins, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, count: admins.length, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب الأدمنز' });
  }
});

// إضافة أدمن
router.post('/admins', verifySuperAdmin, async (req, res) => {
  try {
    const { email, password, role = 'admin' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'البريد وكلمة المرور مطلوبان' });
    }

    if (role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'لا يمكن إنشاء Super Admin آخر' });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: 'البريد مستخدم مسبقاً' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: newAdmin, error } = await supabase
      .from('users')
      .insert([{ email, password_hash, role }])
      .select('id, email, role, created_at')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, message: 'تم إضافة المسؤول', admin: newAdmin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في إضافة المسؤول' });
  }
});

// حذف أدمن
router.delete('/admins/:id', verifySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === parseInt(id)) {
      return res.status(403).json({ success: false, message: 'لا يمكنك حذف حسابك' });
    }

    const { data: targetUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    if (targetUser?.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'لا يمكن حذف Super Admin' });
    }

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'تم حذف المسؤول' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في حذف المسؤول' });
  }
});

module.exports = router;