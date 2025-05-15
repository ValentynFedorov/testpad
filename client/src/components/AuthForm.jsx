import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        if (mode === 'register') {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.find(u => u.email === email)) return setError('User exists');
            users.push({ email, password, role });
            localStorage.setItem('users', JSON.stringify(users));
            login({ email, role });
            // Redirect logic
            const redirect = localStorage.getItem('redirectAfterLogin');
            if (redirect) {
                localStorage.removeItem('redirectAfterLogin');
                navigate(redirect);
            } else {
                navigate(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
            }
        } else {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) return setError('Invalid credentials');
            login({ email, role: user.role });
            // Redirect logic
            const redirect = localStorage.getItem('redirectAfterLogin');
            if (redirect) {
                localStorage.removeItem('redirectAfterLogin');
                navigate(redirect);
            } else {
                navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
            }
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '40px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
            <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
            <form onSubmit={handleSubmit}>
                <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
                {mode === 'register' && (
                    <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', marginBottom: 8 }}>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                )}
                {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
                <button type="submit" style={{ width: '100%' }}>{mode === 'login' ? 'Login' : 'Register'}</button>
            </form>
            <div style={{ marginTop: 10 }}>
                {mode === 'login' ? (
                    <span>Don't have an account? <a href="/register">Register</a></span>
                ) : (
                    <span>Already have an account? <a href="/login">Login</a></span>
                )}
            </div>
        </div>
    );
}