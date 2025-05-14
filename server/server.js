const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Підключення до БД
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Valik25122005!',
    database: 'testpad',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware для перевірки JWT
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Реєстрація
app.post('/api/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [result] = await pool.query(
            'INSERT INTO Users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role]
        );
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Логін
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.user_id, role: user.role }, 'your_secret_key', { expiresIn: '1h' });
        res.json({ token, user: { id: user.user_id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Отримати всі тести (приклад API)
app.get('/api/tests', authenticateJWT, async (req, res) => {
    try {
        const [tests] = await pool.query('SELECT * FROM Tests WHERE creator_id = ? OR is_published = 1', [req.user.userId]);
        res.json(tests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tests' });
    }
});

// Запуск сервера
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});