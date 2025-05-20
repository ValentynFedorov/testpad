const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');

exports.createTest = async (req, res, next) => {
    try {
        const { title, description, timeLimit, isPublished, questions } = req.body;
        const creatorId = req.user.id;

        // Create test
        const testId = await Test.create({
            title,
            description,
            creatorId,
            timeLimit,
            isPublished
        });

        // Add questions with options
        for (const [index, question] of questions.entries()) {
            await Question.createWithOptions(testId, {
                questionType: question.type,
                questionText: question.text,
                points: question.points || 1,
                questionOrder: index + 1,
                options: question.options || []
            });
        }

        res.status(201).json({
            id: testId,
            title,
            creatorId,
            message: 'Test created successfully'
        });
    } catch (err) {
        next(err);
    }
};

exports.getTest = async (req, res, next) => {
    try {
        const testId = req.params.id;
        const test = await Test.getById(testId);

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Check if user has access to the test
        if (!test.is_published && test.creator_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to access this test' });
        }

        const questions = await Question.getByTestId(testId);
        res.json({ ...test, questions });
    } catch (err) {
        next(err);
    }
};

exports.getUserTests = async (req, res, next) => {
    try {
        let tests;
        if (req.user.role === 'teacher' || req.user.role === 'admin') {
            tests = await Test.getByCreator(req.user.id);
        } else {
            tests = await Test.getAvailableTests(req.user.id);
        }
        res.json(tests);
    } catch (err) {
        next(err);
    }
};

exports.startAttempt = async (req, res, next) => {
    try {
        const testId = req.params.id;
        const userId = req.user.id;

        // Check if test exists and is published
        const test = await Test.getById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        if (!test.is_published && test.creator_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Test is not published' });
        }

        // Create new attempt
        const attemptId = await TestAttempt.create({ testId, userId });

        res.status(201).json({
            attemptId,
            testId,
            startTime: new Date().toISOString(),
            message: 'Test attempt started'
        });
    } catch (err) {
        next(err);
    }
};

exports.submitAttempt = async (req, res, next) => {
    try {
        const attemptId = req.params.attemptId;
        const { answers } = req.body;

        // Get attempt details
        const attempt = await TestAttempt.getById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }
        if (attempt.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to submit this attempt' });
        }
        if (attempt.is_completed) {
            return res.status(400).json({ message: 'Attempt already completed' });
        }

        // Get test questions
        const questions = await Question.getByTestId(attempt.test_id);
        let totalScore = 0;
        const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

        // Process each answer
        for (const answer of answers) {
            const question = questions.find(q => q.question_id === answer.questionId);
            if (!question) continue;

            let isCorrect = false;
            let pointsEarned = 0;

            // Check answer based on question type
            switch (question.question_type) {
                case 'single_choice':
                    const correctOption = question.options.find(opt => opt.is_correct);
                    isCorrect = correctOption && correctOption.option_id === answer.selectedOptionId;
                    break;

                case 'multiple_choice':
                    const correctOptions = question.options.filter(opt => opt.is_correct).map(opt => opt.option_id);
                    isCorrect = correctOptions.length === answer.selectedOptionIds.length &&
                        correctOptions.every(optId => answer.selectedOptionIds.includes(optId));
                    break;

                case 'text_answer':
                    // For text answers, we'd typically need to compare with correct answer(s)
                    // This is a simplified version - you might need more complex comparison logic
                    isCorrect = question.options.some(opt =>
                        opt.option_text.toLowerCase() === answer.answerText.toLowerCase()
                    );
                    break;

                case 'matching':
                    // Matching questions would need more complex validation
                    // This is just a placeholder
                    isCorrect = true; // Simplified for example
                    break;
            }

            if (isCorrect) {
                pointsEarned = question.points;
                totalScore += pointsEarned;
            }

            // Save user answer (implementation would need to be added)
            // await saveUserAnswer(attemptId, question.question_id, answer, pointsEarned);
        }

        // Complete the attempt
        await TestAttempt.completeAttempt(attemptId, totalScore, maxScore);

        res.json({
            attemptId,
            score: totalScore,
            maxScore,
            message: 'Test submitted successfully'
        });
    } catch (err) {
        next(err);
    }
};

// Additional helper methods would be needed for saving answers, etc.