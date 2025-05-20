const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/sessions', sessionRoutes);

// Error handling
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

module.exports = app;