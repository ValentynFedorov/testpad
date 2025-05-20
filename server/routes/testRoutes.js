const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protected routes
router.use(authMiddleware.protect);

// Teacher/admin only routes
router.post('/',
    authMiddleware.restrictTo('teacher', 'admin'),
    testController.createTest
);

router.get('/my-tests',
    authMiddleware.restrictTo('teacher', 'admin'),
    testController.getUserTests
);

// Student routes
router.get('/available',
    authMiddleware.restrictTo('student'),
    testController.getAvailableTests
);

// General routes
router.get('/:id', testController.getTest);
router.post('/:id/attempt', testController.startAttempt);
router.post('/attempt/:attemptId/submit', testController.submitAttempt);

module.exports = router;