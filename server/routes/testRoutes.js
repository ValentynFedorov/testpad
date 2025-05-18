const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, testController.createTest);
router.get('/:id', authMiddleware, testController.getTest);
router.get('/teacher/:teacherId', authMiddleware, testController.getTestsByTeacher);

module.exports = router;