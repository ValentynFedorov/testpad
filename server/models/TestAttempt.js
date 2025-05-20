const { query } = require('../utils/db');

class TestAttempt {
    static async create({ testId, userId }) {
        const sql = 'INSERT INTO TestAttempts (test_id, user_id) VALUES (?, ?)';
        const result = await query(sql, [testId, userId]);
        return result.insertId;
    }

    static async completeAttempt(attemptId, score, maxScore) {
        const sql = 'UPDATE TestAttempts SET end_time = CURRENT_TIMESTAMP, score = ?, max_score = ?, is_completed = TRUE WHERE attempt_id = ?';
        await query(sql, [score, maxScore, attemptId]);
    }

    static async getById(attemptId) {
        const sql = 'SELECT * FROM TestAttempts WHERE attempt_id = ?';
        const rows = await query(sql, [attemptId]);
        return rows[0];
    }

    static async getByUserAndTest(userId, testId) {
        const sql = 'SELECT * FROM TestAttempts WHERE user_id = ? AND test_id = ? ORDER BY start_time DESC';
        const rows = await query(sql, [userId, testId]);
        return rows;
    }

    static async getUserAnswers(attemptId) {
        const sql = `
      SELECT ua.*, q.question_text, q.question_type, q.points as max_points
      FROM UserAnswers ua
      JOIN Questions q ON ua.question_id = q.question_id
      WHERE ua.attempt_id = ?
    `;
        const answers = await query(sql, [attemptId]);

        const answersWithSelections = await Promise.all(
            answers.map(async answer => {
                if (answer.question_type === 'single_choice' || answer.question_type === 'multiple_choice') {
                    const selections = await this.getSelectedOptions(answer.answer_id);
                    return { ...answer, selections };
                }
                return answer;
            })
        );

        return answersWithSelections;
    }

    static async getSelectedOptions(answerId) {
        const sql = `
      SELECT ao.* 
      FROM SelectedOptions so
      JOIN AnswerOptions ao ON so.option_id = ao.option_id
      WHERE so.answer_id = ?
    `;
        const rows = await query(sql, [answerId]);
        return rows;
    }
}

module.exports = TestAttempt;