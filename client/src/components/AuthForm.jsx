import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthForm.css';

export default function AuthForm({ mode }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) return setError('All fields required');
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        if (mode === 'register') {
            if (users.find(u => u.email === email)) return setError('User exists');
            users.push({ email, password, role });
            localStorage.setItem('users', JSON.stringify(users));
            login({ email, role });
        } else {
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) return setError('Invalid credentials');
            login({ email, role: user.role });
        }

        const redirect = localStorage.getItem('redirectAfterLogin');
        if (redirect) {
            localStorage.removeItem('redirectAfterLogin');
            navigate(redirect);
        } else {
            const currentRole = mode === 'register' ? role : users.find(u => u.email === email)?.role;
            navigate(currentRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
        }
    };

    return (
        <div className="auth-form-container">
            <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                {mode === 'register' && (
                    <select value={role} onChange={e => setRole(e.target.value)}>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                )}
                {error && <div className="auth-form-error">{error}</div>}
                <button type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
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
