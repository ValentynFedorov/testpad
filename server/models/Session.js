const { query } = require('../utils/db');

class Session {
    static async create(sessionToken, userId, studentEmail, expiresAt) {
        const sql = 'INSERT INTO Sessions (session_token, user_id, student_email, expires_at) VALUES (?, ?, ?, ?)';
        const result = await query(sql, [sessionToken, userId, studentEmail, expiresAt]);
        return result.insertId;
    }

    static async findByToken(token) {
        const sql = 'SELECT * FROM Sessions WHERE session_token = ? AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP';
        const rows = await query(sql, [token]);
        return rows[0];
    }

    static async invalidateToken(token) {
        const sql = 'UPDATE Sessions SET is_active = FALSE WHERE session_token = ?';
        await query(sql, [token]);
    }

    static async invalidateAllUserSessions(userId) {
        const sql = 'UPDATE Sessions SET is_active = FALSE WHERE user_id = ?';
        await query(sql, [userId]);
    }
}

module.exports = Session;