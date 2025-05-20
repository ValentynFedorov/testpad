const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Teacher routes
router.use('/teacher', authMiddleware.protect, authMiddleware.restrictTo('teacher'));
router.use('/student', authMiddleware.protect, authMiddleware.restrictTo('student'));
router.get('/teacher/test/:id', sessionController.getSessionsByTest);

// Student routes
router.post('/', sessionController.createSession);
router.get('/student', sessionController.getStudentSessions);
router.get('/:id', sessionController.getSession);

module.exports = router;