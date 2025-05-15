//TakeTest.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTestById, saveSession } from '../utils/storage';

function groupQuestionsByTopic(questions) {
    const groups = {};
    questions.forEach((q, idx) => {
        const group = q.group || 'Ungrouped';
        if (!groups[group]) groups[group] = [];
        groups[group].push({ ...q, idx });
    });
    return groups;
}

export default function TakeTest() {
    const { testId } = useParams();
    const test = getTestById(testId);
    const { user, logout } = useAuth();
    const [answers, setAnswers] = useState(test ? test.questions.map(q => {
        if (q.type === 'multiple') return [];
        if (q.type === 'match') return q.matches.map(() => '');
        return '';
    }) : []);
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    // Force logout if not student or not logged in
    useEffect(() => {
        if (!user || user.role !== 'student') {
            if (user) logout();
            localStorage.setItem('redirectAfterLogin', `/test/${testId}`);
            navigate('/login');
        }
        // eslint-disable-next-line
    }, [user, testId]);

    if (!test) return <div>Test not found.</div>;

    const grouped = groupQuestionsByTopic(test.questions);

    const handleChange = (qIdx, value) => {
        const updated = [...answers];
        updated[qIdx] = value;
        setAnswers(updated);
    };

    const handleMultipleChange = (qIdx, optIdx) => {
        const updated = [...answers];
        const arr = updated[qIdx] || [];
        if (arr.includes(optIdx)) {
            updated[qIdx] = arr.filter(i => i !== optIdx);
        } else {
            updated[qIdx] = [...arr, optIdx];
        }
        setAnswers(updated);
    };

    // For matching: ensure each right-side value can only be selected once per question
    const handleMatchDropdownChange = (qIdx, pairIdx, value) => {
        const updated = [...answers];
        // Prevent duplicate selection in the same question
        if (updated[qIdx].includes(value) && updated[qIdx][pairIdx] !== value) {
            // Optionally, show a warning or just ignore
            return;
        }
        updated[qIdx][pairIdx] = value;
        setAnswers(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let score = 0;
        test.questions.forEach((q, idx) => {
            if (q.type === 'single') {
                if (parseInt(q.answer[0], 10) === parseInt(answers[idx], 10)) score++;
            } else if (q.type === 'multiple') {
                const correct = (q.answer || []).sort().join(',');
                const userAns = (answers[idx] || []).sort().join(',');
                if (correct === userAns && userAns.length > 0) score++;
            } else if (q.type === 'match') {
                // For matching, check if all pairs are correct
                const correct = q.matches.map(pair => pair.right.trim().toLowerCase());
                const userAns = (answers[idx] || []).map(a => (a || '').trim().toLowerCase());
                if (
                    correct.length === userAns.length &&
                    correct.every((ans, i) => ans === userAns[i])
                ) {
                    score++;
                }
            } else if (q.type === 'text') {
                if ((q.answer[0] || '').trim().toLowerCase() === (answers[idx] || '').trim().toLowerCase()) score++;
            }
        });
        const sessionId = Math.random().toString(36).slice(2, 10);
        saveSession({ id: sessionId, testId, student: user.email, answers, score });
        setSubmitted(true);
        setTimeout(() => navigate(`/result/${sessionId}`), 1000);
    };

    return (
        <div style={{ maxWidth: 800, margin: '40px auto' }}>
            <h2>Test: {test.title}</h2>
            <form onSubmit={handleSubmit}>
                {Object.entries(grouped).map(([group, qs], gIdx) => (
                    <div key={group} style={{ marginBottom: 24 }}>
                        <h3>{group}</h3>
                        {qs.map((q, idx) => (
                            <div key={q.idx} style={{ marginBottom: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                <div style={{ marginBottom: 8 }}>
                                    <b>Q{q.idx + 1}:</b> {q.q}
                                </div>
                                {/* Single Choice */}
                                {q.type === 'single' && (
                                    <div>
                                        {q.options.map((opt, optIdx) => (
                                            <label key={optIdx} style={{ display: 'block', marginBottom: 4 }}>
                                                <input
                                                    type="radio"
                                                    name={`single-${q.idx}`}
                                                    checked={answers[q.idx] === optIdx}
                                                    onChange={() => handleChange(q.idx, optIdx)}
                                                />{' '}
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {/* Multiple Choice */}
                                {q.type === 'multiple' && (
                                    <div>
                                        {q.options.map((opt, optIdx) => (
                                            <label key={optIdx} style={{ display: 'block', marginBottom: 4 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={answers[q.idx]?.includes(optIdx)}
                                                    onChange={() => handleMultipleChange(q.idx, optIdx)}
                                                />{' '}
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {/* Matching */}
                                {q.type === 'match' && (
                                    <div>
                                        {q.matches.map((pair, pairIdx) => (
                                            <div key={pairIdx} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                                                <span style={{ width: 120 }}>{pair.left}</span>
                                                <span style={{ margin: '0 8px' }}>→</span>
                                                <select
                                                    value={answers[q.idx][pairIdx] || ''}
                                                    onChange={e => handleMatchDropdownChange(q.idx, pairIdx, e.target.value)}
                                                    style={{ width: 180 }}
                                                >
                                                    <option value="">Select...</option>
                                                    {q.matches.map((opt, optIdx) => (
                                                        <option
                                                            key={optIdx}
                                                            value={opt.right}
                                                            disabled={
                                                                answers[q.idx].includes(opt.right) &&
                                                                answers[q.idx][pairIdx] !== opt.right
                                                            }
                                                        >
                                                            {opt.right}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                        <div style={{ fontSize: 12, color: '#888' }}>
                                            Match each left item to the correct right item.
                                        </div>
                                    </div>
                                )}
                                {/* Text Answer */}
                                {q.type === 'text' && (
                                    <div>
                                        <input
                                            type="text"
                                            value={answers[q.idx] || ''}
                                            onChange={e => handleChange(q.idx, e.target.value)}
                                            style={{ width: 400 }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
                <button type="submit" disabled={submitted}>Submit</button>
            </form>
            {submitted && <div>Submitting...</div>}
        </div>
    );
}