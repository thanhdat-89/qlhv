import { useState, useEffect } from 'react';
import { useDatabase } from './hooks/useDatabase';
import Dashboard from './views/Dashboard';
import Students from './views/Students';
import Classes from './views/Classes';
import Schedule from './views/Schedule';
import Attendance from './views/Attendance';
import Tuition from './views/Tuition';
import Sidebar from './components/Sidebar';
import SettingsView from './views/Settings';
import Login from './components/Login';
import './App.css';

function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('hv_manager_auth') === 'true';
    });
    const db = useDatabase();
    const { isLoading } = db;

    const handleLogin = () => {
        setIsAuthenticated(true);
        localStorage.setItem('hv_manager_auth', 'true');
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard db={db} />;
            case 'students': return <Students db={db} />;
            case 'classes': return <Classes db={db} />;
            case 'schedule': return <Schedule db={db} />;
            case 'attendance': return <Attendance db={db} />;
            case 'tuition': return <Tuition db={db} />;
            case 'settings': return <SettingsView db={db} />;
            default: return <Dashboard db={db} />;
        }
    };

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
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <main className="main-content">
                {renderView()}
            </main>
        </div>
    );
}

export default App;
