import { useParams } from 'react-router-dom';
import { getSessionById, getTestById } from '../utils/storage';
import styles from './ResultPage.module.css';

export default function ResultPage() {
    const { sessionId } = useParams();
    const session = getSessionById(sessionId);
    const test = session ? getTestById(session.testId) : null;

    if (!session || !test) return <div className={styles.message}>Result not found.</div>;

    const totalPoints = test.questions.reduce((sum, q) => sum + (q.points || 1), 0);

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Test Result: {test.title}</h2>

            <div className={styles.summary}>
                <div>
                    <strong>Student:</strong> {session.student}
                </div>
                <div>
                    <strong>Score:</strong> {session.score} / {totalPoints} points
                </div>
                <div>
                    <strong>Percentage:</strong> {Math.round((session.score / totalPoints) * 100)}%
                </div>
                <div>
                    <strong>Questions:</strong> {test.questions.length}
                </div>
            </div>

            <h3 className={styles.subTitle}>Detailed Question Results:</h3>
            <div className={styles.questions}>
                {test.questions.map((q, idx) => {
                    const userAnswer = session.answers[idx];
                    let isCorrect = false;
                    let correctAnswerDisplay = '';

                    if (q.type === 'single') {
                        isCorrect = parseInt(q.answer[0], 10) === parseInt(userAnswer, 10);
                        correctAnswerDisplay = q.options[q.answer[0]];
                    } else if (q.type === 'multiple') {
                        const correct = (q.answer || []).sort().join(',');
                        const userStr = (userAnswer || []).sort().join(',');
                        isCorrect = correct === userStr && userStr.length > 0;
                        correctAnswerDisplay = q.answer.map(a => q.options[a]).join(', ');
                    } else if (q.type === 'match') {
                        const correct = q.matches.map(pair => pair.right.trim().toLowerCase());
                        const userArr = (userAnswer || []).map(a => (a || '').trim().toLowerCase());
                        isCorrect = correct.length === userArr.length && correct.every((a, i) => a === userArr[i]);
                        correctAnswerDisplay = q.matches.map(m => `${m.left} → ${m.right}`).join('; ');
                    } else if (q.type === 'text') {
                        isCorrect = (q.answer[0] || '').trim().toLowerCase() === (userAnswer || '').trim().toLowerCase();
                        correctAnswerDisplay = q.answer[0];
                    }

                    let userAnswerDisplay = '';
                    if (q.type === 'single') {
                        userAnswerDisplay = userAnswer !== undefined ? q.options[userAnswer] : 'No answer';
                    } else if (q.type === 'multiple') {
                        userAnswerDisplay = userAnswer ? userAnswer.map(a => q.options[a]).join(', ') : 'No answer';
                    } else if (q.type === 'match') {
                        userAnswerDisplay = userAnswer
                            ? q.matches.map((m, i) => `${m.left} → ${userAnswer[i] || '?'}`).join('; ')
                            : 'No answer';
                    } else {
                        userAnswerDisplay = userAnswer || 'No answer';
                    }

                    return (
                        <div
                            key={idx}
                            className={`${styles.questionCard} ${isCorrect ? styles.correct : styles.incorrect}`}
                        >
                            <div className={styles.question}>
                                <strong>Question {idx + 1}:</strong> {q.q}
                            </div>
                            <div>
                                <strong>Your answer:</strong> {userAnswerDisplay}
                                {isCorrect ? (
                                    <span className={styles.correctText}>✓ Correct</span>
                                ) : (
                                    <span className={styles.incorrectText}>✗ Incorrect</span>
                                )}
                            </div>
                            {!isCorrect && (
                                <div>
                                    <strong>Correct answer:</strong> {correctAnswerDisplay}
                                </div>
                            )}
                            <div>
                                <strong>Points:</strong> {isCorrect ? q.points || 1 : 0} / {q.points || 1}
                            </div>
                            {q.topic && (
                                <div>
                                    <strong>Topic:</strong> {q.topic}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
