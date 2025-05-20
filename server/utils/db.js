const mariadb = require('mariadb');
const config = require('../config/database');

const pool = mariadb.createPool(config);

async function query(sql, params) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(sql, params);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

module.exports = { query };