import { useState } from 'react';
import { Lock, LogIn, AlertCircle } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === 'cqt263') {
            onLogin();
        } else {
            setError('Mật khẩu không chính xác!');
            setPassword('');
        }
    };

    return (
        <div className="login-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--bg-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000
        }}>
            <div className="login-card glass card" style={{
                width: '100%', maxWidth: '400px', padding: '3rem 2rem',
                textAlign: 'center', animation: 'fadeInScale 0.5s ease-out'
            }}>
                <div className="icon-circle primary" style={{
                    width: '64px', height: '64px', margin: '0 auto 1.5rem',
                    background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)'
                }}>
                    <Lock size={32} />
                </div>

                <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Quản Lý Học Viên</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Vui lòng nhập mật khẩu quản lý để truy cập
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="glass"
                            type="password"
                            placeholder="Nhập mật khẩu..."
                            style={{
                                width: '100%', padding: '0.85rem 1rem',
                                color: 'white', textAlign: 'center',
                                border: error ? '1px solid var(--danger)' : '1px solid var(--glass-border)',
                                fontSize: '1.1rem', letterSpacing: '0.2rem'
                            }}
                            autoFocus
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError('');
                            }}
                        />
                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.75rem'
                            }}>
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem', width: '100%', marginTop: '0.5rem' }}>
                        <LogIn size={18} style={{ marginRight: '8px' }} /> Xác nhận truy cập
                    </button>
                </form>

                <p style={{ marginTop: '2.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                    &copy; 2024 Website Quản lý học viên
                </p>
            </div>

            <style>{`
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .login-card:hover {
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                    border-color: var(--primary);
                    transition: all 0.5s;
                }
            `}</style>
        </div>
    );
};

export default Login;
