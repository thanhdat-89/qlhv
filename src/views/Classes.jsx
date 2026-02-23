import { useState } from 'react';
import { Plus, Edit2, Trash2, BadgeCheck } from 'lucide-react';
import AddClassModal from '../components/AddClassModal';

const Classes = ({ db }) => {
    const { classes, students, actions } = db;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);

    const handleEdit = (cls) => {
        setEditingClass(cls);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClass(null);
    };

    const renderSchedule = (schedule) => {
        const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {['morning', 'afternoon', 'evening'].map(period => (
                    <div key={period} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '50px', fontWeight: 500 }}>
                            {period === 'morning' ? 'Sáng' : period === 'afternoon' ? 'Chiều' : 'Tối'}:
                        </span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {days.map(day => (
                                <span
                                    key={day}
                                    className="label"
                                    style={{
                                        padding: '2px 8px',
                                        fontSize: '0.7rem',
                                        background: schedule[period].includes(day) ? 'var(--primary)' : '#f1f5f9',
                                        color: schedule[period].includes(day) ? 'white' : 'var(--text-secondary)',
                                        opacity: schedule[period].includes(day) ? 1 : 0.5,
                                        width: '32px',
                                        textAlign: 'center'
                                    }}
                                >
                                    {day}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="view-container">
            <div className="view-header">
                <h1>Danh Mục Lớp Học</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Tạo lớp mới</button>
            </div>

            {isModalOpen && (
                <AddClassModal
                    onAdd={actions.addClass}
                    onUpdate={actions.updateClass}
                    onClose={handleCloseModal}
                    initialData={editingClass}
                />
            )}

            <div className="table-container glass">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên lớp</th>
                            <th style={{ textAlign: 'right' }}>Học phí/buổi</th>
                            {/* <th style={{ textAlign: 'center' }}>Hệ số nợ (HV nợ)</th> */}
                            <th>Thời khóa biểu dự kiến</th>
                            <th style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.map((c) => (
                            <tr key={c.id}>
                                <td>{c.id}</td>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</td>
                                <td style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                                    {new Intl.NumberFormat('vi-VN').format(c.feePerSession)} đ
                                </td>
                                {/* <td style={{ textAlign: 'center' }}>
                                    {(() => {
                                        const debtCount = students.filter(s => s.classId === c.id && (s.tuition.balance || 0) > 0).length;
                                        return debtCount > 0 ? (
                                            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{debtCount} H/V</span>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--success)', fontWeight: 600 }}>
                                                <BadgeCheck size={14} /> Đã hoàn thành
                                            </div>
                                        );
                                    })()}
                                </td> */}
                                <td style={{ padding: '0.75rem 1rem' }}>{renderSchedule(c.schedule)}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleEdit(c)}
                                            className="btn btn-glass" style={{ padding: '0.4rem', borderRadius: '8px', border: 'none' }}
                                        >
                                            <Edit2 size={16} color="var(--primary)" />
                                        </button>
                                        <button
                                            onClick={() => actions.deleteClass(c.id)}
                                            className="btn btn-glass" style={{ padding: '0.4rem', borderRadius: '8px', border: 'none' }}
                                        >
                                            <Trash2 size={16} color="var(--danger)" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Classes;
