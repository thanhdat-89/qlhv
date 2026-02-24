import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Filter, TrendingUp, Users, DollarSign, BadgeCheck, UserMinus } from 'lucide-react';

const Dashboard = ({ db }) => {
    const navigate = useNavigate();
    const { students, fees, classes, extraAttendance, actions } = db;

    // Get current week dates (Monday to Sunday)
    const getWeekDates = () => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(today);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return { monday, sunday };
    };

    const { monday, sunday } = getWeekDates();
    const dayLabelsMap = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };
    const dayNumbers = [1, 2, 3, 4, 5, 6, 7];

    // Stats for cards
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const studyingStudents = students.filter(s => s.status === 'Đang học' || s.status === 'Mới nhập học').length;
    const totalRevenue = fees.reduce((sum, f) => sum + f.amount, 0);
    const newStudents = students.filter(s => s.status === 'Mới nhập học').length;

    const leftThisMonth = students.filter(s => {
        if (s.status !== 'Đã nghỉ' || !s.leaveDate) return false;
        const leaveDate = new Date(s.leaveDate);
        return leaveDate.getMonth() === currentMonth && leaveDate.getFullYear() === currentYear;
    }).length;

    return (
        <div className="view-container">
            <div className="view-header">
                <h1>Tổng Quan</h1>
            </div>

            <div className="stats-grid">
                <div className="glass card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="icon-box icon-box-primary">
                        <Users size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Đang học</p>
                        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{studyingStudents}</h2>
                    </div>
                </div>
                <div className="glass card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="icon-box icon-box-success">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Học viên mới</p>
                        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{newStudents}</h2>
                    </div>
                </div>
                <div className="glass card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="icon-box icon-box-danger">
                        <UserMinus size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Nghỉ học tháng này</p>
                        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{leftThisMonth}</h2>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <div className="glass card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Lịch học bổ sung tuần này</h3>
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                            {monday.toLocaleDateString('vi-VN')} - {sunday.toLocaleDateString('vi-VN')}
                        </div>
                    </div>
                    <div className="table-container" style={{ overflowX: 'auto', background: 'transparent', padding: 0 }}>
                        <table style={{ borderCollapse: 'separate', borderSpacing: '0.4rem', width: '100%' }}>
                            <thead>
                                <tr>
                                    {dayNumbers.map(dayNum => (
                                        <th key={dayNum} style={{ textAlign: 'center', minWidth: '120px', padding: '0.5rem', fontSize: '0.8rem' }}>
                                            {dayLabelsMap[dayNum]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    {dayNumbers.map(dayNum => {
                                        const date = new Date(monday);
                                        date.setDate(monday.getDate() + (dayNum - 1));
                                        const dateStr = date.toISOString().split('T')[0];
                                        const attendees = (extraAttendance || [])
                                            .filter(a => a.date === dateStr)
                                            .map(a => {
                                                const student = students.find(s => s.id === a.studentId);
                                                return { ...a, studentName: student?.name || 'N/A' };
                                            });

                                        return (
                                            <td key={dayNum} style={{ verticalAlign: 'top', minHeight: '150px', padding: '0.25rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {attendees.map(a => (
                                                        <div key={a.id} className="glass card" style={{ padding: '0.6rem', fontSize: '0.75rem', borderLeft: '3px solid var(--secondary)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{a.studentName}</div>
                                                        </div>
                                                    ))}
                                                    {attendees.length === 0 && (
                                                        <div style={{ textAlign: 'center', opacity: 0.2, fontSize: '0.7rem', fontStyle: 'italic', marginTop: '1rem' }}>Trống</div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Danh sách lớp học</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {classes.map(c => {
                            const classStudents = students.filter(s => s.classId === c.id && s.status !== 'Đã nghỉ');
                            return (
                                <div
                                    key={c.id}
                                    className="glass card-hover"
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => navigate('/tuition', { state: { classId: c.id } })}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{c.name}</h4>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        {new Intl.NumberFormat('vi-VN').format(c.feePerSession)} đ/buổi
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={16} color="var(--primary)" />
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                            {classStudents.length} học viên
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
