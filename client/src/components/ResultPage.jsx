//ResultPage.jsx
import { useParams } from 'react-router-dom';
import { getSessionById, getTestById } from '../utils/storage';

export default function ResultPage() {
    const { sessionId } = useParams();
    const session = getSessionById(sessionId);
    const test = session ? getTestById(session.testId) : null;

    if (!session || !test) return <div>Result not found.</div>;

    return (
        <div style={{ maxWidth: 600, margin: '40px auto' }}>
            <h2>Test Result: {test.title}</h2>
            <div>Score: {session.score} / {test.questions.length}</div>
            <h3>Your Answers:</h3>
            <ul>
                {test.questions.map((q, idx) => (
                    <li key={idx}>
                        <b>Q:</b> {q.q}<br />
                        <b>Your answer:</b> {session.answers[idx]}<br />
                        <b>Correct answer:</b> {q.a}
                    </li>
                ))}
            </ul>
        </div>
    );
}