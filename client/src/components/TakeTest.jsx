import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTestById, saveSession, getTestProgress, saveTestProgress } from '../utils/storage';

export default function TakeTest() {
    const { testId } = useParams();
    const test = getTestById(testId);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [answers, setAnswers] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const question = test?.questions[currentIndex];

    // Authentication check
    useEffect(() => {
        if (!user || user.role !== 'student') {
            if (user) logout();
            localStorage.setItem('redirectAfterLogin', `/test/${testId}`);
            navigate('/login');
        }
    }, [user, testId, logout, navigate]);

    // Load saved progress from local storage when component mounts
    useEffect(() => {
        if (!test || !user || initialized) return;

        const savedProgress = getTestProgress(testId, user.email);
        if (savedProgress) {
            setAnswers(savedProgress.answers || []);
            setCurrentIndex(savedProgress.currentIndex || 0);
            setTimeLeft(savedProgress.timeLeft || (question?.timeLimit || 30));
            setScore(savedProgress.score || 0);
        } else {
            // Initialize with default values if no saved progress
            setTimeLeft(test.questions[0]?.timeLimit || 30);
        }

        setInitialized(true);
    }, [test, user, testId, initialized]);

    // Timer effect - only starts after initialization
    useEffect(() => {
        if (!question || !initialized) return;

        // Only set the initial time if not already set from saved progress
        if (timeLeft === 0) {
            setTimeLeft(question.timeLimit || 30);
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = prev <= 1 ? 0 : prev - 1;

                // Save progress on each timer tick
                if (user && test) {
                    saveTestProgress(testId, user.email, {
                        answers,
                        currentIndex,
                        timeLeft: newTime,
                        score
                    });
                }

                if (newTime === 0) {
                    clearInterval(timer);
                    handleNext(); // Auto-proceed to next question
                }

                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentIndex, initialized]);

    const handleAnswer = (value) => {
        const updated = [...answers];
        updated[currentIndex] = value;
        setAnswers(updated);

        // Save progress when answer changes
        if (user && test) {
            saveTestProgress(testId, user.email, {
                answers: updated,
                currentIndex,
                timeLeft,
                score
            });
        }
    };

    const evaluateAnswer = () => {
        const q = question;
        const userAns = answers[currentIndex];
        let isCorrect = false;

        if (q.type === 'single') {
            isCorrect = parseInt(q.answer[0], 10) === parseInt(userAns, 10);
        } else if (q.type === 'multiple') {
            const correct = (q.answer || []).sort().join(',');
            const userStr = (userAns || []).sort().join(',');
            isCorrect = correct === userStr && userStr.length > 0;
        } else if (q.type === 'match') {
            const correct = q.matches.map(pair => pair.right.trim().toLowerCase());
            const userArr = (userAns || []).map(a => (a || '').trim().toLowerCase());
            isCorrect = correct.length === userArr.length && correct.every((a, i) => a === userArr[i]);
        } else if (q.type === 'text') {
            isCorrect = (q.answer[0] || '').trim().toLowerCase() === (userAns || '').trim().toLowerCase();
        }

        if (isCorrect) setScore(prev => prev + (q.points || 1));
    };

    const handleNext = () => {
        evaluateAnswer();
        if (currentIndex + 1 < test.questions.length) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);

            // Set time for next question
            setTimeLeft(test.questions[nextIndex].timeLimit || 30);

            // Save progress
            if (user) {
                saveTestProgress(testId, user.email, {
                    answers,
                    currentIndex: nextIndex,
                    timeLeft: test.questions[nextIndex].timeLimit || 30,
                    score
                });
            }
        } else {
            const sessionId = Math.random().toString(36).slice(2, 10);
            saveSession({ id: sessionId, testId, student: user.email, answers, score });

            // Clear progress after submission
            if (user) {
                localStorage.removeItem(`test_progress_${testId}_${user.email}`);
            }

            setSubmitted(true);
            setTimeout(() => navigate(`/result/${sessionId}`), 1000);
        }
    };

    // Handle checkbox changes for multiple choice questions
    const handleCheckboxChange = (idx) => {
        const currentAnswer = answers[currentIndex] || [];
        const updated = [...currentAnswer];

        // Toggle selected option
        const existingIndex = updated.indexOf(idx);
        if (existingIndex === -1) {
            updated.push(idx);
        } else {
            updated.splice(existingIndex, 1);
        }

        handleAnswer(updated);
    };

    // Check if an option is selected in multiple choice
    const isChecked = (idx) => {
        const currentAnswer = answers[currentIndex] || [];
        return currentAnswer.includes(idx);
    };

    if (!test) return <div>Test not found.</div>;
    if (submitted) return <div>Submitting...</div>;
    if (!initialized) return <div>Loading test...</div>;

    return (
        <div style={{ maxWidth: 800, margin: '40px auto' }}>
            <h2>{test.title}</h2>
            <div style={{ marginBottom: 12 }}>
                <b>Question {currentIndex + 1}/{test.questions.length}</b> | Points: {question.points} | Time Left: {timeLeft}s
            </div>

            <div style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
                <div style={{ marginBottom: 8 }}>{question.q}</div>

                {/* Single choice questions */}
                {question.type === 'single' && question.options.map((opt, idx) => (
                    <label key={idx} style={{ display: 'block', marginBottom: 8 }}>
                        <input
                            type="radio"
                            name="single"
                            checked={answers[currentIndex] === idx}
                            onChange={() => handleAnswer(idx)}
                        />{' '}
                        {opt}
                    </label>
                ))}

                {/* Multiple choice questions */}
                {question.type === 'multiple' && question.options.map((opt, idx) => (
                    <label key={idx} style={{ display: 'block', marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={isChecked(idx)}
                            onChange={() => handleCheckboxChange(idx)}
                        />{' '}
                        {opt}
                    </label>
                ))}

                {/* Text input questions */}
                {question.type === 'text' && (
                    <input
                        type="text"
                        value={answers[currentIndex] || ''}
                        onChange={(e) => handleAnswer(e.target.value)}
                        style={{ width: '100%', padding: 8, marginTop: 8 }}
                    />
                )}

                {/* Matching questions */}
                {question.type === 'match' && question.matches.map((pair, idx) => (
                    <div key={idx} style={{ display: 'flex', marginBottom: 8, alignItems: 'center' }}>
                        <div style={{ marginRight: 12, flex: 1 }}>{pair.left}</div>
                        <select
                            value={answers[currentIndex]?.[idx] || ''}
                            onChange={(e) => {
                                const updated = [...(answers[currentIndex] || Array(question.matches.length).fill(''))];
                                updated[idx] = e.target.value;
                                handleAnswer(updated);
                            }}
                            style={{ flex: 1 }}
                        >
                            <option value="">-- Select --</option>
                            {question.matches.map((m, i) => (
                                <option key={i} value={m.right}>
                                    {m.right}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}

                <button
                    onClick={handleNext}
                    style={{ marginTop: 12, padding: '8px 16px', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                    {currentIndex + 1 < test.questions.length ? 'Next' : 'Submit'}
                </button>
            </div>
        </div>
    );
}