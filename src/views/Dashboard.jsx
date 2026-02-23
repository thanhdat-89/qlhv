import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Filter, TrendingUp, Users, DollarSign, BadgeCheck, UserMinus } from 'lucide-react';

const Dashboard = ({ db }) => {
    const navigate = useNavigate();
    const { students, fees, classes } = db;
    // Stats for cards
    const studyingStudents = students.filter(s => s.status === 'Đang học' || s.status === 'Mới nhập học').length;
    const totalRevenue = fees.reduce((sum, f) => sum + f.amount, 0);
    const newStudents = students.filter(s => s.status === 'Mới nhập học').length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
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
                {/* <div className="glass card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="icon-box icon-box-secondary">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Doanh thu</p>
                        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{new Intl.NumberFormat('vi-VN').format(totalRevenue)} đ</h2>
                    </div>
                </div> */}
            </div>

            <div className="glass card">
                <h3 style={{ marginBottom: '1.5rem' }}>Danh sách lớp học</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {classes.map(c => {
                        const classStudents = students.filter(s => s.classId === c.id && s.status !== 'Đã nghỉ');
                        const debtCount = classStudents.filter(s => (s.tuition.balance || 0) > 0).length;
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={16} color="var(--primary)" />
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                            {classStudents.length} học viên
                                        </span>
                                    </div>
                                    {/* {debtCount > 0 ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' }}>!</div>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--danger)', fontWeight: 600 }}>
                                                {debtCount} còn nợ
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <BadgeCheck size={16} color="var(--success)" />
                                            <span style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: 600 }}>
                                                Đã hoàn thành
                                            </span>
                                        </div>
                                    )} */}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
