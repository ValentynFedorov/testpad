import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveTest } from '../utils/storage';

const QUESTION_TYPES = [
    { value: 'single', label: 'Single Choice' },
    { value: 'multiple', label: 'Multiple Choice' },
    { value: 'match', label: 'Matching' },
    { value: 'text', label: 'Text Answer' },
];

export default function CreateTest() {
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState([]);
    const [currentGroup, setCurrentGroup] = useState('');
    const [groups, setGroups] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Add a new group
    const handleAddGroup = () => {
        if (currentGroup && !groups.includes(currentGroup)) {
            setGroups([...groups, currentGroup]);
            setCurrentGroup('');
        }
    };

    // Add a new question
    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                q: '',
                type: 'single',
                options: [''],
                answer: [],
                group: groups[0] || '',
                matches: [{ left: '', right: '' }],
            },
        ]);
    };

    // Update question fields
    const handleQuestionChange = (idx, field, value) => {
        const updated = [...questions];
        updated[idx][field] = value;
        // Reset options/answers if type changes
        if (field === 'type') {
            if (value === 'single' || value === 'multiple') {
                updated[idx].options = [''];
                updated[idx].answer = [];
                updated[idx].matches = [{ left: '', right: '' }];
            } else if (value === 'match') {
                updated[idx].matches = [{ left: '', right: '' }];
                updated[idx].options = [''];
                updated[idx].answer = [];
            } else if (value === 'text') {
                updated[idx].answer = [''];
                updated[idx].options = [''];
                updated[idx].matches = [{ left: '', right: '' }];
            }
        }
        setQuestions(updated);
    };

    // Add/remove options for single/multiple choice
    const handleOptionChange = (qIdx, optIdx, value) => {
        const updated = [...questions];
        updated[qIdx].options[optIdx] = value;
        setQuestions(updated);
    };
    const handleAddOption = (qIdx) => {
        const updated = [...questions];
        updated[qIdx].options.push('');
        setQuestions(updated);
    };
    const handleRemoveOption = (qIdx, optIdx) => {
        const updated = [...questions];
        updated[qIdx].options.splice(optIdx, 1);
        setQuestions(updated);
    };

    // Add/remove matches for matching type
    const handleMatchChange = (qIdx, mIdx, side, value) => {
        const updated = [...questions];
        updated[qIdx].matches[mIdx][side] = value;
        setQuestions(updated);
    };
    const handleAddMatch = (qIdx) => {
        const updated = [...questions];
        updated[qIdx].matches.push({ left: '', right: '' });
        setQuestions(updated);
    };
    const handleRemoveMatch = (qIdx, mIdx) => {
        const updated = [...questions];
        updated[qIdx].matches.splice(mIdx, 1);
        setQuestions(updated);
    };

    // Set correct answer(s)
    const handleAnswerChange = (qIdx, value) => {
        const updated = [...questions];
        updated[qIdx].answer = value;
        setQuestions(updated);
    };

    // Set group for question
    const handleGroupChange = (qIdx, value) => {
        const updated = [...questions];
        updated[qIdx].group = value;
        setQuestions(updated);
    };

    // Remove question
    const handleRemoveQuestion = (idx) => {
        const updated = [...questions];
        updated.splice(idx, 1);
        setQuestions(updated);
    };

    // Save test
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || questions.some(q => !q.q || (q.type === 'single' && (q.options.length < 2 || q.answer.length !== 1)) ||
            (q.type === 'multiple' && (q.options.length < 2 || q.answer.length < 1)) ||
            (q.type === 'match' && (q.matches.length < 1 || q.matches.some(m => !m.left || !m.right))) ||
            (q.type === 'text' && !q.answer[0])
        )) return alert('Please fill all questions and answers correctly.');
        const id = Math.random().toString(36).slice(2, 10);
        saveTest({ id, title, questions, creator: user.email });
        navigate('/teacher/dashboard');
    };

    return (
        <div style={{ maxWidth: 800, margin: '40px auto' }}>
            <h2>Create New Test</h2>
            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Test Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{ width: '100%', marginBottom: 16 }}
                />

                {/* Group management */}
                <div style={{ marginBottom: 16 }}>
                    <input
                        placeholder="Add new group (topic)"
                        value={currentGroup}
                        onChange={e => setCurrentGroup(e.target.value)}
                        style={{ width: 200, marginRight: 8 }}
                    />
                    <button type="button" onClick={handleAddGroup}>Add Group</button>
                    <div>
                        {groups.length > 0 && <b>Groups:</b>} {groups.join(', ')}
                    </div>
                </div>

                {/* Questions */}
                <h4>Questions</h4>
                {questions.map((q, idx) => (
                    <div key={idx} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                        <div style={{ marginBottom: 8 }}>
                            <input
                                placeholder={`Question ${idx + 1}`}
                                value={q.q}
                                onChange={e => handleQuestionChange(idx, 'q', e.target.value)}
                                style={{ width: '70%' }}
                            />
                            <select
                                value={q.type}
                                onChange={e => handleQuestionChange(idx, 'type', e.target.value)}
                                style={{ marginLeft: 8 }}
                            >
                                {QUESTION_TYPES.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <select
                                value={q.group}
                                onChange={e => handleGroupChange(idx, e.target.value)}
                                style={{ marginLeft: 8 }}
                            >
                                <option value="">No Group</option>
                                {groups.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                            <button type="button" onClick={() => handleRemoveQuestion(idx)} style={{ marginLeft: 8, color: 'red' }}>Remove</button>
                        </div>

                        {/* Single Choice */}
                        {q.type === 'single' && (
                            <div>
                                <b>Options:</b>
                                {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                            style={{ width: 200 }}
                                        />
                                        <input
                                            type="radio"
                                            name={`single-answer-${idx}`}
                                            checked={q.answer[0] === optIdx}
                                            onChange={() => handleAnswerChange(idx, [optIdx])}
                                            style={{ marginLeft: 8 }}
                                        />
                                        <span style={{ marginLeft: 4 }}>Correct</span>
                                        {q.options.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveOption(idx, optIdx)} style={{ marginLeft: 8 }}>Remove</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddOption(idx)}>Add Option</button>
                            </div>
                        )}

                        {/* Multiple Choice */}
                        {q.type === 'multiple' && (
                            <div>
                                <b>Options:</b>
                                {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                            style={{ width: 200 }}
                                        />
                                        <input
                                            type="checkbox"
                                            checked={q.answer.includes(optIdx)}
                                            onChange={() => {
                                                let newAns = q.answer.includes(optIdx)
                                                    ? q.answer.filter(a => a !== optIdx)
                                                    : [...q.answer, optIdx];
                                                handleAnswerChange(idx, newAns);
                                            }}
                                            style={{ marginLeft: 8 }}
                                        />
                                        <span style={{ marginLeft: 4 }}>Correct</span>
                                        {q.options.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveOption(idx, optIdx)} style={{ marginLeft: 8 }}>Remove</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddOption(idx)}>Add Option</button>
                            </div>
                        )}

                        {/* Matching */}
                        {q.type === 'match' && (
                            <div>
                                <b>Pairs:</b>
                                {q.matches.map((pair, mIdx) => (
                                    <div key={mIdx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                        <input
                                            type="text"
                                            placeholder="Left"
                                            value={pair.left}
                                            onChange={e => handleMatchChange(idx, mIdx, 'left', e.target.value)}
                                            style={{ width: 120 }}
                                        />
                                        <span style={{ margin: '0 8px' }}>→</span>
                                        <input
                                            type="text"
                                            placeholder="Right"
                                            value={pair.right}
                                            onChange={e => handleMatchChange(idx, mIdx, 'right', e.target.value)}
                                            style={{ width: 120 }}
                                        />
                                        {q.matches.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveMatch(idx, mIdx)} style={{ marginLeft: 8 }}>Remove</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddMatch(idx)}>Add Pair</button>
                            </div>
                        )}

                        {/* Text Answer */}
                        {q.type === 'text' && (
                            <div>
                                <b>Correct Answer:</b>
                                <input
                                    type="text"
                                    value={q.answer[0] || ''}
                                    onChange={e => handleAnswerChange(idx, [e.target.value])}
                                    style={{ width: 300, marginLeft: 8 }}
                                />
                            </div>
                        )}
                    </div>
                ))}
                <button type="button" onClick={handleAddQuestion}>Add Question</button>
                <button type="submit" style={{ marginLeft: 10 }}>Save Test</button>
            </form>
        </div>
    );
}