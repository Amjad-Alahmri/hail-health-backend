require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware - CORS مع خيارات كاملة
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register'
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
}); 