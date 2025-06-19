import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTests } from '../utils/storage';

export default function StudentDashboard() {
    const { user, logout } = useAuth();

    // Сесії студентських проходжень (результати)
    const storedSessions = JSON.parse(localStorage.getItem('sessions') || '[]').filter(
        (s) => s.student === user.email
    );

    // Тести, які студент має пройти (pending tests)
    const [pendingTests, setPendingTests] = useState(() => {
        const saved = localStorage.getItem('pendingTests');
        return saved ? JSON.parse(saved) : [];
    });

    // При завантаженні додати pendingTestId, якщо він є (після переходу по лінку із тестом)
    useEffect(() => {
        const pendingTestId = localStorage.getItem('pendingTestId');
        if (pendingTestId && !pendingTests.includes(pendingTestId)) {
            const updated = [...pendingTests, pendingTestId];
            setPendingTests(updated);
            localStorage.setItem('pendingTests', JSON.stringify(updated));
        }
        localStorage.removeItem('pendingTestId');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Всі доступні тести з локального сховища
    const allTests = getTests();

    // Додати тест вручну по посиланню
    const [input, setInput] = useState('');
    const [error, setError] = useState('');

    const handleAddTest = () => {
        try {
            const url = new URL(input, window.location.origin);
            const parts = url.pathname.split('/');
            const testId = parts[2]; // Очікуємо /test/:testId
            if (!testId) throw new Error('Invalid test link');
            if (pendingTests.includes(testId)) {
                setError('Test already added.');
                return;
            }
            const updated = [...pendingTests, testId];
            setPendingTests(updated);
            localStorage.setItem('pendingTests', JSON.stringify(updated));
            setInput('');
            setError('');
        } catch {
            setError('Please enter a valid test URL.');
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '40px auto' }}>
            <h2>Student Dashboard</h2>
            <button onClick={logout}>Logout</button>

            <h3>Your Test Results</h3>
            {storedSessions.length === 0 && <p>No test results yet.</p>}
            <ul>
                {storedSessions.map((session) => {
                    const test = allTests.find((t) => t.id === session.testId);
                    if (!test) return null;
                    return (
                        <li key={session.id}>
                            {test.title} | Score: {session.score}/{test.questions.length}
                        </li>
                    );
                })}
            </ul>

            <h3>Pending Tests</h3>
            {pendingTests.length === 0 && <p>No tests to take currently.</p>}
            <ul>
                {pendingTests.map((testId) => {
                    const test = allTests.find((t) => t.id === testId);
                    if (!test) return null;
                    return (
                        <li key={testId}>
                            {test.title}{' '}
                            <a href={`/test/${test.id}`}>
                                <button>Take Test</button>
                            </a>
                        </li>
                    );
                })}
            </ul>

            <h3>Add Test Link</h3>
            <input
                type="text"
                placeholder="Enter test link (e.g. /test/dnrrctsc)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ width: '70%', marginRight: 10 }}
            />
            <button onClick={handleAddTest}>Add Test</button>
            {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
        </div>
    );
}
