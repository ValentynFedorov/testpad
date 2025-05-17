import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTestById, saveSession, getTestProgress, saveTestProgress } from '../utils/storage';
import styles from './TakeTest.module.css';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

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
    const [authChecked, setAuthChecked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAutoNavigating, setIsAutoNavigating] = useState(false);

    const question = test?.questions[currentIndex];

    useEffect(() => {
        if (!test) {
            setLoading(false);
            return;
        }

        if (!user) {
            localStorage.setItem('redirectAfterLogin', `/test/${testId}`);
            navigate('/login');
            return;
        }

        if (user.role !== 'student') {
            logout();
            localStorage.setItem('redirectAfterLogin', `/test/${testId}`);
            navigate('/login');
            return;
        }

        setAuthChecked(true);
    }, [user, testId, navigate, logout, test]);

    useEffect(() => {
        if (!authChecked || !test || !user || initialized) return;

        const savedProgress = getTestProgress(testId, user.email);
        if (savedProgress) {
            setAnswers(savedProgress.answers || []);
            setCurrentIndex(savedProgress.currentIndex || 0);
            const currentQuestionIndex = savedProgress.currentIndex || 0;
            const currentQuestionTimeLimit = test.questions[currentQuestionIndex]?.timeLimit || 30;
            setTimeLeft(savedProgress.timeLeft || currentQuestionTimeLimit);
            setScore(savedProgress.score || 0);
        } else {
            const firstQuestionTimeLimit = test.questions[0]?.timeLimit || 30;
            setTimeLeft(firstQuestionTimeLimit);
        }

        setInitialized(true);
        setLoading(false);
    }, [authChecked, test, user, testId, initialized]);

    useEffect(() => {
        if (!question || !initialized) return;

        let timer = null;

        if (timeLeft > 0) {
            setIsAutoNavigating(false);
        }

        if (timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsAutoNavigating(true);
                        setTimeout(() => handleNext(true), 100);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [question, initialized, currentIndex, timeLeft]);

    const renderTextWithMath = (text) => {
        if (!text) return null;

        // Розділяємо текст на частини: звичайний текст і формули
        const parts = text.split(/(\$[^$]+\$)/g);

        return parts.map((part, i) => {
            if (part.startsWith('$') && part.endsWith('$')) {
                // Це формула - обробимо через KaTeX
                const formula = part.slice(1, -1);
                try {
                    return <InlineMath key={i} math={formula} />;
                } catch (e) {
                    return <span key={i} style={{color: 'red'}}>{`[LaTeX Error: ${part}]`}</span>;
                }
            } else if (part) {
                // Це звичайний текст
                return <span key={i}>{part}</span>;
            }
            return null;
        });
    };

    const handleNext = (autoProceed = false) => {
        if (autoProceed && isAutoNavigating) {
            return;
        }

        if (!autoProceed) evaluateAnswer();

        if (currentIndex + 1 < test.questions.length) {
            const nextIndex = currentIndex + 1;
            const nextQuestionTimeLimit = test.questions[nextIndex].timeLimit || 30;
            setCurrentIndex(nextIndex);
            setTimeLeft(nextQuestionTimeLimit);
            setIsAutoNavigating(false);

            if (user) {
                saveTestProgress(testId, user.email, {
                    answers,
                    currentIndex: nextIndex,
                    timeLeft: nextQuestionTimeLimit,
                    score,
                });
            }
        } else {
            submitTest();
        }
    };

    const submitTest = () => {
        const sessionId = Math.random().toString(36).slice(2, 10);
        saveSession({ id: sessionId, testId, student: user.email, answers, score });

        localStorage.removeItem(`test_progress_${testId}_${user.email}`);
        setSubmitted(true);
        setTimeout(() => navigate(`/result/${sessionId}`), 1000);
    };

    const handleAnswer = (value) => {
        const updated = [...answers];
        updated[currentIndex] = value;
        setAnswers(updated);

        if (user) {
            saveTestProgress(testId, user.email, {
                answers: updated,
                currentIndex,
                timeLeft,
                score,
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

        if (isCorrect) setScore((prev) => prev + (q.points || 1));
    };

    const isChecked = (idx) => answers[currentIndex]?.includes(idx);

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (!test) return <div className={styles.message}>Test not found.</div>;
    if (!authChecked) return <div className={styles.message}>Redirecting to login...</div>;
    if (submitted) return <div className={styles.message}>Submitting your answers...</div>;
    if (!initialized) return <div className={styles.message}>Preparing your test...</div>;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>{test.title}</h2>
            <div className={styles.header}>
                <strong>Question {currentIndex + 1}/{test.questions.length}</strong>
                <div>Points: {question.points}</div>
                <div>Time Left: {timeLeft}s</div>
            </div>

            <div className={styles.content}>
                <div className={`${styles.question} ${styles.mathText}`}>
                    {renderTextWithMath(question.q)}
                </div>
                {question.type === 'single' && question.options.map((opt, idx) => (
                    <label key={idx} className={styles.option}>
                        <input
                            type="radio"
                            name="single"
                            checked={answers[currentIndex] === idx}
                            onChange={() => handleAnswer(idx)}
                        />
                        <span className={styles.optionText}>{renderTextWithMath(opt)}</span>
                    </label>
                ))}

                {question.type === 'multiple' && question.options.map((opt, idx) => (
                    <label key={idx} className={styles.option}>
                        <input
                            type="checkbox"
                            checked={isChecked(idx)}
                            onChange={() => {
                                const updated = [...(answers[currentIndex] || [])];
                                const index = updated.indexOf(idx);
                                if (index === -1) updated.push(idx);
                                else updated.splice(index, 1);
                                handleAnswer(updated);
                            }}
                        />
                        {opt}
                    </label>
                ))}

                {question.type === 'text' && (
                    <input
                        type="text"
                        value={answers[currentIndex] || ''}
                        onChange={(e) => handleAnswer(e.target.value)}
                        className={styles.input}
                    />
                )}

                {question.type === 'match' && question.matches.map((pair, idx) => (
                    <div key={idx} className={styles.match}>
                        {pair.left} →
                        <select
                            value={answers[currentIndex]?.[idx] || ''}
                            onChange={(e) => {
                                const updated = [...(answers[currentIndex] || Array(question.matches.length).fill(''))];
                                updated[idx] = e.target.value;
                                handleAnswer(updated);
                            }}
                            className={styles.select}
                        >
                            <option value="">-- Select --</option>
                            {question.matches.map((m, i) => (
                                <option key={i} value={m.right}>{m.right}</option>
                            ))}
                        </select>
                    </div>
                ))}

                <button onClick={() => handleNext(false)} className={styles.button}>
                    {currentIndex + 1 < test.questions.length ? 'Next Question' : 'Submit Test'}
                </button>
            </div>
        </div>
    );
}
