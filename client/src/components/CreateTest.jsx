import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveTest } from '../utils/storage';
import styles from './CreateTest.module.css';

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

    const handleAddGroup = () => {
        if (currentGroup && !groups.includes(currentGroup)) {
            setGroups([...groups, currentGroup]);
            setCurrentGroup('');
        }
    };

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

    const handleQuestionChange = (idx, field, value) => {
        const updated = [...questions];
        updated[idx][field] = value;
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

    const handleAnswerChange = (qIdx, value) => {
        const updated = [...questions];
        updated[qIdx].answer = value;
        setQuestions(updated);
    };

    const handleGroupChange = (qIdx, value) => {
        const updated = [...questions];
        updated[qIdx].group = value;
        setQuestions(updated);
    };

    const handleRemoveQuestion = (idx) => {
        const updated = [...questions];
        updated.splice(idx, 1);
        setQuestions(updated);
    };

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
        <div className={styles.container}>
            <h2 className={styles.title}>Create New Test</h2>
            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Test Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={styles.formInput}
                />

                {/* Group management */}
                <div style={{ marginBottom: 16 }}>
                    <input
                        placeholder="Add new group (topic)"
                        value={currentGroup}
                        onChange={e => setCurrentGroup(e.target.value)}
                        className={styles.groupInput}
                    />
                    <button type="button" onClick={handleAddGroup} className={styles.button}>
                        Add Group
                    </button>
                    <div className={styles.groupList}>
                        {groups.length > 0 && <><b>Groups:</b> {groups.join(', ')}</>}
                    </div>
                </div>

                {/* Questions */}
                <h4>Questions</h4>
                {questions.map((q, idx) => (
                    <div key={idx} className={styles.questionCard}>
                        <div className={styles.questionHeader}>
                            <input
                                placeholder={`Question ${idx + 1}`}
                                value={q.q}
                                onChange={e => handleQuestionChange(idx, 'q', e.target.value)}
                                className={styles.questionInput}
                            />
                            <select
                                value={q.type}
                                onChange={e => handleQuestionChange(idx, 'type', e.target.value)}
                                className={styles.select}
                            >
                                {QUESTION_TYPES.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <select
                                value={q.group}
                                onChange={e => handleGroupChange(idx, e.target.value)}
                                className={styles.select}
                            >
                                <option value="">No Group</option>
                                {groups.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                            <button type="button" onClick={() => handleRemoveQuestion(idx)} className={styles.buttonRemove}>
                                Remove
                            </button>
                        </div>

                        {/* Single Choice */}
                        {q.type === 'single' && (
                            <div>
                                <b>Options:</b>
                                {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className={styles.optionRow}>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                            className={styles.optionInput}
                                        />
                                        <input
                                            type="radio"
                                            name={`single-answer-${idx}`}
                                            checked={q.answer[0] === optIdx}
                                            onChange={() => handleAnswerChange(idx, [optIdx])}
                                            style={{ marginLeft: 8 }}
                                        />
                                        <span className={styles.correctLabel}>Correct</span>
                                        {q.options.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveOption(idx, optIdx)} className={styles.button}>
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddOption(idx)} className={styles.button}>
                                    Add Option
                                </button>
                            </div>
                        )}

                        {/* Multiple Choice */}
                        {q.type === 'multiple' && (
                            <div>
                                <b>Options:</b>
                                {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className={styles.optionRow}>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                            className={styles.optionInput}
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
                                        <span className={styles.correctLabel}>Correct</span>
                                        {q.options.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveOption(idx, optIdx)} className={styles.button}>
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddOption(idx)} className={styles.button}>
                                    Add Option
                                </button>
                            </div>
                        )}

                        {/* Matching */}
                        {q.type === 'match' && (
                            <div>
                                <b>Pairs:</b>
                                {q.matches.map((pair, mIdx) => (
                                    <div key={mIdx} className={styles.matchRow}>
                                        <input
                                            type="text"
                                            placeholder="Left"
                                            value={pair.left}
                                            onChange={e => handleMatchChange(idx, mIdx, 'left', e.target.value)}
                                            className={styles.matchInput}
                                        />
                                        <span>→</span>
                                        <input
                                            type="text"
                                            placeholder="Right"
                                            value={pair.right}
                                            onChange={e => handleMatchChange(idx, mIdx, 'right', e.target.value)}
                                            className={styles.matchInput}
                                        />
                                        {q.matches.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveMatch(idx, mIdx)} className={styles.button}>
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddMatch(idx)} className={styles.button}>
                                    Add Pair
                                </button>
                            </div>
                        )}

                        {/* Text Answer */}
                        {q.type === 'text' && (
                            <div>
                                <b>Correct Answer:</b>
                                <input type="text"
                                       value={q.answer[0] || ''}
                                       onChange={e => handleAnswerChange(idx, [e.target.value])}
                                       className={styles.textAnswerInput}
                                />
                            </div>
                        )}
                    </div>
                ))}
                <button type="button" onClick={handleAddQuestion} className={styles.button}>
                    Add Question
                </button>

                <div style={{ marginTop: 24 }}>
                    <button type="submit" className={styles.button}>
                        Save Test
                    </button>
                </div>
            </form>
        </div>
    );
}


