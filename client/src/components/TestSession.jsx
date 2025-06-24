//TestSession.jsx
import { useParams } from 'react-router-dom';
import { getTestById, getSessionsByTestId } from '../utils/storage';

export default function TestSession() {
    const { testId } = useParams();
    const test = getTestById(testId);
    const sessions = getSessionsByTestId(testId);

    return (
        <div style={{ maxWidth: 600, margin: '40px auto' }}>
            <h2>Test: {test?.title}</h2>
            <div>
                <b>Share link:</b> <input value={`${window.location.origin}/test/${testId}`} readOnly style={{ width: 220 }} />
            </div>
            <h3>Sessions / Results</h3>
            <ul>
                {sessions.map(session => (
                    <li key={session.id}>
                        Student: {session.student} | Score: {
                        test.questions.reduce((sum, q, idx) => {
                            const userAnswer = session.answers[idx];
                            let isCorrect = false;

                            // Same scoring logic as ResultPage
                            if (q.type === 'single') {
                                isCorrect = String(q.answer[0]) === String(userAnswer);
                            } else if (q.type === 'multiple') {
                                const correct = [...(q.answer || [])].sort().toString();
                                const userStr = [...(userAnswer || [])].sort().toString();
                                isCorrect = correct === userStr;
                            } else if (q.type === 'match') {
                                const correct = q.matches.map(pair => pair.right);
                                const userArr = userAnswer || [];
                                isCorrect = correct.length === userArr.length &&
                                    correct.every((a, i) => String(a) === String(userArr[i]));
                            } else if (q.type === 'text') {
                                isCorrect = (q.answer[0] || '').trim().toLowerCase() ===
                                    (userAnswer || '').trim().toLowerCase();
                            }

                            return isCorrect ? sum + (q.points || 1) : sum;
                        }, 0)
                    }/{test.questions.reduce((sum, q) => sum + (q.points || 1), 0)}
                    </li>
                ))}
            </ul>
        </div>
    );
}