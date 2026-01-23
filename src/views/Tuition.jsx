import { useState } from 'react';
import { Plus, CreditCard, Banknote, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import AddTuitionModal from '../components/AddTuitionModal';

const Tuition = ({ db }) => {
    const { fees, students, classes, actions } = db;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [viewMode, setViewMode] = useState('status'); // status, history

    const filteredStudents = selectedClassId === 'all'
        ? students
        : students.filter(s => s.classId === selectedClassId);

    const handleExport = () => {
        const dataToExport = filteredStudents.map(s => ({
            'Họ và tên': s.name,
            'Lớp': s.className,
            'Số điện thoại': s.phone || '',
            'Số buổi theo TKB': s.tuition.scheduledCount,
            'Học phí theo TKB': s.tuition.scheduledTuition,
            'Số buổi học bổ sung': s.tuition.extraCount,
            'Học phí học bổ sung': s.tuition.totalExtraFee,
            'Đã đóng': s.tuition.totalPaid,
            'Giảm giá': `${s.discountRate * 100}%`,
            'Học phí': s.tuition.tuitionDue,
            'Còn nợ': s.tuition.balance,
            'Trạng thái': s.tuition.status
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo học phí");

        XLSX.writeFile(workbook, `Bao_cao_hoc_phi_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getTuitionLabel = (status) => {
        return status === 'Đã hoàn thành'
            ? <span className="label label-success">{status}</span>
            : <span className="label label-warning">{status}</span>;
    };

    return (
        <div className="view-container">
            <div className="view-header">
                <h1>Quản Lý Thu Học Phí</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-glass" onClick={handleExport}><Download size={18} /> Xuất file</button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Thu học phí</button>
                </div>
            </div>

            {isModalOpen && (
                <AddTuitionModal
                    students={students}
                    onAdd={actions.addFee}
                    onClose={() => setIsModalOpen(false)}
                />
            )}

            <div className="glass" style={{ padding: '0.25rem', borderRadius: 'var(--radius)', display: 'flex', gap: '0.25rem', width: 'fit-content', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setViewMode('status')}
                    className={`btn ${viewMode === 'status' ? 'btn-primary' : ''}`}
                    style={{
                        padding: '0.6rem 1.5rem',
                        background: viewMode === 'status' ? '' : 'transparent',
                        color: viewMode === 'status' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                    }}
                >
                    Tình trạng thu phí
                </button>
                <button
                    onClick={() => setViewMode('history')}
                    className={`btn ${viewMode === 'history' ? 'btn-primary' : ''}`}
                    style={{
                        padding: '0.6rem 1.5rem',
                        background: viewMode === 'history' ? '' : 'transparent',
                        color: viewMode === 'history' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                    }}
                >
                    Lịch sử giao dịch
                </button>
            </div>

            {viewMode === 'status' && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Lọc theo lớp</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setSelectedClassId('all')}
                            className={`btn ${selectedClassId === 'all' ? 'btn-glass active' : 'btn-glass'}`}
                            style={{ border: selectedClassId === 'all' ? '1px solid var(--primary)' : '' }}
                        >
                            Tất cả lớp
                        </button>
                        {classes.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedClassId(c.id)}
                                className={`btn ${selectedClassId === c.id ? 'btn-glass active' : 'btn-glass'}`}
                                style={{ border: selectedClassId === c.id ? '1px solid var(--primary)' : '' }}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="table-container glass">
                {viewMode === 'status' ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Học viên</th>
                                <th>Lớp</th>
                                <th style={{ textAlign: 'center' }}>Số buổi theo TKB</th>
                                <th style={{ textAlign: 'right' }}>Học phí theo TKB</th>
                                <th style={{ textAlign: 'center' }}>Số buổi học bổ sung</th>
                                <th style={{ textAlign: 'right' }}>Học phí học bổ sung</th>
                                <th style={{ textAlign: 'right' }}>Đã đóng</th>
                                <th style={{ textAlign: 'center' }}>Giảm giá</th>
                                <th style={{ textAlign: 'right' }}>Học phí</th>
                                <th style={{ textAlign: 'right' }}>Còn nợ</th>
                                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ color: 'white', fontWeight: 500 }}>{s.name}</td>
                                    <td>{s.className}</td>
                                    <td style={{ textAlign: 'center' }}>{s.tuition.scheduledCount}</td>
                                    <td style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.scheduledTuition)} đ
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{s.tuition.extraCount}</td>
                                    <td style={{ color: 'var(--secondary)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.totalExtraFee)} đ
                                    </td>
                                    <td style={{ color: 'var(--success)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.totalPaid)} đ
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{s.discountRate * 100}%</td>
                                    <td style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.tuitionDue)} đ
                                    </td>
                                    <td style={{ color: s.tuition.balance > 0 ? 'var(--warning)' : 'var(--text-secondary)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.balance)} đ
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{getTuitionLabel(s.tuition.status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Ngày đóng</th>
                                <th>Học viên</th>
                                <th>Số tiền</th>
                                <th>Hình thức</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fees.map((f) => {
                                const student = students.find(s => s.id === f.studentId);
                                return (
                                    <tr key={f.id}>
                                        <td>{new Date(f.date).toLocaleDateString('vi-VN')}</td>
                                        <td style={{ color: 'white', fontWeight: 500 }}>{student?.name || 'N/A'}</td>
                                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                                            {new Intl.NumberFormat('vi-VN').format(f.amount)} đ
                                        </td>
                                        <td>
                                            <span className="label glass" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                                {f.method === 'Tiền mặt' ? <Banknote size={14} /> : <CreditCard size={14} />}
                                                {f.method}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Tuition;
