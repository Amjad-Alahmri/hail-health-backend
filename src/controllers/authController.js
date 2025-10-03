const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// تسجيل مستخدم جديد
exports.register = async (req, res) => {
  try {
    const { email, password, role = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'البريد وكلمة المرور مطلوبة' 
      });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'البريد الإلكتروني مستخدم مسبقاً' 
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password_hash: passwordHash, role }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'تم التسجيل بنجاح',
      user: { id: data.id, email: data.email, role: data.role }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في التسجيل',
      error: error.message 
    });
  }
};

// تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'البريد وكلمة المرور مطلوبة' 
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'البريد أو كلمة المرور غير صحيحة' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'البريد أو كلمة المرور غير صحيحة' 
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في تسجيل الدخول',
      error: error.message 
    });
  }
};
