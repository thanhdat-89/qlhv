import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useDatabase } from './hooks/useDatabase';
import Dashboard from './views/Dashboard';
import Students from './views/Students';
import Classes from './views/Classes';
import Schedule from './views/Schedule';
import Attendance from './views/Attendance';
import Tuition from './views/Tuition';
import Sidebar from './components/Sidebar';
import SettingsView from './views/Settings';
import Promotions from './views/Promotions';
import Messages from './views/Messages';
import Login from './components/Login';
import './App.css';

function App() {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('hv_manager_auth') === 'true';
    });
    const db = useDatabase();
    const { isLoading } = db;

    const handleLogin = () => {
        setIsAuthenticated(true);
        localStorage.setItem('hv_manager_auth', 'true');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('hv_manager_auth');
        navigate('/');
    };

    // Idle Timeout Logic (10 minutes)
    useEffect(() => {
        if (!isAuthenticated) return;

        let timeout;
        const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

        const resetTimer = () => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                console.log('Idle timeout reached. Logging out...');
                handleLogout();
            }, TIMEOUT_MS);
        };

        // Events to track user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        // Initial timer start
        resetTimer();

        return () => {
            if (timeout) clearTimeout(timeout);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [isAuthenticated]);

    // Close mobile menu on route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [navigate]);

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    if (isLoading) {
        return (
            <div style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'var(--bg-dark)',
                color: 'var(--primary)'
            }}>
                <div className="spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(var(--primary-rgb), 0.3)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="app-container">
            <button
                className="mobile-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ width: '20px', height: '2px', background: 'white' }}></div>
                    <div style={{ width: '20px', height: '2px', background: 'white' }}></div>
                    <div style={{ width: '20px', height: '2px', background: 'white' }}></div>
                </div>
            </button>

            <div
                className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <Sidebar
                isMobileOpen={isMobileMenuOpen}
                setIsMobileOpen={setIsMobileMenuOpen}
                onLogout={handleLogout}
            />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard db={db} />} />
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    <Route path="/students" element={<Students db={db} />} />
                    <Route path="/classes" element={<Classes db={db} />} />
                    <Route path="/schedule" element={<Schedule db={db} />} />
                    <Route path="/attendance" element={<Attendance db={db} />} />
                    <Route path="/tuition" element={<Tuition db={db} />} />
                    <Route path="/promotions" element={<Promotions db={db} />} />
                    <Route path="/messages" element={<Messages db={db} />} />
                    <Route path="/settings" element={<SettingsView db={db} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
