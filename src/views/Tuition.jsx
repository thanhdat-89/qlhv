import { useState, useEffect } from 'react';
import { Plus, CreditCard, Banknote, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import AddTuitionModal from '../components/AddTuitionModal';

const Tuition = ({ db, initialParams }) => {
    const { fees, students, classes, actions } = db;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [viewMode, setViewMode] = useState('status'); // status, history
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [preSelectedStudentId, setPreSelectedStudentId] = useState(null);

    // Initial filter from navigation
    useEffect(() => {
        if (initialParams?.classId) {
            setSelectedClassId(initialParams.classId);
            setViewMode('status');
        }
    }, [initialParams]);

    const handleOpenModal = (studentId = null) => {
        setPreSelectedStudentId(studentId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setPreSelectedStudentId(null);
    };

    const filteredStudents = students
        .filter(s => selectedClassId === 'all' || String(s.classId) === String(selectedClassId))
        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(s => selectedStatus === 'all' || s.tuition.status === selectedStatus)
        .sort((a, b) => a.className.localeCompare(b.className));

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
            'Giảm giá học viên': `${s.discountRate * 100}%`,
            'Khuyến mãi lớp': `${(s.tuition.promotionDiscount || 0) * 100}%`,
            'Học phí tháng này': s.tuition.tuitionDue,
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
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}><Plus size={18} /> Thu học phí</button>
                </div>
            </div>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên học viên..."
                    className="glass"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {isModalOpen && (
                <AddTuitionModal
                    students={students}
                    onAdd={actions.addFee}
                    onClose={handleCloseModal}
                    preSelectedStudentId={preSelectedStudentId}
                />
            )}

            <div className="tab-group">
                <button
                    onClick={() => setViewMode('status')}
                    className={`tab-item ${viewMode === 'status' ? 'active' : ''}`}
                >
                    Tình trạng thu phí
                </button>
                <button
                    onClick={() => setViewMode('history')}
                    className={`tab-item ${viewMode === 'history' ? 'active' : ''}`}
                >
                    Lịch sử giao dịch
                </button>
            </div>

            {viewMode === 'status' && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <label className="form-label">Lọc theo lớp</label>
                        <div className="filter-group hide-mobile">
                            <button
                                onClick={() => setSelectedClassId('all')}
                                className={`btn btn-glass filter-item ${selectedClassId === 'all' ? 'active' : ''}`}
                            >
                                Tất cả lớp
                            </button>
                            {classes.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedClassId(c.id)}
                                    className={`btn btn-glass filter-item ${selectedClassId === c.id ? 'active' : ''}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                        <div className="show-mobile">
                            <select
                                className="glass"
                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                <option value="all">Tất cả lớp</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Lọc theo trạng thái</label>
                        <div className="filter-group">
                            <button
                                onClick={() => setSelectedStatus('all')}
                                className={`btn btn-glass filter-item ${selectedStatus === 'all' ? 'active' : ''}`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setSelectedStatus('Còn nợ')}
                                className={`btn btn-glass filter-item ${selectedStatus === 'Còn nợ' ? 'active' : ''}`}
                            >
                                Còn nợ
                            </button>
                            <button
                                onClick={() => setSelectedStatus('Đã hoàn thành')}
                                className={`btn btn-glass filter-item ${selectedStatus === 'Đã hoàn thành' ? 'active' : ''}`}
                            >
                                Đã hoàn thành
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-container glass">
                {viewMode === 'status' ? (
                    <table>
                        <thead>
                            <tr>
                                <th className="sticky-col">Học viên</th>
                                <th>Lớp</th>
                                <th className="hide-mobile" style={{ textAlign: 'center' }}>Số buổi theo TKB</th>
                                <th className="hide-mobile" style={{ textAlign: 'right' }}>Học phí theo TKB</th>
                                <th className="hide-mobile" style={{ textAlign: 'center' }}>Số buổi học bổ sung</th>
                                <th className="hide-mobile" style={{ textAlign: 'right' }}>Học phí học bổ sung</th>
                                <th className="hide-mobile" style={{ textAlign: 'right' }}>Đã đóng</th>
                                <th className="hide-mobile" style={{ textAlign: 'center' }}>Giảm giá (HV)</th>
                                <th className="hide-mobile" style={{ textAlign: 'center' }}>Khuyến mãi (Lớp)</th>
                                <th style={{ textAlign: 'right' }}>Học phí tháng này</th>
                                <th style={{ textAlign: 'right' }}>Còn nợ</th>
                                <th className="hide-mobile" style={{ textAlign: 'center' }}>Trạng thái</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((s) => (
                                <tr key={s.id}>
                                    <td className="sticky-col" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td>
                                    <td>{s.className}</td>
                                    <td className="hide-mobile" style={{ textAlign: 'center' }}>{s.tuition.scheduledCount}</td>
                                    <td className="hide-mobile" style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.scheduledTuition)} đ
                                    </td>
                                    <td className="hide-mobile" style={{ textAlign: 'center' }}>{s.tuition.extraCount}</td>
                                    <td className="hide-mobile" style={{ color: 'var(--secondary)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.totalExtraFee)} đ
                                    </td>
                                    <td className="hide-mobile" style={{ color: 'var(--success)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.totalPaid)} đ
                                    </td>
                                    <td className="hide-mobile" style={{ textAlign: 'center' }}>{s.discountRate * 100}%</td>
                                    <td className="hide-mobile" style={{ textAlign: 'center' }}>
                                        {s.tuition.promotionDiscount > 0 ? (
                                            <span className="label label-success" style={{ fontSize: '0.75rem' }}>
                                                -{s.tuition.promotionDiscount * 100}%
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.tuitionDue)} đ
                                    </td>
                                    <td style={{ color: s.tuition.balance > 0 ? 'var(--warning)' : 'var(--text-secondary)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.balance)} đ
                                    </td>
                                    <td className="hide-mobile" style={{ textAlign: 'center' }}>{getTuitionLabel(s.tuition.status)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{
                                                padding: '0.45rem 1rem',
                                                background: 'var(--primary)',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.85rem'
                                            }}
                                            onClick={() => handleOpenModal(s.id)}
                                            title="Thu học phí"
                                        >
                                            <Banknote size={18} />
                                            <span>Thu phí</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th className="sticky-col">Ngày đóng</th>
                                <th className="sticky-col-2">Học viên</th>
                                <th>Số tiền</th>
                                <th>Hình thức</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fees.map((f) => {
                                const student = students.find(s => s.id === f.studentId);
                                return (
                                    <tr key={f.id}>
                                        <td className="sticky-col">{new Date(f.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="sticky-col-2" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{student?.name || 'N/A'}</td>
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
