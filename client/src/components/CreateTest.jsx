import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveTest } from '../utils/storage';
import styles from './CreateTest.module.css';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';


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
        enableTimeLimit: false, // New flag for time limits
    });
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleAddTopic = () => {
        if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
            const newTopics = [...topics, currentTopic.trim()];
            setTopics(newTopics);
            setTestSettings({
                ...testSettings,
                randomSelectionRules: [
                    ...testSettings.randomSelectionRules,
                    { topic: currentTopic.trim(), count: 1 }
                ]
            });
            setCurrentTopic('');
        }
    };

    const handleRemoveTopic = (topicToRemove) => {
        const newTopics = topics.filter(topic => topic !== topicToRemove);
        setTopics(newTopics);
        setTestSettings({
            ...testSettings,
            randomSelectionRules: testSettings.randomSelectionRules.filter(
                rule => rule.topic !== topicToRemove
            )
        });
        setQuestions(questions.map(q =>
            q.topic === topicToRemove ? {...q, topic: ''} : q
        ));
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
                options: ['', ''],
                answer: [],
                topic: topics.length > 0 ? topics[0] : '',
                matches: [{ left: '', right: '' }],
                points: 1.0, // Changed to float
                timeLimit: 30,
            },
        ]);
    };

    const handleQuestionChange = (idx, field, value) => {
        const updated = [...questions];
        updated[idx][field] = value;

        if (field === 'type') {
            if (value === 'single' || value === 'multiple') {
                updated[idx].options = ['', ''];
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
        updated[qIdx].answer = updated[qIdx].answer.filter(a => a !== optIdx);
        updated[qIdx].answer = updated[qIdx].answer.map(a => a > optIdx ? a - 1 : a);
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
    const renderTextWithLatex = (text) => {
        if (!text) return null;

        // Розділяємо текст на блоки за подвійними новими рядками
        const paragraphs = text.split(/\n\n+/);

        return paragraphs.map((paragraph, pIdx) => (
            <p key={pIdx}>
                {paragraph.split(/(\$\$?[^$]+\$\$?)/g).map((part, i) => {
                    if (part.startsWith('$$') && part.endsWith('$$')) {
                        // Блочна формула
                        const formula = part.slice(2, -2);
                        return (
                            <div key={i} className={styles.blockFormula}>
                                <BlockMath math={formula} />
                            </div>
                        );
                    } else if (part.startsWith('$') && part.endsWith('$')) {
                        // Рядкова формула
                        const formula = part.slice(1, -1);
                        return (
                            <span key={i} className={styles.inlineFormula}>
              <InlineMath math={formula} />
            </span>
                        );
                    } else if (part) {
                        // Звичайний текст
                        return (
                            <span key={i} className={styles.regularText}>
              {part}
            </span>
                        );
                    }
                    return null;
                })}
            </p>
        ));
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

        let finalQuestions = [];

        for (const rule of testSettings.randomSelectionRules) {
            const topicQuestions = questions.filter(q => q.topic === rule.topic);
            if (topicQuestions.length < rule.count) {
                alert(`Not enough questions in topic "${rule.topic}". You need at least ${rule.count}, but only ${topicQuestions.length} are available.`);
                return;
            }

            // Випадковий вибір
            const shuffled = [...topicQuestions].sort(() => 0.5 - Math.random());
            finalQuestions.push(...shuffled.slice(0, rule.count));
        }

// Якщо timeLimit вимкнено, видаляємо з питань це поле
        if (!testSettings.enableTimeLimit) {
            finalQuestions = finalQuestions.map(q => ({ ...q, timeLimit: undefined }));
        }


        const id = Math.random().toString(36).slice(2, 10);
        saveTest({
            id,
            title,
            description,
            questions: finalQuestions,
            creator: user.email,
            settings: testSettings
        });

        navigate('/teacher/dashboard');
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Create New Test</h2>

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Basic Info Section */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Basic Information</h3>
                    <div className={styles.inputGroup}>
                        <label>Test Title*</label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className={styles.textarea}
                            rows={3}
                        />
                    </div>
                </div>

                {/* Settings Section */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Test Settings</h3>
                    <div className={styles.settingsGrid}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={testSettings.showOneQuestionAtTime}
                                onChange={e => handleSettingChange('showOneQuestionAtTime', e.target.checked)}
                            />
                            Show one question at a time
                        </label>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={testSettings.randomizeQuestions}
                                onChange={e => handleSettingChange('randomizeQuestions', e.target.checked)}
                            />
                            Randomize question order
                        </label>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={testSettings.enableTimeLimit}
                                onChange={e => handleSettingChange('enableTimeLimit', e.target.checked)}
                            />
                            Enable time limits
                        </label>
                    </div>
                </div>

                {/* Topics Section */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Topics</h3>
                    <div className={styles.topicInputContainer}>
                        <input
                            placeholder="Enter topic name"
                            value={currentTopic}
                            onChange={e => setCurrentTopic(e.target.value)}
                            className={styles.input}
                        />
                        <button
                            type="button"
                            onClick={handleAddTopic}
                            className={styles.addButton}
                            disabled={!currentTopic.trim()}
                        >
                            Add Topic
                        </button>
                    </div>

                    {topics.length > 0 && (
                        <div className={styles.topicsContainer}>
                            <div className={styles.topicsList}>
                                {topics.map((topic, idx) => (
                                    <div key={topic} className={styles.topicItem}>
                                        <span>{topic}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTopic(topic)}
                                            className={styles.removeButton}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.rulesSection}>
                                <h4>Random Selection Rules</h4>
                                {testSettings.randomSelectionRules.map((rule, idx) => (
                                    <div key={idx} className={styles.ruleItem}>
                                        <span>{rule.topic}:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={rule.count}
                                            onChange={e => handleRandomSelectionRuleChange(idx, e.target.value)}
                                            className={styles.numberInput}
                                        />
                                        <span>questions</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Questions Section */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Questions</h3>

                    {questions.length === 0 ? (
                        <p className={styles.emptyMessage}>No questions added yet</p>
                    ) : (
                        <div className={styles.questionsList}>
                            {questions.map((q, idx) => (
                                <div key={idx} className={styles.questionCard}>
                                    <div className={styles.questionHeader}>
                                        <h4>Question {idx + 1}</h4>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveQuestion(idx)}
                                            className={styles.removeButton}
                                        >
                                            Remove Question
                                        </button>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>
                                            Question Text* (supports LaTeX using <code>$...$</code>)
                                        </label>
                                        <textarea
                                            value={q.q}
                                            onChange={e => handleQuestionChange(idx, 'q', e.target.value)}
                                            className={styles.textarea}
                                            rows={3}
                                            required
                                        />
                                        {q.q && (
                                            <div className={styles.latexPreview}>
                                                <strong>Preview:</strong>
                                                <div style={{marginTop: '8px'}}>
                                                    {renderTextWithLatex(q.q)}
                                                </div>
                                            </div>
                                        )}

                                                <div className={styles.questionMeta}>
                                            <div className={styles.inputGroup}>
                                                <label>Type</label>
                                                <select
                                                    value={q.type}
                                                    onChange={e => handleQuestionChange(idx, 'type', e.target.value)}
                                                    className={styles.select}
                                                >
                                                    {QUESTION_TYPES.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label>Topic</label>
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
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label>Points*</label>
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    value={q.points}
                                                    onChange={e => handleQuestionChange(idx, 'points', parseFloat(e.target.value) || 0.1)}
                                                    className={styles.numberInput}
                                                />
                                            </div>

                                            {testSettings.enableTimeLimit && (
                                                <div className={styles.inputGroup}>
                                                    <label>Time Limit (sec)*</label>
                                                    <input
                                                        type="number"
                                                        min="5"
                                                        value={q.timeLimit}
                                                        onChange={e => handleQuestionChange(idx, 'timeLimit', parseInt(e.target.value) || 30)}
                                                        className={styles.numberInput}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Question Type Specific Content */}
                                        {q.type === 'single' && (
                                            <div className={styles.optionsSection}>
                                                <label>Options (select one correct answer)</label>
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className={styles.optionRow}>
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                                            className={styles.optionInput}
                                                            placeholder={`Option ${optIdx + 1}`}
                                                        />
                                                        <input
                                                            type="radio"
                                                            name={`question-${idx}-answer`}
                                                            checked={q.answer.includes(optIdx)}
                                                            onChange={() => handleAnswerChange(idx, [optIdx])}
                                                            className={styles.radio}
                                                        />
                                                        {q.options.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveOption(idx, optIdx)}
                                                                className={styles.smallButton}
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddOption(idx)}
                                                    className={styles.addButton}
                                                >
                                                    Add Option
                                                </button>
                                            </div>
                                        )}

                                        {q.type === 'multiple' && (
                                            <div className={styles.optionsSection}>
                                                <label>Options (select all correct answers)</label>
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className={styles.optionRow}>
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                                            className={styles.optionInput}
                                                            placeholder={`Option ${optIdx + 1}`}
                                                        />
                                                        <input
                                                            type="checkbox"
                                                            checked={q.answer.includes(optIdx)}
                                                            onChange={() => {
                                                                const newAnswer = q.answer.includes(optIdx)
                                                                    ? q.answer.filter(a => a !== optIdx)
                                                                    : [...q.answer, optIdx];
                                                                handleAnswerChange(idx, newAnswer);
                                                            }}
                                                            className={styles.checkbox}
                                                        />
                                                        {q.options.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveOption(idx, optIdx)}
                                                                className={styles.smallButton}
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddOption(idx)}
                                                    className={styles.addButton}
                                                >
                                                    Add Option
                                                </button>
                                            </div>
                                        )}

                                        {q.type === 'match' && (
                                            <div className={styles.matchingSection}>
                                                <label>Matching Pairs</label>
                                                {q.matches.map((match, mIdx) => (
                                                    <div key={mIdx} className={styles.matchRow}>
                                                        <input
                                                            type="text"
                                                            value={match.left}
                                                            onChange={e => handleMatchChange(idx, mIdx, 'left', e.target.value)}
                                                            className={styles.matchInput}
                                                            placeholder="Left item"
                                                        />
                                                        <span className={styles.matchArrow}>→</span>
                                                        <input
                                                            type="text"
                                                            value={match.right}
                                                            onChange={e => handleMatchChange(idx, mIdx, 'right', e.target.value)}
                                                            className={styles.matchInput}
                                                            placeholder="Right item"
                                                        />
                                                        {q.matches.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveMatch(idx, mIdx)}
                                                                className={styles.smallButton}
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddMatch(idx)}
                                                    className={styles.addButton}
                                                >
                                                    Add Pair
                                                </button>
                                            </div>
                                        )}

                                        {q.type === 'text' && (
                                            <div className={styles.textAnswerSection}>
                                                <label>Correct Answer</label>
                                                <input
                                                    type="text"
                                                    value={q.answer[0] || ''}
                                                    onChange={e => handleAnswerChange(idx, [e.target.value])}
                                                    className={styles.input}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleAddQuestion}
                        className={styles.addButton}
                    >
                        Add Question
                    </button>
                </div>

                {/* Submit Section */}
                <div className={styles.submitSection}>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={questions.length === 0}
                    >
                        Save Test
                    </button>
                </div>
            </form>
        </div>
    );
}