require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit'); 

const app = express();


// ✅ طباعة المتغيرات للتأكد
console.log('🔍 Checking environment variables...');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
console.log('PORT:', process.env.PORT || 3000);

// ✅ التحقق من المتغيرات
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

console.log('✅ All environment variables loaded');

// Security Headers
app.use(helmet()); 

// Rate Limiting - حماية من الهجمات
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    success: false, 
    message: 'تم تجاوز عدد الطلبات المسموح، حاول بعد قليل' 
  }
});

app.use('/api/', limiter);  // ← جديد  

// Middleware - CORS
// ✅ CORS للتطوير المحلي
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ✅ Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('✅ Supabase client initialized');

// Routes
const authRoutes = require('./routes/auth');
const filesRoutes = require('./routes/files');

app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);

// Test Route
app.get('/', (req, res) => {
  res.json({
    message: 'Backend جاهز - تجمع حائل الصحي',
    status: 'running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    supabaseConnected: !!supabase,
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        anonymous: 'POST /api/auth/anonymous'
      },
      files: {
        getAll: 'GET /api/files',
        getByDepartment: 'GET /api/files/department/:department',
        upload: 'POST /api/files (Admin)',
        update: 'PUT /api/files/:id (Admin)',
        delete: 'DELETE /api/files/:id (Admin)'
      }
    }
  });
});

// Test Supabase Connection
app.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .limit(1);

    if (error) throw error;

    res.json({
      success: true,
      message: 'اتصال Supabase شغال',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في الاتصال',
      error: error.message
    });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;

// ✅ Listen على 0.0.0.0 للـ Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});