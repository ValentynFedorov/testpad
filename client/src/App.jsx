import { Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import TeacherDashboard from './components/TeacherDashboard';
import CreateTest from './components/CreateTest';
import TestSession from './components/TestSession';
import StudentDashboard from './components/StudentDashboard';
import TakeTest from './components/TakeTest';
import ResultPage from './components/ResultPage';
import { useAuth } from './context/AuthContext';
import EditTest from './components/EditTest';

function App() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<AuthForm mode="login" />} />
            <Route path="/register" element={<AuthForm mode="register" />} />

            {/* Teacher routes */}
            <Route path="/teacher/dashboard" element={user?.role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/login" />} />
            <Route path="/teacher/create" element={user?.role === 'teacher' ? <CreateTest /> : <Navigate to="/login" />} />
            <Route path="/teacher/test/:testId" element={user?.role === 'teacher' ? <TestSession /> : <Navigate to="/login" />} />
            <Route path="/teacher/edit/:testId" element={user?.role === 'teacher' ? <EditTest /> : <Navigate to="/login" />} />

            {/* Student routes */}
            <Route path="/student/dashboard" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/login" />} />
            <Route path="/test/:testId" element={user ? <TakeTest /> : <Navigate to="/login" />} />
            <Route path="/result/:sessionId" element={user ? <ResultPage /> : <Navigate to="/login" />} />
        </Routes>
    );
}

export default App;