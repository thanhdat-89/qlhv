import { useState } from 'react';
import { Plus, Filter, Download, UserMinus, UserCheck, Edit2, Trash2, Upload, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import AddStudentModal from '../components/AddStudentModal';
import ImportStudentsModal from '../components/ImportStudentsModal';
import AddAttendanceModal from '../components/AddAttendanceModal';

const Students = ({ db }) => {
    const { students, views, classes, actions } = db;
    const [filterMode, setFilterMode] = useState('all'); // all, new, left
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list'); // list, history
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [preSelectedStudentId, setPreSelectedStudentId] = useState(null);
    const [expandedNameId, setExpandedNameId] = useState(null);

    const toggleExpandName = (id) => {
        setExpandedNameId(expandedNameId === id ? null : id);
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleOpenAttendanceModal = (studentId) => {
        setPreSelectedStudentId(studentId);
        setIsAttendanceModalOpen(true);
    };

    const handleCloseAttendanceModal = () => {
        setIsAttendanceModalOpen(false);
        setPreSelectedStudentId(null);
    };

    const handleExport = () => {
        const dataToExport = displayStudents().map(s => ({
            'Họ và tên': s.name,
            'Lớp': s.className,
            'Năm sinh': s.birthYear,
            'Số điện thoại': s.phone || '',
            'Ngày nhập học': new Date(s.enrollDate).toLocaleDateString('vi-VN'),
            'Trạng thái': s.status,
            'Học phí tháng này': s.tuition.tuitionDue,
            'Tình trạng học phí': s.tuition.status
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách học viên");

        // Export the file
        XLSX.writeFile(workbook, `Danh_sach_hoc_vien_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const displayStudents = () => {
        let filtered = students;

        // Apply status filter
        if (filterMode === 'new') filtered = views.newStudents;
        else if (filterMode === 'left') filtered = views.leftStudents;

        // Apply class filter
        if (selectedClassId !== 'all') {
            filtered = filtered.filter(s => String(s.classId) === String(selectedClassId));
        }

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    // Generate change history list
    const statusChangeHistory = [];
    const sourceStudents = db.allStudents || students;
    sourceStudents.forEach(s => {
        if (s.statusHistory && s.statusHistory.length > 0) {
            s.statusHistory.forEach((historyItem, index) => {
                let content = historyItem.content || `Cập nhật trạng thái thành: ${historyItem.status}`;
                if (index === 0 && !historyItem.content) content = `Thêm mới học viên, trạng thái: ${historyItem.status}`;
                statusChangeHistory.push({
                    id: s.id + '-' + historyItem.date,
                    studentId: s.id,
                    name: s.name,
                    className: s.className,
                    birthYear: s.birthYear,
                    status: historyItem.status,
                    changeDate: historyItem.date,
                    content: content
                });
            });
        } else {
            // Fallback for students without history
            statusChangeHistory.push({
                id: s.id + '-fallback',
                studentId: s.id,
                name: s.name,
                className: s.className,
                birthYear: s.birthYear,
                status: s.status,
                changeDate: s.enrollDate,
                content: `Thêm mới học viên, trạng thái: ${s.status}`
            });
        }
    });

    statusChangeHistory.sort((a, b) => new Date(b.changeDate) - new Date(a.changeDate));

    const getStatusLabel = (student) => {
        const badge = (() => {
            switch (student.status) {
                case 'Đang học': return <span className="label label-success">{student.status}</span>;
                case 'Mới nhập học': return <span className="label label-primary">{student.status}</span>;
                case 'Đã nghỉ': return <span className="label label-danger">{student.status}</span>;
                default: return <span className="label glass">{student.status}</span>;
            }
        })();

        if (student.status === 'Đã nghỉ' && student.leaveDate) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    {badge}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        Nghỉ: {new Date(student.leaveDate).toLocaleDateString('vi-VN')}
                    </span>
                </div>
            );
        }

        return badge;
    };

    return (
        <div className="view-container">
            <div className="view-header">
                <h1>Danh Sách Học Viên</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-glass" onClick={() => setIsImportModalOpen(true)}><Upload size={18} /> Nhập file</button>
                    <button className="btn btn-glass" onClick={handleExport}><Download size={18} /> Xuất file</button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Thêm học viên</button>
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
                <AddStudentModal
                    classes={classes}
                    onAdd={actions.addStudent}
                    onUpdate={actions.updateStudent}
                    onClose={handleCloseModal}
                    initialData={editingStudent}
                />
            )}

            {isAttendanceModalOpen && (
                <AddAttendanceModal
                    students={students}
                    allAttendanceRecords={db.extraAttendance}
                    onAdd={actions.addExtraAttendance}
                    onBulkAdd={actions.bulkAddExtraAttendance}
                    onUpdate={actions.updateExtraAttendance}
                    onClose={handleCloseAttendanceModal}
                    preSelectedStudentId={preSelectedStudentId}
                />
            )}

            <div className="tab-group">
                <button
                    onClick={() => setViewMode('list')}
                    className={`tab-item ${viewMode === 'list' ? 'active' : ''}`}
                >
                    Danh sách
                </button>
                <button
                    onClick={() => setViewMode('history')}
                    className={`tab-item ${viewMode === 'history' ? 'active' : ''}`}
                >
                    Lịch sử thay đổi
                </button>
            </div>

            {viewMode === 'list' && (
                <>
                    <div className="tab-group" style={{ marginBottom: '2rem' }}>
                        <button
                            onClick={() => setFilterMode('all')}
                            className={`tab-item ${filterMode === 'all' ? 'active' : ''}`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setFilterMode('new')}
                            className={`tab-item ${filterMode === 'new' ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <UserCheck size={16} /> Học sinh mới
                        </button>
                        <button
                            onClick={() => setFilterMode('left')}
                            className={`tab-item ${filterMode === 'left' ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <UserMinus size={16} /> Học sinh nghỉ
                        </button>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
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

                    <div className="table-container glass" onScroll={() => setExpandedNameId(null)}>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                                    <th className="sticky-col">Họ tên</th>
                                    <th>Lớp / Năm sinh</th>
                                    <th>Số điện thoại</th>
                                    <th>Ngày nhập học</th>
                                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                                    <th style={{ textAlign: 'center' }}>Ưu đãi, giảm giá</th>
                                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayStudents().map((s, index) => (
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
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{s.className}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>NS: {s.birthYear}</div>
                                        </td>
                                        <td style={{ color: 'var(--text-primary)' }}>{s.phone || '-'}</td>
                                        <td>{new Date(s.enrollDate).toLocaleDateString('vi-VN')}</td>
                                        <td style={{ textAlign: 'center' }}>{getStatusLabel(s)}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--secondary)', fontWeight: 500 }}>
                                            {s.discountRate > 0 ? `${s.discountRate * 100}%` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleOpenAttendanceModal(s.id)}
                                                    className="btn btn-glass" style={{ padding: '0.4rem', borderRadius: '8px', border: 'none' }}
                                                    title="Thêm lịch học bổ sung"
                                                >
                                                    <Calendar size={16} color="var(--secondary)" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(s)}
                                                    className="btn btn-glass" style={{ padding: '0.4rem', borderRadius: '8px', border: 'none' }}
                                                >
                                                    <Edit2 size={16} color="var(--primary)" />
                                                </button>
                                                <button
                                                    onClick={() => actions.deleteStudent(s.id)}
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
                        {displayStudents().length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Không có dữ liệu phù hợp.
                            </div>
                        )}
                    </div>
                </>
            )}

            {viewMode === 'history' && (
                <div className="table-container glass" onScroll={() => setExpandedNameId(null)}>
                    <table>
                        <thead>
                            <tr>
                                <th className="sticky-date">Thời điểm thay đổi</th>
                                <th className="sticky-name-2">Họ tên</th>
                                <th>Lớp / Năm sinh</th>
                                <th>Nội dung thay đổi</th>
                                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statusChangeHistory.map((s, index) => (
                                <tr key={s.id}>
                                    <td className="sticky-date" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                        {new Date(s.changeDate).toLocaleString('vi-VN')}
                                    </td>
                                    <td
                                        className={`sticky-name-2 ${expandedNameId === s.studentId ? 'expanded' : ''}`}
                                        style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                                        title={s.name}
                                        onClick={() => toggleExpandName(s.studentId)}
                                    >
                                        {s.name}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{s.className}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>NS: {s.birthYear}</div>
                                    </td>
                                    <td style={{ color: 'var(--text-primary)' }}>{s.content}</td>
                                    <td style={{ textAlign: 'center' }}>{getStatusLabel(s)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {isImportModalOpen && (
                <ImportStudentsModal
                    classes={classes}
                    onImport={actions.bulkAddStudents}
                    onClose={() => setIsImportModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Students;
