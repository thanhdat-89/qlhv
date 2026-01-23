import { useMemo, useState } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Filter, TrendingUp, Users, DollarSign } from 'lucide-react';

const Dashboard = ({ db }) => {
    const { students, fees, classes } = db;
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Filter students by category
    const filteredStudents = categoryFilter === 'All'
        ? students
        : students.filter(s => s.classCategory === categoryFilter);

    // Stats for cards
    const totalStudents = filteredStudents.length;
    const totalRevenue = fees.reduce((sum, f) => sum + f.amount, 0);
    const activeStudents = filteredStudents.filter(s => s.status === 'Đang học').length;

    // Chart: Tuition Payment Status
    const paymentStatusData = useMemo(() => {
        const completed = filteredStudents.filter(s => s.tuition.status === 'Đã hoàn thành').length;
        const pending = filteredStudents.filter(s => s.tuition.status === 'Còn nợ').length;
        return [
            { name: 'Đã hoàn thành', value: completed },
            { name: 'Còn nợ', value: pending }
        ];
    }, [filteredStudents]);

    // Chart: Monthly Revenue
    const revenueData = useMemo(() => {
        const monthly = fees.reduce((acc, f) => {
            const month = new Date(f.date).toLocaleString('vi-VN', { month: 'short' });
            acc[month] = (acc[month] || 0) + f.amount;
            return acc;
        }, {});
        return Object.keys(monthly).map(key => ({ name: key, revenue: monthly[key] }));
    }, [fees]);

    const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e'];

    return (
        <div className="view-container">
            <div className="view-header">
                <h1>Tổng Quan</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="glass" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Filter size={18} color="var(--text-secondary)" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                        >
                            <option value="All">Tất cả hệ lớp</option>
                            <option value="Cơ bản">Cơ bản</option>
                            <option value="Cánh diều">Cánh diều</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', color: 'var(--primary)' }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Tổng học viên</p>
                        <h2 style={{ fontSize: '1.75rem' }}>{totalStudents}</h2>
                    </div>
                </div>
                <div className="glass card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.15)', borderRadius: '12px', color: 'var(--success)' }}>
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Đang học</p>
                        <h2 style={{ fontSize: '1.75rem' }}>{activeStudents}</h2>
                    </div>
                </div>
                <div className="glass card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '12px', color: 'var(--secondary)' }}>
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Doanh thu</p>
                        <h2 style={{ fontSize: '1.75rem' }}>{new Intl.NumberFormat('vi-VN').format(totalRevenue)} đ</h2>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="glass card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Tình trạng thu học phí</h3>
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#f59e0b" />
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                    }}
                                    itemStyle={{ color: '#ffffff', fontWeight: '500' }}
                                    labelStyle={{ color: '#e2e8f0', marginBottom: '4px' }}
                                    formatter={(value) => [`${value} học viên`, 'Số lượng']}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span style={{ color: 'var(--text-primary)' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Doanh thu theo tháng</h3>
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tick={{ fill: 'var(--text-primary)' }}
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tick={{ fill: 'var(--text-primary)' }}
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-dark)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: 'white'
                                    }}
                                    formatter={(value) => [new Intl.NumberFormat('vi-VN').format(value) + ' đ', 'Doanh thu']}
                                    labelStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="var(--primary)"
                                    radius={[8, 8, 0, 0]}
                                    label={{ position: 'top', fill: 'var(--text-primary)', fontSize: 11, formatter: (value) => `${(value / 1000000).toFixed(1)}M` }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Danh sách lớp học</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {classes.map(c => {
                        const classStudents = filteredStudents.filter(s => s.classId === c.id);
                        return (
                            <div key={c.id} className="glass" style={{ padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <h4 style={{ fontSize: '1rem', color: 'white' }}>{c.name}</h4>
                                    <span className={`label ${c.category === 'Cơ bản' ? 'label-primary' : 'label-warning'}`} style={{ fontSize: '0.7rem' }}>
                                        {c.category}
                                    </span>
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
    );
};

export default Dashboard;
