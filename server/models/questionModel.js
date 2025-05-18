const pool = require('../config/db');

class Question {
    static async create(testId, questionData) {
        const [result] = await pool.query(
            'INSERT INTO questions (test_id, question_text, question_type, options, answer, topic, points, time_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                testId,
                questionData.q,
                questionData.type,
                JSON.stringify(questionData.options),
                JSON.stringify(questionData.answer),
                questionData.topic,
                questionData.points,
                questionData.timeLimit
            ]
        );
        return result.insertId;
    }

    static async findByTestId(testId) {
        const [rows] = await pool.query('SELECT * FROM questions WHERE test_id = ?', [testId]);
        return rows;
    }
}

module.exports = Question;