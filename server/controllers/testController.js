const Test = require('../models/testModel');
const Question = require('../models/questionModel');

exports.createTest = async (req, res) => {
    try {
        const { title, description, questions, settings } = req.body;
        const creatorId = req.user.id;

        const testId = await Test.create(title, description, creatorId, settings);

        for (const question of questions) {
            await Question.create(testId, question);
        }

        res.status(201).json({ id: testId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        const questions = await Question.findByTestId(req.params.id);
        res.json({ ...test, questions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTestsByTeacher = async (req, res) => {
    try {
        const tests = await Test.findByCreator(req.user.id);
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};