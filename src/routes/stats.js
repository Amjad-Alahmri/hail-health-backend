const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const supabase = require('../config/supabase');

// GET /api/stats - جلب الإحصائيات
router.get('/', async (req, res) => {
  try {
    console.log('📊 جاري جلب الإحصائيات...');
    console.log('👤 المستخدم:', req.user);

    // 1. إجمالي الملفات
    const { count: totalFiles } = await supabase
      .from('uploaded_files')
      .select('*', { count: 'exact', head: true });

    // 2. الملفات هذا الشهر
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count: filesThisMonth } = await supabase
      .from('uploaded_files')
      .select('*', { count: 'exact', head: true })
      .gte('upload_date', firstDayOfMonth.toISOString());

    // 3. الملفات حسب القسم
    const { data: allFiles } = await supabase
      .from('uploaded_files')
      .select('department');

    // حساب عدد الملفات لكل قسم
    const departmentCounts = {};
    allFiles?.forEach(file => {
      departmentCounts[file.department] = 
        (departmentCounts[file.department] || 0) + 1;
    });

    // ترتيب الأقسام حسب عدد الملفات
    const sortedDepartments = Object.entries(departmentCounts)
      .sort((a, b) => b[1] - a[1]);

    // أكثر قسم نشاطاً (الأول)
    const topDepartment = sortedDepartments[0] || null;

    // 4. عدد الأقسام النشطة
    const activeDepartments = Object.keys(departmentCounts).length;

    // 5. آخر رفع (منذ كم يوم)
    const { data: latestFile } = await supabase
      .from('uploaded_files')
      .select('upload_date')
      .order('upload_date', { ascending: false })
      .limit(1)
      .single();

    let daysSinceLastUpload = 0;
    if (latestFile) {
      const lastUploadDate = new Date(latestFile.upload_date);
      const now = new Date();
      const diffTime = Math.abs(now - lastUploadDate);
      daysSinceLastUpload = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    console.log('✅ تم جلب الإحصائيات بنجاح');

    res.json({
      success: true,
      stats: {
        totalFiles: totalFiles || 0,
        filesThisMonth: filesThisMonth || 0,
        topDepartment: topDepartment ? {
          name: topDepartment[0],
          count: topDepartment[1]
        } : null,
        activeDepartments: activeDepartments,
        daysSinceLastUpload: daysSinceLastUpload
      }
    });

  } catch (error) {
    console.error('❌ خطأ في stats:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات',
      error: error.message
    });
  }
});

module.exports = router;