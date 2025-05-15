import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTests } from '../utils/storage';
import './TeacherDashboard.css';

export default function TeacherDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const tests = getTests().filter(t => t.creator === user.email);

    return (
        <div className="dashboard-container">
            <h2>Teacher Dashboard</h2>
            <div className="dashboard-actions">
                <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
                <button onClick={() => navigate('/teacher/create')}>Create New Test</button>
            </div>
            <h3>Your Tests</h3>
            <ul className="test-list">
                {tests.map(test => (
                    <li key={test.id} className="test-item">
                        <b>{test.title}</b>
                        <div className="test-buttons">
                            <button onClick={() => navigate(`/teacher/test/${test.id}`)}>View Sessions</button>
                            <button onClick={() => navigate(`/teacher/edit/${test.id}`)}>Edit</button>
                        </div>
                        <div className="share-link">
                            <span>Share link:</span>
                            <input
                                value={`${window.location.origin}/test/${test.id}`}
                                readOnly
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
