module.exports = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Valik25122005!',
    database: process.env.DB_NAME || 'testpad',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10,
};