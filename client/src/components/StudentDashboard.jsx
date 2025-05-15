//StudentDashboard.jsx
import { useAuth } from '../context/AuthContext';
import { getTests } from '../utils/storage';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]').filter(s => s.student === user.email);

    return (
        <div style={{ maxWidth: 600, margin: '40px auto' }}>
            <h2>Student Dashboard</h2>
            <button onClick={logout}>Logout</button>
            <h3>Your Test Results</h3>
            <ul>
                {sessions.map(session => {
                    const test = getTests().find(t => t.id === session.testId);
                    return (
                        <li key={session.id}>
                            {test?.title} | Score: {session.score}/{test?.questions.length}
                        </li>
                    );
                })}
            </ul>
            <p>To take a test, use the link provided by your teacher.</p>
        </div>
    );
}
