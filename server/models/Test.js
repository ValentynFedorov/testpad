const { query } = require('../utils/db');

class Test {
    static async create({ title, description, creatorId, timeLimit, isPublished }) {
        const sql = 'INSERT INTO Tests (title, description, creator_id, time_limit, is_published) VALUES (?, ?, ?, ?, ?)';
        const result = await query(sql, [title, description, creatorId, timeLimit, isPublished]);
        return result.insertId;
    }

    static async getById(id) {
        const sql = `
            SELECT t.*, u.username as creator_name
            FROM Tests t
                     JOIN Users u ON t.creator_id = u.user_id
            WHERE t.test_id = ?
        `;
        const rows = await query(sql, [id]);
        return rows[0];
    }

    static async getByCreator(creatorId) {
        const sql = 'SELECT * FROM Tests WHERE creator_id = ?';
        const rows = await query(sql, [creatorId]);
        return rows;
    }

    static async update(id, { title, description, timeLimit, isPublished }) {
        const sql = 'UPDATE Tests SET title = ?, description = ?, time_limit = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE test_id = ?';
        await query(sql, [title, description, timeLimit, isPublished, id]);
    }

    static async delete(id) {
        const sql = 'DELETE FROM Tests WHERE test_id = ?';
        await query(sql, [id]);
    }

    static async getAvailableTests(userId) {
        const sql = `
      SELECT t.*, u.username as creator_name 
      FROM Tests t
      JOIN Users u ON t.creator_id = u.user_id
      WHERE t.is_published = TRUE
      OR t.creator_id = ?
    `;
        const rows = await query(sql, [userId]);
        return rows;
    }
}

module.exports = Test;