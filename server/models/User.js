const { query } = require('../utils/db');

class User {
    static async findByEmail(email) {
        const sql = 'SELECT * FROM Users WHERE email = ?';
        const rows = await query(sql, [email]);
        return rows[0];
    }

    static async create({ username, email, password, role }) {
        const sql = 'INSERT INTO Users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
        const result = await query(sql, [username, email, password, role]);
        return result.insertId;
    }

    static async getById(id) {
        const sql = 'SELECT * FROM Users WHERE user_id = ?';
        const rows = await query(sql, [id]);
        return rows[0];
    }

    static async updateLastLogin(id) {
        const sql = 'UPDATE Users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?';
        await query(sql, [id]);
    }
}

module.exports = User;