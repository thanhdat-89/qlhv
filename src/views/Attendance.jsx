import { useState } from 'react';
import { Plus, BadgeCheck, Calendar, User, Edit2, Trash2 } from 'lucide-react';
import AddAttendanceModal from '../components/AddAttendanceModal';

const Attendance = ({ db }) => {
    const { extraAttendance, students, actions } = db;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAttendance, setEditingAttendance] = useState(null);

    const handleEdit = (record) => {
        setEditingAttendance(record);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAttendance(null);
    };

    return (
        <div className="view-container">
            <div className="view-header">
                <h1>Điểm Danh Học Bổ Sung</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Ghi nhận buổi học</button>
            </div>

            {isModalOpen && (
                <AddAttendanceModal
                    students={students}
                    onAdd={actions.addExtraAttendance}
                    onUpdate={actions.updateExtraAttendance}
                    onClose={handleCloseModal}
                    initialData={editingAttendance}
                />
            )}

            <div className="table-container glass">
                <table>
                    <thead>
                        <tr>
                            <th className="sticky-col">Ngày</th>
                            <th className="sticky-col-2">Học viên</th>
                            <th style={{ textAlign: 'right' }}>Học phí</th>
                            <th style={{ textAlign: 'center' }}>Trạng thái</th>
                            <th>Ghi chú</th>
                            <th style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {extraAttendance.map((record) => {
                            const student = students.find(s => s.id === record.studentId);
                            return (
                                <tr key={record.id}>
                                    <td className="sticky-col">{new Date(record.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="sticky-col-2" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                        {student?.name || 'N/A'}
                                    </td>
                                    <td style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(record.fee || 0)} đ
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {record.status ? (
                                            <span className="label label-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', margin: '0 auto' }}>
                                                <BadgeCheck size={14} /> Hiện diện
                                            </span>
                                        ) : record.isExcused ? (
                                            <span className="label label-warning" style={{ display: 'inline-block', background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }}>
                                                Xin nghỉ
                                            </span>
                                        ) : (
                                            <span className="label label-danger" style={{ display: 'inline-block' }}>Vắng mặt</span>
                                        )}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{record.notes || '-'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleEdit(record)}
                                                className="btn btn-glass" style={{ padding: '0.4rem', borderRadius: '8px', border: 'none' }}
                                            >
                                                <Edit2 size={16} color="var(--primary)" />
                                            </button>
                                            <button
                                                onClick={() => actions.deleteExtraAttendance(record.id)}
                                                className="btn btn-glass" style={{ padding: '0.4rem', borderRadius: '8px', border: 'none' }}
                                            >
                                                <Trash2 size={16} color="var(--danger)" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Attendance;
