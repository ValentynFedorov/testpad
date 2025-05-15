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
                        Student: {session.student} | Score: {session.score}/{test.questions.length}
                    </li>
                ))}
            </ul>
        </div>
    );
}