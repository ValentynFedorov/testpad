import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTestById, saveTest } from '../utils/storage';

export default function EditTest() {
    const { testId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);

    useEffect(() => {
        const t = getTestById(testId);
        if (!t || t.creator !== user.email) {
            navigate('/teacher/dashboard');
        } else {
            setTest(t);
        }
        // eslint-disable-next-line
    }, [testId]);

    const handleUpdate = (updatedTest) => {
        // Update test in localStorage
        const tests = JSON.parse(localStorage.getItem('tests') || '[]');
        const idx = tests.findIndex(t => t.id === testId);
        if (idx !== -1) {
            tests[idx] = { ...tests[idx], ...updatedTest };
            localStorage.setItem('tests', JSON.stringify(tests));
        }
        navigate('/teacher/dashboard');
    };

    if (!test) return <div>Loading...</div>;

    // You can reuse your CreateTest form here, passing test as initial values and handleUpdate as onSubmit
    // For brevity, here's a simple example:
    return (
        <div style={{ maxWidth: 800, margin: '40px auto' }}>
            <h2>Edit Test</h2>
            {/* You can copy your CreateTest form here, pre-filling with test.title, test.questions, etc. */}
            {/* On submit, call handleUpdate with the updated test object */}
            {/* ... */}
        </div>
    );
}