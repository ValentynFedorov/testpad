import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTests } from '../utils/storage';

export default function TeacherDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const tests = getTests().filter(t => t.creator === user.email);

    return (
        <div style={{ maxWidth: 600, margin: '40px auto' }}>
            <h2>Teacher Dashboard</h2>
            <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
            <button onClick={() => navigate('/teacher/create')} style={{ marginLeft: 10 }}>Create New Test</button>
            <h3>Your Tests</h3>
            <ul>
                {tests.map(test => (
                    <li key={test.id}>
                        <b>{test.title}</b> &nbsp;
                        <button onClick={() => navigate(`/teacher/test/${test.id}`)}>View Sessions</button>
                        <button onClick={() => navigate(`/teacher/edit/${test.id}`)} style={{ marginLeft: 10 }}>Edit</button>
                        <span style={{ marginLeft: 10, fontSize: 12, color: '#888' }}>
                            Share link: <input value={`${window.location.origin}/test/${test.id}`} readOnly style={{ width: 220 }} />
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}