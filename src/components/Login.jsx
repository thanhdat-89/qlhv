import { useState } from 'react';
import { Lock, LogIn, AlertCircle, User } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === 'cqt263') {
            onLogin();
        } else {
            setError('Tài khoản hoặc mật khẩu không chính xác!');
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

                <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Quản Lý Học Viên</h1>
                <p style={{ color: 'var(--text-primary)', marginBottom: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
                    Vui lòng nhập tài khoản và mật khẩu quản lý để truy cập
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                            <User size={18} />
                        </div>
                        <input
                            className="glass"
                            type="text"
                            placeholder="Tài khoản..."
                            style={{
                                width: '100%', padding: '0.85rem 1rem 0.85rem 3rem',
                                color: 'var(--text-primary)',
                                border: error ? '1px solid var(--danger)' : '1px solid var(--glass-border)',
                                fontSize: '1rem',
                                background: 'white'
                            }}
                            autoFocus
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (error) setError('');
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                            <Lock size={18} />
                        </div>
                        <input
                            className="glass"
                            type="password"
                            placeholder="Mật khẩu..."
                            style={{
                                width: '100%', padding: '0.85rem 1rem 0.85rem 3rem',
                                color: 'var(--text-primary)',
                                border: error ? '1px solid var(--danger)' : '1px solid var(--glass-border)',
                                fontSize: '1rem',
                                background: 'white'
                            }}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError('');
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            color: 'var(--danger)', fontSize: '0.85rem'
                        }}>
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem', width: '100%', marginTop: '0.5rem' }}>
                        <LogIn size={18} style={{ marginRight: '8px' }} /> Đăng nhập
                    </button>
                </form>

                <p style={{ marginTop: '2.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
                    &copy; 2024 Website Quản lý học viên
                </p>
            </div>

            <style>{`
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .login-card:hover {
                    box-shadow: var(--shadow);
                    border-color: var(--primary);
                    transition: all 0.5s;
                }
            `}</style>
        </div>
    );
};

export default Login;
