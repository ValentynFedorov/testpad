const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Teacher routes
router.use('/teacher', authMiddleware.protect, authMiddleware.teacherOnly);
router.get('/teacher/test/:id', sessionController.getSessionsByTest);

// Student routes
router.use(authMiddleware.protect, authMiddleware.studentOnly);
router.post('/', sessionController.createSession);
router.get('/student', sessionController.getStudentSessions);
router.get('/:id', sessionController.getSession);

module.exports = router;