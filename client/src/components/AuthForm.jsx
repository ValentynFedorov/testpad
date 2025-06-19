import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthForm.css';

export default function AuthForm({ mode }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, register } = useAuth();

    const normalizeRole = (role) => {
        if (!role) return 'student';
        if (typeof role === 'string') return role.toLowerCase();
        if (typeof role === 'number') return role === 1 ? 'teacher' : 'student';
        return 'student';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;
            if (mode === 'register') {
                result = await register(username, email, password, role);
            } else {
                result = await login(email, password);
            }

            if (result.success) {
                const userRole = normalizeRole(result.user.role);
                console.log('🧑‍💻 User info:', result.user);

                const redirect = localStorage.getItem('redirectAfterLogin');
                if (redirect) {
                    localStorage.removeItem('redirectAfterLogin');
                    navigate(redirect);
                } else {
                    if (userRole === 'teacher') {
                        navigate('/teacher/dashboard');
                    } else {
                        navigate('/student/dashboard');
                    }
                }
            } else {
                setError(result.message);
            }
        } catch (err) {
            console.error('❌ Auth error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form-container">
            <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
            <form onSubmit={handleSubmit}>
                {mode === 'register' && (
                    <input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                )}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                />
                {mode === 'register' && (
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                )}
                {error && <div className="auth-form-error">{error}</div>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
                </button>
            </form>
            <div className="switch-mode">
                {mode === 'login' ? (
                    <span>Don't have an account? <a href="/register">Register</a></span>
                ) : (
                    <span>Already have an account? <a href="/login">Login</a></span>
                )}
            </div>
        </div>
    );
}
