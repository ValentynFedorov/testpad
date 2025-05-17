import { useParams } from 'react-router-dom';
import { getSessionById, getTestById } from '../utils/storage';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import styles from './ResultPage.module.css';

const renderMathText = (text) => {
    if (!text) return null;

    const parts = text.split(/(\$[^$]+\$)/g);

    return parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
            const formula = part.slice(1, -1);
            try {
                return <InlineMath key={i} math={formula} />;
            } catch (e) {
                return <span key={i} style={{color: 'red'}}>{`[LaTeX Error: ${part}]`}</span>;
            }
        } else if (part) {
            return <span key={i}>{part}</span>;
        }
        return null;
    });
};

export default function ResultPage() {
    const { sessionId } = useParams();
    const session = getSessionById(sessionId);
    const test = session ? getTestById(session.testId) : null;

    if (!session || !test) return <div className={styles.message}>Result not found.</div>;

    // Перераховуємо бали для перевірки
    const recalculatedScore = test.questions.reduce((sum, q, idx) => {
        const userAnswer = session.answers[idx];
        let isCorrect = false;

        if (q.type === 'single') {
            isCorrect = String(q.answer[0]) === String(userAnswer);
        }
        else if (q.type === 'multiple') {
            const correct = [...(q.answer || [])].sort().toString();
            const userStr = [...(userAnswer || [])].sort().toString();
            isCorrect = correct === userStr;
        }
        else if (q.type === 'match') {
            const correct = q.matches.map(pair => pair.right);
            const userArr = userAnswer || [];
            isCorrect = correct.length === userArr.length &&
                correct.every((a, i) => String(a) === String(userArr[i]));
        }
        else if (q.type === 'text') {
            isCorrect = (q.answer[0] || '').trim().toLowerCase() ===
                (userAnswer || '').trim().toLowerCase();
        }

        return isCorrect ? sum + (q.points || 1) : sum;
    }, 0);

    const totalPoints = test.questions.reduce((sum, q) => sum + (q.points || 1), 0);

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Test Result: {test.title}</h2>

            <div className={styles.summary}>
                <div>
                    <strong>Student:</strong> {session.student}
                </div>
                <div>
                    <strong>Score:</strong> {recalculatedScore} / {totalPoints} points
                </div>
                <div>
                    <strong>Percentage:</strong> {Math.round((recalculatedScore / totalPoints) * 100)}%
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
                    let userAnswerDisplay = '';

                    if (q.type === 'single') {
                        isCorrect = String(q.answer[0]) === String(userAnswer);
                        correctAnswerDisplay = q.options[q.answer[0]];
                        userAnswerDisplay = userAnswer !== undefined && q.options[userAnswer]
                            ? q.options[userAnswer]
                            : 'No answer';
                    }
                    else if (q.type === 'multiple') {
                        const correct = [...(q.answer || [])].sort().toString();
                        const userStr = [...(userAnswer || [])].sort().toString();
                        isCorrect = correct === userStr;
                        correctAnswerDisplay = q.answer.map(a => q.options[a]).join(', ');
                        userAnswerDisplay = userAnswer
                            ? userAnswer.map(a => q.options[a]).join(', ')
                            : 'No answer';
                    }
                    else if (q.type === 'match') {
                        const correct = q.matches.map(pair => pair.right);
                        const userArr = userAnswer || [];
                        isCorrect = correct.length === userArr.length &&
                            correct.every((a, i) => String(a) === String(userArr[i]));
                        correctAnswerDisplay = q.matches.map(m => `${m.left} → ${m.right}`).join('; ');
                        userAnswerDisplay = userAnswer
                            ? q.matches.map((m, i) => `${m.left} → ${userAnswer[i] || '?'}`).join('; ')
                            : 'No answer';
                    }
                    else if (q.type === 'text') {
                        isCorrect = (q.answer[0] || '').trim().toLowerCase() ===
                            (userAnswer || '').trim().toLowerCase();
                        correctAnswerDisplay = q.answer[0];
                        userAnswerDisplay = userAnswer || 'No answer';
                    }

                    return (
                        <div
                            key={idx}
                            className={`${styles.questionCard} ${isCorrect ? styles.correct : styles.incorrect}`}
                        >
                            <div className={styles.question}>
                                <strong>Question {idx + 1}:</strong> {renderMathText(q.q)}
                            </div>
                            <div className={styles.answerRow}>
                                <strong>Your answer:</strong>
                                <span className={styles.answerText}>
                                    {typeof userAnswerDisplay === 'string'
                                        ? renderMathText(userAnswerDisplay)
                                        : userAnswerDisplay}
                                </span>
                                {isCorrect ? (
                                    <span className={styles.correctText}>✓ Correct</span>
                                ) : (
                                    <span className={styles.incorrectText}>✗ Incorrect</span>
                                )}
                            </div>
                            {!isCorrect && (
                                <div className={styles.answerRow}>
                                    <strong>Correct answer:</strong>
                                    <span className={styles.answerText}>
                                        {typeof correctAnswerDisplay === 'string'
                                            ? renderMathText(correctAnswerDisplay)
                                            : correctAnswerDisplay}
                                    </span>
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