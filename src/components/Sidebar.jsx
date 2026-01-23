import {
    LayoutDashboard,
    Users,
    BookOpen,
    CalendarCheck,
    Wallet,
    Calendar,
    Settings,
    LogOut
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'students', label: 'Học viên', icon: Users },
        { id: 'classes', label: 'Lớp học', icon: BookOpen },
        { id: 'schedule', label: 'Lịch học', icon: Calendar },
        { id: 'attendance', label: 'Điểm danh', icon: CalendarCheck },
        { id: 'tuition', label: 'Học phí', icon: Wallet },
    ];

    return (
        <aside className="glass" style={{ margin: '1rem', marginRight: 0, height: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{
                    width: '3rem', height: '3rem', background: 'var(--primary)',
                    borderRadius: '12px', margin: '0 auto 1rem', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                    <BookOpen />
                </div>
                <h2 style={{ fontSize: '1.25rem' }}>Quản lý học viên</h2>
            </div>

            <nav style={{ flex: 1, padding: '1rem' }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`btn ${isActive ? 'btn-primary' : 'btn-glass'}`}
                            style={{
                                width: '100%', justifyContent: 'flex-start', marginBottom: '0.5rem',
                                border: isActive ? 'none' : '1px solid transparent',
                                background: isActive ? '' : 'transparent'
                            }}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <button
                    onClick={() => setActiveView('settings')}
                    className={`btn ${activeView === 'settings' ? 'btn-primary' : 'btn-glass'}`}
                    style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        background: activeView === 'settings' ? '' : 'transparent',
                        border: activeView === 'settings' ? 'none' : '1px solid transparent',
                        marginBottom: '0.5rem'
                    }}
                >
                    <Settings size={20} />
                    <span>Cài đặt</span>
                </button>
                <button className="btn btn-glass" style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', border: 'none', color: 'var(--danger)' }}>
                    <LogOut size={20} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
