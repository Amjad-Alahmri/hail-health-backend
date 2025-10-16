const express = require('express');
const router = express.Router();
const filesController = require('../controllers/filesController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// جلب جميع الملفات
router.get('/', filesController.getAllFiles);

// جلب ملفات حسب القسم
router.get('/department/:department', filesController.getFilesByDepartment);

// جلب الأنشطة
router.get('/activities', filesController.getRecentActivities);

// رفع ملف (Admin فقط)
router.post('/', authenticateToken, isAdmin, filesController.uploadFile);

// تحديث ملف
router.put('/:id', authenticateToken, isAdmin, filesController.updateFile);

// حذف ملف
router.delete('/:id', authenticateToken, isAdmin, filesController.deleteFile);

module.exports = router;