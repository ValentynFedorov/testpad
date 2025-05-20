const { query } = require('../utils/db');

class Question {
    static async create(testId, { questionType, questionText, points, questionOrder }) {
        const sql = 'INSERT INTO Questions (test_id, question_type, question_text, points, question_order) VALUES (?, ?, ?, ?, ?)';
        const result = await query(sql, [testId, questionType, questionText, points, questionOrder]);
        return result.insertId;
    }

    static async createWithOptions(testId, questionData) {
        const questionId = await this.create(testId, questionData);

        if (questionData.options && questionData.options.length > 0) {
            for (const option of questionData.options) {
                await this.createOption(questionId, option);
            }
        }

        return questionId;
    }

    static async createOption(questionId, { optionText, isCorrect, optionOrder }) {
        const sql = 'INSERT INTO AnswerOptions (question_id, option_text, is_correct, option_order) VALUES (?, ?, ?, ?)';
        const result = await query(sql, [questionId, optionText, isCorrect, optionOrder]);
        return result.insertId;
    }

    static async getByTestId(testId) {
        const questionsSql = 'SELECT * FROM Questions WHERE test_id = ? ORDER BY question_order';
        const questions = await query(questionsSql, [testId]);

        const questionsWithOptions = await Promise.all(
            questions.map(async question => {
                const options = await this.getOptionsByQuestionId(question.question_id);
                return { ...question, options };
            })
        );

        return questionsWithOptions;
    }

    static async getOptionsByQuestionId(questionId) {
        const sql = 'SELECT * FROM AnswerOptions WHERE question_id = ? ORDER BY option_order';
        const rows = await query(sql, [questionId]);
        return rows;
    }
}

module.exports = Question;