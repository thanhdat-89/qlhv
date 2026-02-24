import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, CreditCard, Banknote, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import AddTuitionModal from '../components/AddTuitionModal';

const Tuition = ({ db }) => {
    const location = useLocation();
    const { fees, students, classes, actions } = db;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [viewMode, setViewMode] = useState('status'); // status, history
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [preSelectedStudentId, setPreSelectedStudentId] = useState(null);
    const [expandedNameId, setExpandedNameId] = useState(null);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const goToCurrentMonth = () => {
        setSelectedMonth(new Date().getMonth());
        setSelectedYear(new Date().getFullYear());
    };

    const toggleExpandName = (id) => {
        setExpandedNameId(expandedNameId === id ? null : id);
    };

    // Initial filter from navigation state
    useEffect(() => {
        if (location.state?.classId) {
            setSelectedClassId(location.state.classId);
            setViewMode('status');
        }
    }, [location.state]);

    const handleOpenModal = (studentId = null) => {
        setPreSelectedStudentId(studentId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setPreSelectedStudentId(null);
    };

    // Recalculate tuition details based on selected month/year
    const studentsWithMonthlyTuition = useMemo(() => {
        return students.map(s => ({
            ...s,
            tuition: actions.getStudentTuitionDetails(s.id, selectedMonth, selectedYear)
        }));
    }, [students, actions, selectedMonth, selectedYear]);

    const filteredStudents = studentsWithMonthlyTuition
        .filter(s => {
            // Check if the student left before the selected month
            let effectiveLeaveDate = s.leaveDate ? new Date(s.leaveDate) : null;
            if (s.status === 'Đã nghỉ' && !effectiveLeaveDate && s.statusHistory) {
                const leaveEvent = [...s.statusHistory].reverse().find(h => h.status === 'Đã nghỉ');
                if (leaveEvent) effectiveLeaveDate = new Date(leaveEvent.date);
            }
            if (effectiveLeaveDate) {
                const monthStart = new Date(selectedYear, selectedMonth, 1);
                monthStart.setHours(0, 0, 0, 0);
                if (effectiveLeaveDate < monthStart) return false;
            }
            return true;
        })
        .filter(s => selectedClassId === 'all' || String(s.classId) === String(selectedClassId))
        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(s => selectedStatus === 'all' || s.tuition.status === selectedStatus)
        .sort((a, b) => a.className.localeCompare(b.className));

    const handleExport = () => {
        const dataToExport = filteredStudents.map(s => ({
            'Họ và tên': s.name,
            'Lớp': s.className,
            'Số điện thoại': s.phone || '',
            'Số buổi học chung': s.tuition.scheduledCount,
            'Học phí học chung': s.tuition.scheduledTuition,
            'Số buổi học riêng': s.tuition.extraCount,
            'Học phí học riêng': s.tuition.totalExtraFee,
            'Giảm giá học viên': `${s.discountRate * 100}%`,
            'Khuyến mãi lớp': `${(s.tuition.promotionDiscount || 0) * 100}%`,
            [`Học phí tháng ${selectedMonth + 1}`]: s.tuition.tuitionDue
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
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="tab-group" style={{ margin: 0 }}>
                        <button
                            className={`tab-item ${viewMode === 'status' ? 'active' : ''}`}
                            onClick={() => setViewMode('status')}
                        >
                            Tình trạng thu phí
                        </button>
                        <button
                            className={`tab-item ${viewMode === 'history' ? 'active' : ''}`}
                            onClick={() => setViewMode('history')}
                        >
                            Lịch sử giao dịch
                        </button>
                    </div>
                    <button className="btn btn-glass" onClick={handleExport}><Download size={18} /> Xuất file</button>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}><Plus size={18} /> Thu học phí</button>
                </div>
            </div>

            {isModalOpen && (
                <AddTuitionModal
                    students={students}
                    onAdd={actions.addFee}
                    onClose={handleCloseModal}
                    preSelectedStudentId={preSelectedStudentId}
                />
            )}

            {viewMode === 'status' && (
                <div className="glass card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1.5rem',
                        alignItems: 'end',
                        marginBottom: '1.5rem'
                    }}>
                        <div className="search-container" style={{ margin: 0, maxWidth: 'none' }}>
                            <label className="form-label">Tìm kiếm học viên</label>
                            <input
                                type="text"
                                className="glass"
                                placeholder="Tìm kiếm theo tên học viên..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="form-label">Chọn tháng thống kê</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <select
                                    className="glass"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    style={{ flex: 1 }}
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i} value={i}>Tháng {i + 1}</option>
                                    ))}
                                </select>
                                <select
                                    className="glass"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    style={{ flex: 1 }}
                                >
                                    {[2024, 2025, 2026, 2027].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-glass"
                                    onClick={goToCurrentMonth}
                                    style={{ whiteSpace: 'nowrap', padding: '0.75rem 1rem' }}
                                >
                                    Hiện tại
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Lọc theo lớp</label>
                        <div className="filter-group" style={{ marginBottom: 0 }}>
                            <button
                                onClick={() => setSelectedClassId('all')}
                                className={`btn btn-glass filter-item ${selectedClassId === 'all' ? 'active' : ''}`}
                            >
                                Tất cả lớp
                            </button>
                            {[...classes].sort((a, b) => {
                                const gradeA = a.name.match(/Toán (\d+)/);
                                const gradeB = b.name.match(/Toán (\d+)/);
                                if (gradeA && gradeB) {
                                    const numA = parseInt(gradeA[1]);
                                    const numB = parseInt(gradeB[1]);
                                    if (numA !== numB) return numA - numB;
                                    return a.name.localeCompare(b.name, 'vi');
                                }
                                if (gradeA) return -1;
                                if (gradeB) return 1;
                                return a.name.localeCompare(b.name, 'vi');
                            }).map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedClassId(c.id)}
                                    className={`btn btn-glass filter-item ${String(selectedClassId) === String(c.id) ? 'active' : ''}`}
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
                                {[...classes].sort((a, b) => {
                                    // Extract grade number from class name (e.g., "Toán 10 (CQT 02)" -> 10)
                                    const gradeA = a.name.match(/Toán (\d+)/);
                                    const gradeB = b.name.match(/Toán (\d+)/);

                                    // If both are math classes with grade numbers, sort by grade
                                    if (gradeA && gradeB) {
                                        const numA = parseInt(gradeA[1]);
                                        const numB = parseInt(gradeB[1]);
                                        if (numA !== numB) return numA - numB;
                                        // If same grade, sort by class code (CQT 01, CQT 02, etc.)
                                        return a.name.localeCompare(b.name, 'vi');
                                    }

                                    // If only one is a math class, math classes come first
                                    if (gradeA) return -1;
                                    if (gradeB) return 1;

                                    // Otherwise, sort alphabetically
                                    return a.name.localeCompare(b.name, 'vi');
                                }).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'status' && (
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem', marginTop: '1rem' }}>
                    Học phí Tháng {selectedMonth + 1} năm {selectedYear}
                </h2>
            )}

            <div className="table-container glass" onScroll={() => setExpandedNameId(null)}>
                {viewMode === 'status' ? (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                                <th className="sticky-col">Học viên</th>
                                <th>Lớp</th>
                                <th className="hide-mobile" style={{ textAlign: 'center' }}>Số buổi học chung</th>
                                <th className="hide-mobile" style={{ textAlign: 'right' }}>Học phí học chung</th>
                                <th className="hide-mobile" style={{ textAlign: 'center' }}>Số buổi học riêng</th>
                                <th className="hide-mobile" style={{ textAlign: 'right' }}>Học phí học riêng</th>
                                <th className="hide-mobile" style={{ textAlign: 'center' }}>Giảm giá (HV)</th>
                                <th className="hide-mobile" style={{ textAlign: 'center' }}>Khuyến mãi (Lớp)</th>
                                <th style={{ textAlign: 'right' }}>Học phí tháng {selectedMonth + 1}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((s, index) => (
                                <tr key={s.id}>
                                    <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                        {index + 1}
                                    </td>
                                    <td
                                        className={`sticky-col ${expandedNameId === s.id ? 'expanded' : ''}`}
                                        style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                                        title={s.name}
                                        onClick={() => toggleExpandName(s.id)}
                                    >
                                        {s.name}
                                    </td>
                                    <td className="uppercase-class">{s.className}</td>
                                    <td className="hide-mobile" style={{ textAlign: 'center' }}>{s.tuition.scheduledCount}</td>
                                    <td className="hide-mobile" style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.scheduledTuition)} đ
                                    </td>
                                    <td className="hide-mobile" style={{ textAlign: 'center' }}>
                                        {s.tuition.extraCount}
                                    </td>
                                    <td className="hide-mobile" style={{ color: 'var(--secondary)', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('vi-VN').format(s.tuition.totalExtraFee)} đ
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                                <th className="sticky-date">Ngày đóng</th>
                                <th className="sticky-name-2">Học viên</th>
                                <th>Số tiền</th>
                                <th>Hình thức</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fees.map((f, index) => {
                                const student = students.find(s => s.id === f.studentId);
                                return (
                                    <tr key={f.id}>
                                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                            {index + 1}
                                        </td>
                                        <td className="sticky-date">{new Date(f.date).toLocaleDateString('vi-VN')}</td>
                                        <td
                                            className={`sticky-name-2 ${expandedNameId === f.id ? 'expanded' : ''}`}
                                            style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                                            title={student?.name}
                                            onClick={() => toggleExpandName(f.id)}
                                        >
                                            {student?.name || 'N/A'}
                                        </td>
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
