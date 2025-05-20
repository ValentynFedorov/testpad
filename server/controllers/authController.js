const User = require('../models/User');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.user_id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.getById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

exports.register = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate role
        if (!['admin', 'teacher', 'student'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userId = await User.create({ username, email, password: hashedPassword, role });

        // Generate token
        const user = await User.getById(userId);
        const token = generateToken(user);

        // Create session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration
        await Session.create(token, user.user_id, user.email, expiresAt);

        // Update last login
        await User.updateLastLogin(user.user_id);

        res.status(201).json({
            id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
            token,
        });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user);

        // Create session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration
        await Session.create(token, user.user_id, user.email, expiresAt);

        // Invalidate all other active sessions if needed
        // await Session.invalidateAllUserSessions(user.user_id);

        // Update last login
        await User.updateLastLogin(user.user_id);

        res.json({
            id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
            token,
        });
    } catch (err) {
        next(err);
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
    });
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.getById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove sensitive data
        const { password_hash, ...userData } = user;
        res.json(userData);
    } catch (err) {
        next(err);
    }
};