const pool = require('../config/db');

class Session {
    static async create(testId, studentId, answers, score) {
        const id = require('crypto').randomUUID();
        const [result] = await pool.query(
            'INSERT INTO test_sessions (id, test_id, student_id, answers, score) VALUES (?, ?, ?, ?, ?)',
            [id, testId, studentId, JSON.stringify(answers), score]
        );
        return id;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM test_sessions WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByTestId(testId) {
        const [rows] = await pool.query('SELECT * FROM test_sessions WHERE test_id = ?', [testId]);
        return rows;
    }
}

module.exports = Session;