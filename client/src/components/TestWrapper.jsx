import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TakeTest from './TakeTest';

export default function TestWrapper() {
    const { testId } = useParams();
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return; // Чекаємо, поки завантажиться контекст

        if (!user) {
            // Користувач не авторизований — зберігаємо testId і кидаємо на логін
            localStorage.setItem('pendingTestId', testId);
            navigate('/login');
        }
    }, [user, loading, navigate, testId]);

    if (loading) return <div>Loading...</div>;

    if (!user) return null; // Чекаємо редірект на логін

    // Якщо авторизований, просто рендеримо тест
    return <TakeTest testId={testId} />;
}
