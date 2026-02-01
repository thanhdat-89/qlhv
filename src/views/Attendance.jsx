import { useState } from 'react';
import { Plus, BadgeCheck, Calendar, User, Edit2, Trash2 } from 'lucide-react';
import AddAttendanceModal from '../components/AddAttendanceModal';

const Attendance = ({ db }) => {
    const { extraAttendance, students, actions } = db;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAttendance, setEditingAttendance] = useState(null);
    const [expandedNameId, setExpandedNameId] = useState(null);

    const toggleExpandName = (id) => {
        setExpandedNameId(expandedNameId === id ? null : id);
    };

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
                <h1>Điểm danh Học bổ sung</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Ghi nhận buổi học</button>
            </div>

            <div className="info-box glass" style={{ marginBottom: '2rem', padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="icon-box icon-box-primary" style={{ padding: '0.5rem', borderRadius: '8px' }}>
                        <BadgeCheck size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Hướng dẫn</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Phần này dùng để Điểm danh cho Học sinh học riêng có tính phí hoặc học bổ sung có tính phí, nhớ nhập học phí tương ứng của buổi học.
                            <br />
                            Đối với học sinh học bổ sung không tính phí có thể không điểm danh hoặc điểm danh để theo dõi nhớ ghi số học phí là 0 đồng.
                        </p>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <AddAttendanceModal
                    students={students}
                    onAdd={actions.addExtraAttendance}
                    onBulkAdd={actions.bulkAddExtraAttendance}
                    onUpdate={actions.updateExtraAttendance}
                    onClose={handleCloseModal}
                    initialData={editingAttendance}
                />
            )}

            <div className="table-container glass" onScroll={() => setExpandedNameId(null)}>
                <table>
                    <thead>
                        <tr>
                            <th className="sticky-date">Ngày</th>
                            <th>Thứ</th>
                            <th className="sticky-name-2">Học viên</th>
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
                                    <td className="sticky-date">{new Date(record.date).toLocaleDateString('vi-VN')}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                                        {(() => {
                                            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                            return days[new Date(record.date).getDay()];
                                        })()}
                                    </td>
                                    <td
                                        className={`sticky-name-2 ${expandedNameId === record.id ? 'expanded' : ''}`}
                                        style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                                        title={student?.name}
                                        onClick={() => toggleExpandName(record.id)}
                                    >
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
