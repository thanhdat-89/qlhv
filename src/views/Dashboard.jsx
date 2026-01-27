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

    const COLORS = ['var(--primary)', 'var(--secondary)', 'var(--warning)', 'var(--success)'];

    return (
        <div className="view-container">
            <div className="view-header">
                <h1>Tổng Quan</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="glass" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Filter size={18} color="var(--text-secondary)" />
                        <select
                            className="glass"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{ background: 'transparent', border: 'none', padding: 0 }}
                        >
                            <option value="All">Tất cả hệ lớp</option>
                            <option value="Cơ bản">Cơ bản</option>
                            <option value="Cánh diều">Cánh diều</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="glass card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="icon-box icon-box-primary">
                        <Users size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Tổng học viên</p>
                        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{totalStudents}</h2>
                    </div>
                </div>
                <div className="glass card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="icon-box icon-box-success">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Đang học</p>
                        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{activeStudents}</h2>
                    </div>
                </div>
                <div className="glass card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="icon-box icon-box-secondary">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Doanh thu</p>
                        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{new Intl.NumberFormat('vi-VN').format(totalRevenue)} đ</h2>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="glass card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Tình trạng thu học phí</h3>
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="var(--success)" stroke="none" />
                                    <Cell fill="var(--warning)" stroke="none" />
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        backdropFilter: 'blur(4px)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px' }}
                                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}
                                    formatter={(value) => [`${value} học viên`, 'Số lượng']}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Doanh thu theo tháng</h3>
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tick={{ fill: 'var(--text-secondary)' }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tick={{ fill: 'var(--text-secondary)' }}
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        backdropFilter: 'blur(4px)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px' }}
                                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}
                                    formatter={(value) => [new Intl.NumberFormat('vi-VN').format(value) + ' đ', 'Doanh thu']}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="var(--primary)"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={50}
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
                                    <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{c.name}</h4>
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
