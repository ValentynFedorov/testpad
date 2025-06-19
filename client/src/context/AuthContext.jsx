import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchCurrentUser = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await api.get('/auth/me');

            // Handle different response structures
            const userData = response.data?.data?.user || response.data?.user;

            if (!userData) {
                throw new Error('Invalid user data structure');
            }

            setUser(userData);
        } catch (err) {
            console.error('Failed to fetch user:', err);
            setError(err.response?.data?.message || 'Failed to authenticate');
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/login', { email, password });

            const token = response.data.token;
            if (!token) {
                throw new Error('No authentication token received');
            }

            // 🔐 1. Зберігаємо токен
            localStorage.setItem('token', token);

            // 🔐 2. Додаємо токен до заголовків ДО fetchCurrentUser
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // ✅ 3. Тепер можна отримувати поточного користувача
            const refreshedUser = await api.get('/auth/me');
            const userData = refreshedUser.data?.data?.user || refreshedUser.data?.user;

            if (!userData) {
                throw new Error('Failed to fetch user data after login');
            }

            setUser(userData);
            return { success: true, user: userData };
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Login failed';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };



    const register = async (username, email, password, role) => {
        try {
            const { data } = await api.post('/auth/register', { username, email, password, role });
            localStorage.setItem('token', data.token);
            api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            const user = { id: data.id, email: data.email, role: data.role, username: data.username };
            setUser(user);
            return { success: true, user };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
            navigate('/login');
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            login,
            register,
            logout,
            refetchUser: fetchCurrentUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}