import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, ShieldAlert, Coffee } from 'lucide-react';
import AddHolidayModal from '../components/AddHolidayModal';

const Schedule = ({ db }) => {
    const { classes, holidays, actions } = db;
    const [activeTab, setActiveTab] = useState('schedule');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const periods = [
        { id: 'morning', label: 'Sáng' },
        { id: 'afternoon', label: 'Chiều' },
        { id: 'evening', label: 'Tối' }
    ];

    const getClassesForSlot = (period, day) => {
        return (classes || []).filter(c => c.schedule && c.schedule[period] && c.schedule[period].includes(day));
    };

    return (
        <div className="view-container">
            <div className="view-header" style={{ marginBottom: '1rem' }}>
                <h1>Quản Lý Lịch Trình</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-glass'}`}
                        onClick={() => setActiveTab('schedule')}
                    >
                        Lịch học tổng hợp
                    </button>
                    <button
                        className={`btn ${activeTab === 'holidays' ? 'btn-primary' : 'btn-glass'}`}
                        onClick={() => setActiveTab('holidays')}
                    >
                        Lịch nghỉ / Nghỉ lễ
                    </button>
                </div>
            </div>

            {activeTab === 'schedule' ? (
                <div className="table-container glass" style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'separate', borderSpacing: '0.5rem' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '100px', background: 'transparent' }}></th>
                                {days.map(day => (
                                    <th key={day} style={{ textAlign: 'center', minWidth: '120px' }}>{day}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map(period => (
                                <tr key={period.id}>
                                    <td style={{
                                        fontWeight: 600,
                                        color: 'var(--primary)',
                                        verticalAlign: 'middle',
                                        textAlign: 'center',
                                        background: 'rgba(var(--primary-rgb), 0.1)',
                                        borderRadius: '8px'
                                    }}>
                                        {period.label}
                                    </td>
                                    {days.map(day => {
                                        const slotClasses = getClassesForSlot(period.id, day);
                                        return (
                                            <td key={day} style={{ verticalAlign: 'top', height: '120px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    {slotClasses.map(c => (
                                                        <div
                                                            key={c.id}
                                                            className="glass card"
                                                            style={{
                                                                padding: '0.5rem',
                                                                fontSize: '0.8rem',
                                                                borderLeft: `3px solid ${c.category === 'Cơ bản' ? 'var(--primary)' : 'var(--warning)'}`,
                                                                animation: 'fadeIn 0.3s ease'
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: 600, color: 'white' }}>{c.name}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                                {c.category}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {slotClasses.length === 0 && (
                                                        <div style={{
                                                            height: '100%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'rgba(255,255,255,0.05)',
                                                            fontSize: '0.7rem'
                                                        }}>
                                                            Trống
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="holidays-view">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', color: 'white' }}>Danh sách ngày nghỉ</h2>
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                            <Plus size={18} /> Thêm ngày nghỉ
                        </button>
                    </div>

                    <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {holidays && holidays.length > 0 ? (
                            holidays.map(h => (
                                <div key={h.id} className="glass card" style={{ padding: '1.25rem', position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                        <div style={{
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            background: h.type === 'Nghỉ Lễ' ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(var(--danger-rgb), 0.15)',
                                            color: h.type === 'Nghỉ Lễ' ? 'var(--primary)' : 'var(--danger)'
                                        }}>
                                            {h.type === 'Nghỉ Lễ' ? <Coffee size={24} /> : <ShieldAlert size={24} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'white', fontSize: '1.1rem' }}>
                                                {h.date ? (
                                                    h.endDate && h.endDate !== h.date ? (
                                                        `${new Date(h.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${new Date(h.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                                                    ) : (
                                                        new Date(h.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                                    )
                                                ) : 'N/A'}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {h.type || 'Nghỉ Lễ'}
                                                {h.classId && ` - ${classes.find(c => c.id === h.classId)?.name || 'Lớp đã xóa'}`}
                                            </div>
                                        </div>
                                    </div>
                                    {h.description && (
                                        <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{h.description}</p>
                                    )}
                                    <button
                                        onClick={() => actions.deleteHoliday(h.id)}
                                        style={{
                                            position: 'absolute', right: '1rem', top: '1rem',
                                            background: 'rgba(255,59,48,0.1)', border: 'none', borderRadius: '8px',
                                            padding: '0.5rem', color: 'var(--danger)', cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="glass card" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                                <CalendarIcon size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.3 }} />
                                <p style={{ color: 'var(--text-secondary)' }}>Chưa có lịch nghỉ nào được ghi nhận.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isModalOpen && (
                <AddHolidayModal
                    onAdd={actions.addHoliday}
                    onClose={() => setIsModalOpen(false)}
                    classes={classes}
                />
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .table-container td { padding: 0.5rem; }
            `}</style>
        </div>
    );
};

export default Schedule;
