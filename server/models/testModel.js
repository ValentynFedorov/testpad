const pool = require('../config/db');

class Test {
    static async create(title, description, creatorId, settings) {
        const id = require('crypto').randomUUID();
        const [result] = await pool.query(
            'INSERT INTO tests (id, title, description, creator_id, settings) VALUES (?, ?, ?, ?, ?)',
            [id, title, description, creatorId, JSON.stringify(settings)]
        );
        return id;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM tests WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByCreator(creatorId) {
        const [rows] = await pool.query('SELECT * FROM tests WHERE creator_id = ?', [creatorId]);
        return rows;
    }

    static async update(id, title, questions) {
        // Реалізація оновлення тесту
    }

    static async delete(id) {
        // Реалізація видалення тесту
    }
}

module.exports = Test;