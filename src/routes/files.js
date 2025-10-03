const express = require('express');
const router = express.Router();
const filesController = require('../controllers/filesController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', filesController.getAllFiles);
router.get('/department/:department', filesController.getFilesByDepartment);
router.post('/', authenticateToken, isAdmin, filesController.uploadFile);
router.put('/:id', authenticateToken, isAdmin, filesController.updateFile);
router.delete('/:id', authenticateToken, isAdmin, filesController.deleteFile);

module.exports = router; 