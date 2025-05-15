import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTestById, updateTest } from '../utils/storage';
import styles from './EditTest.module.css';

export default function EditTest() {
    const { testId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [test, setTest] = useState(null);

    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState([]);
    const [groups, setGroups] = useState([]);
    const [currentGroup, setCurrentGroup] = useState('');

    useEffect(() => {
        const t = getTestById(testId);
        if (!t || t.creator !== user.email) {
            navigate('/teacher/dashboard');
        } else {
            setTest(t);
            setTitle(t.title);
            setQuestions(t.questions);
            setGroups([...new Set(t.questions.map(q => q.group).filter(Boolean))]);
            setLoading(false);
        }
        // eslint-disable-next-line
    }, [testId]);

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

    const handleQuestionChange = (idx, value) => {
        const updated = [...questions];
        updated[idx].q = value;
        setQuestions(updated);
    };

    const handleQuestionGroupChange = (idx, value) => {
        const updated = [...questions];
        updated[idx].group = value;
        setQuestions(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateTest({ ...test, title, questions });
        navigate('/teacher/dashboard');
    };

    if (loading) return <div>Loading...</div>;
    if (!test) return <div>Test not found.</div>;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Edit Test</h2>
            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Test Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={styles.formInput}
                />

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
                </div>

                <div className={styles.groupsList}>
                    <strong>Groups:</strong>
                    <ul>
                        {groups.map((g, i) => (
                            <li key={i}>{g}</li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3>Questions:</h3>
                    {questions.map((q, idx) => (
                        <div key={idx} className={styles.questionCard}>
                            <input
                                type="text"
                                placeholder={`Question ${idx + 1}`}
                                value={q.q}
                                onChange={e => handleQuestionChange(idx, e.target.value)}
                                className={styles.questionInput}
                            />
                            <select
                                value={q.group}
                                onChange={e => handleQuestionGroupChange(idx, e.target.value)}
                                className={styles.select}
                            >
                                {groups.map((g, i) => (
                                    <option key={i} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddQuestion} className={styles.button}>
                        Add Question
                    </button>
                </div>

                <button type="submit" className={styles.saveButton}>Save Test</button>
            </form>
        </div>
    );
}
