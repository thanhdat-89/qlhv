import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    CalendarCheck,
    Wallet,
    Calendar,
    Settings,
    LogOut,
    Gift,
    MessageSquare
} from 'lucide-react';
import logo from '../assets/logo.png';

const Sidebar = ({ isMobileOpen, setIsMobileOpen, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [innerWidth, setInnerWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => setInnerWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'students', label: 'Học viên', icon: Users },
        { id: 'classes', label: 'Lớp học', icon: BookOpen },
        { id: 'schedule', label: 'Lịch học chung', icon: Calendar },
        { id: 'attendance', label: 'Lịch học riêng', icon: CalendarCheck },
        { id: 'tuition', label: 'Học phí', icon: Wallet },
        { id: 'promotions', label: 'Khuyến mãi', icon: Gift },
        { id: 'messages', label: 'Tin nhắn', icon: MessageSquare },
    ];

    const sidebarStyle = {
        margin: '1rem',
        marginRight: 0,
        height: 'calc(100vh - 2rem)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 100,
    };

    const mobileSidebarStyle = {
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        margin: 0,
        height: '100vh',
        width: '280px',
        transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        borderRadius: 0,
    };

    const isMobile = innerWidth <= 1200;

    return (
        <aside
            className="glass sidebar-container"
            style={{
                ...sidebarStyle,
                ...(isMobile ? mobileSidebarStyle : {})
            }}
        >
            <div style={{ padding: '2rem 1rem', textAlign: 'center', position: 'relative' }}>
                {isMobile && (
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        ✕
                    </button>
                )}
                <div style={{
                    width: '100%',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img
                        src={logo}
                        alt="CQT Education Logo"
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            maxHeight: '120px',
                            objectFit: 'contain'
                        }}
                    />
                </div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>Quản Lý Học Viên</h2>
            </div>

            <nav style={{
                flex: 1,
                padding: '1rem',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                <style>{`
                    nav::-webkit-scrollbar { display: none; }
                `}</style>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    // Determine if path matches roughly
                    const isActive = location.pathname === `/${item.id}` || (location.pathname === '/' && item.id === 'dashboard');
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                navigate(`/${item.id === 'dashboard' ? '' : item.id}`);
                                if (isMobile) setIsMobileOpen(false);
                            }}
                            className={`btn nav-link ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <button
                    onClick={() => {
                        navigate('/settings');
                        if (isMobile) setIsMobileOpen(false);
                    }}
                    className={`btn nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
                >
                    <Settings size={20} />
                    <span>Cài đặt</span>
                </button>
                <button className="btn nav-link" style={{ color: 'var(--danger)' }} onClick={onLogout}>
                    <LogOut size={20} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
