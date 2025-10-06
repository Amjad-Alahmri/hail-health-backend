const express = require('express');
const router = express.Router();
const filesController = require('../controllers/filesController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// جلب جميع الملفات (متاح للجميع)
router.get('/', filesController.getAllFiles);

// جلب ملفات حسب القسم (متاح للجميع)
router.get('/department/:department', filesController.getFilesByDepartment);

// ✅ جديد - جلب الأنشطة الحديثة (متاح للجميع)
router.get('/activities', filesController.getRecentActivities);

// رفع ملف (Admin فقط)
router.post('/', authenticateToken, isAdmin, filesController.uploadFile);

// تحديث ملف (Admin فقط)
router.put('/:id', authenticateToken, isAdmin, filesController.updateFile);

// حذف ملف (Admin فقط)
router.delete('/:id', authenticateToken, isAdmin, filesController.deleteFile);

module.exports = router;