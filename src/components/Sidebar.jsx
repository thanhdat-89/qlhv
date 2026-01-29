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

const Sidebar = ({ activeView, setActiveView, isMobileOpen, setIsMobileOpen, onLogout }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'students', label: 'Học viên', icon: Users },
        { id: 'classes', label: 'Lớp học', icon: BookOpen },
        { id: 'schedule', label: 'Lịch học', icon: Calendar },
        { id: 'attendance', label: 'Điểm danh', icon: CalendarCheck },
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

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

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
            </div>

            <nav style={{ flex: 1, padding: '1rem' }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveView(item.id);
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
                        setActiveView('settings');
                        if (isMobile) setIsMobileOpen(false);
                    }}
                    className={`btn nav-link ${activeView === 'settings' ? 'active' : ''}`}
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
