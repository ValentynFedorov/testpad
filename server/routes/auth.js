const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const JWT_SECRET = 'your_secret_key';

// 🟢 Реєстрація
router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Заповніть всі поля' });
    }

    if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ message: 'Недійсна роль' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            'INSERT INTO Users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, hash, role]
        );

        const token = jwt.sign({ user_id: result.insertId, username, role }, JWT_SECRET);
        res
            .cookie('token', token, { httpOnly: true, sameSite: 'Lax' })
            .json({ username, role });
    } catch (err) {
        res.status(400).json({ message: 'Користувач вже існує', error: err.message });
    }
});

// 🟢 Вхід
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: 'Введіть email і пароль' });

    try {
        const [users] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        const user = users[0];

        if (!user)
            return res.status(401).json({ message: 'Користувача не знайдено' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch)
            return res.status(401).json({ message: 'Неправильний пароль' });

        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, role: user.role },
            JWT_SECRET
        );

        await db.execute('UPDATE Users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

        res
            .cookie('token', token, { httpOnly: true, sameSite: 'Lax' })
            .json({ username: user.username, role: user.role });
    } catch (err) {
        res.status(500).json({ message: 'Серверна помилка', error: err.message });
    }
});

// 🔴 Вихід
router.post('/logout', (req, res) => {
    res.clearCookie('token').json({ message: 'Вихід успішний' });
});

// 🔍 Перевірка поточного користувача
router.get('/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Не авторизовано' });

    try {
        const user = jwt.verify(token, JWT_SECRET);
        res.json(user);
    } catch (err) {
        res.status(403).json({ message: 'Невалідний токен' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('testpad_sid');
        res.json({ message: 'Вийшли з системи' });
    });
});


module.exports = router;
