const app = require('./app');
const http = require('http');
const config = require('./config/database');
const {query} = require("./utils/db");

const port = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize database tables if they don't exist
const initializeDatabase = async () => {
    const { query } = require('./utils/db');

    try {
        // Create tables if they don't exist (using your provided schema)
        await query(`
            CREATE TABLE IF NOT EXISTS Users (
                                                 user_id INT PRIMARY KEY AUTO_INCREMENT,
                                                 username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'teacher', 'student') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL
                )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS Tests (
                                                 test_id INT PRIMARY KEY AUTO_INCREMENT,
                                                 title VARCHAR(255) NOT NULL,
                description TEXT,
                creator_id INT NOT NULL,
                time_limit INT NULL COMMENT 'Час на проходження у хвилинах',
                is_published BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES Users(user_id)
                )
        `);

        await query(`
        CREATE TABLE IF NOT EXISTS Questions (
            question_id INT PRIMARY KEY AUTO_INCREMENT,
            test_id INT NOT NULL,
            question_type ENUM('single_choice', 'multiple_choice', 'text_answer', 'matching') NOT NULL,
            question_text TEXT NOT NULL,
            points INT DEFAULT 1,
            question_order INT NOT NULL,
            FOREIGN KEY (test_id) REFERENCES Tests(test_id) ON DELETE CASCADE
    )
            `);
        await query(`
                CREATE TABLE IF NOT EXISTS AnswerOptions (
                    option_id INT PRIMARY KEY AUTO_INCREMENT,
                    question_id INT NOT NULL,
                    option_text TEXT NOT NULL,
                    is_correct BOOLEAN DEFAULT FALSE,
                    option_order INT NOT NULL,
                    FOREIGN KEY (question_id) REFERENCES Questions(question_id) ON DELETE CASCADE
            `);
        await query(`
                CREATE TABLE IF NOT EXISTS TestAttempts (
                    attempt_id INT PRIMARY KEY AUTO_INCREMENT,
                    test_id INT NOT NULL,
                    user_id INT NOT NULL,
                    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    end_time TIMESTAMP NULL,
                    score INT NULL,
                    max_score INT NULL,
                    is_completed BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (test_id) REFERENCES Tests(test_id),
                    FOREIGN KEY (user_id) REFERENCES Users(user_id)
            `);

        await query(`
                CREATE TABLE IF NOT EXISTS UserAnswers (
                    answer_id INT PRIMARY KEY AUTO_INCREMENT,
                    attempt_id INT NOT NULL,
                    question_id INT NOT NULL,
                    answer_text TEXT NULL COMMENT 'Для текстових відповідей',
                    points_earned INT NULL,
                    FOREIGN KEY (attempt_id) REFERENCES TestAttempts(attempt_id) ON DELETE CASCADE,
                    FOREIGN KEY (question_id) REFERENCES Questions(question_id)
            `);


        await query(`
                CREATE TABLE IF NOT EXISTS SelectedOptions (
                    selection_id INT PRIMARY KEY AUTO_INCREMENT,
                    answer_id INT NOT NULL,
                    option_id INT NOT NULL,
                    FOREIGN KEY (answer_id) REFERENCES UserAnswers(answer_id) ON DELETE CASCADE,
                    FOREIGN KEY (option_id) REFERENCES AnswerOptions(option_id)
            `);

        await query(`
                CREATE TABLE IF NOT EXISTS Groups (
                    group_id INT PRIMARY KEY AUTO_INCREMENT,
                    group_name VARCHAR(100) NOT NULL,
                    created_by INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES Users(user_id)users
            `);


        await query(`
                CREATE TABLE IF NOT EXISTS GroupMembers (
                    membership_id INT PRIMARY KEY AUTO_INCREMENT,
                    group_id INT NOT NULL,
                    user_id INT NOT NULL,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (group_id) REFERENCES Groups(group_id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
                    UNIQUE (group_id, user_id)
            `);

        await query(`
                CREATE TABLE IF NOT EXISTS TestAccess (
                    access_id INT PRIMARY KEY AUTO_INCREMENT,
                    test_id INT NOT NULL,
                    group_id INT NULL COMMENT 'NULL означає публічний доступ',
                    access_code VARCHAR(20) NULL COMMENT 'Код для доступу',
                    FOREIGN KEY (test_id) REFERENCES Tests(test_id) ON DELETE CASCADE,
                    FOREIGN KEY (group_id) REFERENCES Groups(group_id) ON DELETE CASCADE
            `);
        await query(`
                CREATE TABLE IF NOT EXISTS Sessions (
                    session_id INT PRIMARY KEY AUTO_INCREMENT,
                    session_token VARCHAR(255) NOT NULL UNIQUE,
                    user_id INT NOT NULL,
                    student_email VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
                    FOREIGN KEY (student_email) REFERENCES Users(email) ON DELETE CASCADE
            
            `)

                console.log('Database tables initialized');
            } catch (err) {
                console.error('Error initializing database:', err);
                process.exit(1);
            }
        };

        initializeDatabase().then(() => {
            server.listen(port, () => {
                console.log(`Server running on port ${port}`);
    });
});