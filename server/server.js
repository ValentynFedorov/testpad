const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Valik25122005!',
    database: 'testpad',
});

app.use(
    session({
        key: 'testpad_sid',
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 день
            httpOnly: true,
        },
    })
);


const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api', authRoutes);

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
