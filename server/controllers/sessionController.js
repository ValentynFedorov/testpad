const Session = require('../models/Session');
const Test = require('../models/Test');

exports.createSession = async (req, res, next) => {
    try {
        const { testId, answers } = req.body;
        const student = req.user.email;

        // Get test to calculate score
        const test = await Test.getById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        const questions = await Question.getByTestId(testId);

        // Calculate score
        let score = 0;
        answers.forEach((userAnswer, idx) => {
            const q = questions[idx];
            let isCorrect = false;

            if (q.type === 'single') {
                isCorrect = String(q.answer[0]) === String(userAnswer);
            } else if (q.type === 'multiple') {
                const correct = [...(q.answer || [])].sort().toString();
                const userStr = [...(userAnswer || [])].sort().toString();
                isCorrect = correct === userStr;
            } else if (q.type === 'match') {
                const correct = q.matches.map(pair => pair.right);
                const userArr = userAnswer || [];
                isCorrect = correct.length === userArr.length &&
                    correct.every((a, i) => String(a) === String(userArr[i]));
            } else if (q.type === 'text') {
                isCorrect = (q.answer[0] || '').trim().toLowerCase() ===
                    (userAnswer || '').trim().toLowerCase();
            }

            if (isCorrect) score += q.points || 1;
        });

        // Create session
        const sessionId = await Session.create({ testId, student, answers, score });

        res.status(201).json({ id: sessionId, score, total: questions.length });
    } catch (err) {
        next(err);
    }
};

exports.getSessionsByTest = async (req, res, next) => {
    try {
        const test = await Test.getById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        if (test.creator !== req.user.email && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const sessions = await Session.getByTestId(req.params.id);
        res.json(sessions);
    } catch (err) {
        next(err);
    }
};

exports.getSession = async (req, res, next) => {
    try {
        const session = await Session.getById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.student !== req.user.email && req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const test = await Test.getById(session.testId);
        const questions = await Question.getByTestId(session.testId);

        res.json({ session, test, questions });
    } catch (err) {
        next(err);
    }
};

exports.getStudentSessions = async (req, res, next) => {
    try {
        const sessions = await Session.getByStudent(req.user.email);
        const sessionsWithTests = await Promise.all(
            sessions.map(async session => {
                const test = await Test.getById(session.testId);
                return { ...session, testTitle: test.title };
            })
        );
        res.json(sessionsWithTests);
    } catch (err) {
        next(err);
    }
};