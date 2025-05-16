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
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([]);
    const [topics, setTopics] = useState([]);
    const [currentTopic, setCurrentTopic] = useState('');
    const [testSettings, setTestSettings] = useState({
        showOneQuestionAtTime: true,
        randomizeQuestions: true,
        randomSelectionRules: [],
        enableTimeLimit: false,
    });
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleAddTopic = () => {
        if (currentTopic && !topics.includes(currentTopic)) {
            const newTopics = [...topics, currentTopic];
            setTopics(newTopics);
            setTestSettings({
                ...testSettings,
                randomSelectionRules: [
                    ...testSettings.randomSelectionRules,
                    { topic: currentTopic, count: 1 }
                ]
            });
            setCurrentTopic('');
        }
    };

    const handleRandomSelectionRuleChange = (topicIndex, count) => {
        const updatedRules = [...testSettings.randomSelectionRules];
        updatedRules[topicIndex] = {
            ...updatedRules[topicIndex],
            count: Math.max(1, parseInt(count) || 1)
        };
        setTestSettings({ ...testSettings, randomSelectionRules: updatedRules });
    };

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                q: '',
                type: 'single',
                options: [''],
                answer: [],
                topic: topics.length > 0 ? topics[0] : '',
                matches: [{ left: '', right: '' }],
                points: 1.0,
                timeLimit: 30,
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
        updated[qIdx].answer = updated[qIdx].answer.filter(a => a !== optIdx && (a < optIdx || a > optIdx));
        updated[qIdx].answer = updated[qIdx].answer.map(a => (a > optIdx ? a - 1 : a));
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

    const handleTopicChange = (qIdx, value) => {
        const updated = [...questions];
        updated[qIdx].topic = value;
        setQuestions(updated);
    };

    const handleRemoveQuestion = (idx) => {
        const updated = [...questions];
        updated.splice(idx, 1);
        setQuestions(updated);
    };

    const handleSettingChange = (setting, value) => {
        setTestSettings({
            ...testSettings,
            [setting]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!title) {
            alert('Please provide a test title');
            return;
        }

        if (questions.length === 0) {
            alert('Please add at least one question');
            return;
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.q) {
                alert(`Question ${i + 1} is missing content`);
                return;
            }
            if (q.points <= 0) {
                alert(`Question ${i + 1} needs a positive point value`);
                return;
            }
            if (testSettings.enableTimeLimit && (!q.timeLimit || q.timeLimit <= 0)) {
                alert(`Question ${i + 1} needs a positive time limit`);
                return;
            }
            if (q.type === 'single' && (q.options.length < 2 || q.answer.length !== 1)) {
                alert(`Single choice question ${i + 1} needs multiple options and one answer selected`);
                return;
            }
            if (q.type === 'multiple' && (q.options.length < 2 || q.answer.length < 1)) {
                alert(`Multiple choice question ${i + 1} needs multiple options and at least one answer selected`);
                return;
            }
            if (q.type === 'match' && (q.matches.length < 1 || q.matches.some(m => !m.left || !m.right))) {
                alert(`Matching question ${i + 1} needs at least one complete pair`);
                return;
            }
            if (q.type === 'text' && !q.answer[0]) {
                alert(`Text question ${i + 1} needs a correct answer`);
                return;
            }
        }

        const topicsWithRules = new Set(testSettings.randomSelectionRules.map(rule => rule.topic));
        for (const topic of topics) {
            if (!topicsWithRules.has(topic)) {
                alert(`Missing random selection rule for topic: ${topic}`);
                return;
            }
        }

        if (!testSettings.enableTimeLimit) {
            questions.forEach(q => { q.timeLimit = undefined; });
        }

        const id = Math.random().toString(36).slice(2, 10);
        saveTest({
            id,
            title,
            description,
            questions,
            creator: user.email,
            settings: testSettings
        });

        navigate('/teacher/dashboard');
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Create New Test</h2>

            <form onSubmit={handleSubmit}>
                <div className={styles.formSection}>
                    <h3>Basic Information</h3>
                    <input
                        placeholder="Test Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className={styles.formInput}
                        required
                    />
                    <textarea
                        placeholder="Test Description (optional)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className={styles.formTextarea}
                        rows={3}
                    />
                </div>

                <div className={styles.formSection}>
                    <h3>Test Settings</h3>

                    <div className={styles.setting}>
                        <label>
                            <input
                                type="checkbox"
                                checked={testSettings.showOneQuestionAtTime}
                                onChange={e => handleSettingChange('showOneQuestionAtTime', e.target.checked)}
                            />
                            Show one question at a time
                        </label>
                    </div>

                    <div className={styles.setting}>
                        <label>
                            <input
                                type="checkbox"
                                checked={testSettings.randomizeQuestions}
                                onChange={e => handleSettingChange('randomizeQuestions', e.target.checked)}
                            />
                            Randomize question order
                        </label>
                    </div>

                    <div className={styles.setting}>
                        <label>
                            <input
                                type="checkbox"
                                checked={testSettings.enableTimeLimit}
                                onChange={e => handleSettingChange('enableTimeLimit', e.target.checked)}
                            />
                            Enable Time Limits for Questions
                        </label>
                    </div>
                </div>

                {/* You can add topic UI here */}

                <div className={styles.formSection}>
                    <h3>Questions</h3>

                    {questions.map((q, idx) => (
                        <div key={idx} className={styles.questionCard}>
                            <div className={styles.questionHeader}>
                                <h4>Question {idx + 1}</h4>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveQuestion(idx)}
                                    className={styles.buttonRemove}
                                >
                                    Remove
                                </button>
                            </div>

                            <div className={styles.questionContent}>
                                <input
                                    placeholder="Question text"
                                    value={q.q}
                                    onChange={e => handleQuestionChange(idx, 'q', e.target.value)}
                                    className={styles.questionInput}
                                    required
                                />

                                <div className={styles.questionSettings}>
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
                                        value={q.topic}
                                        onChange={e => handleTopicChange(idx, e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="">No Topic</option>
                                        {topics.map(topic => (
                                            <option key={topic} value={topic}>{topic}</option>
                                        ))}
                                    </select>

                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={q.points}
                                        onChange={e => handleQuestionChange(idx, 'points', parseFloat(e.target.value) || 0.1)}
                                        className={styles.numberInput}
                                    />

                                    {testSettings.enableTimeLimit && (
                                        <input
                                            type="number"
                                            min="5"
                                            value={q.timeLimit}
                                            onChange={e => handleQuestionChange(idx, 'timeLimit', parseInt(e.target.value) || 30)}
                                            className={styles.numberInput}
                                        />
                                    )}
                                </div>

                                {/* Here you can add option, matches, answers UI */}

                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddQuestion}
                        className={styles.buttonPrimary}
                    >
                        Add Question
                    </button>
                </div>

                <div className={styles.formSection}>
                    <button
                        type="submit"
                        className={styles.buttonSubmit}
                        disabled={questions.length === 0}
                    >
                        Save Test
                    </button>
                </div>
            </form>
        </div>
    );
}
