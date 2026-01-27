import { useState } from 'react';
import { Plus, Filter, Download, UserMinus, UserCheck, Edit2, Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import AddStudentModal from '../components/AddStudentModal';
import ImportStudentsModal from '../components/ImportStudentsModal';

const Students = ({ db }) => {
    const { students, views, classes, actions } = db;
    const [filterMode, setFilterMode] = useState('all'); // all, new, left
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list'); // list, history
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    const handleEdit = (student) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleExport = () => {
        const dataToExport = displayStudents().map(s => ({
            'Họ và tên': s.name,
            'Lớp': s.className,
            'Năm sinh': s.birthYear,
            'Số điện thoại': s.phone || '',
            'Ngày nhập học': new Date(s.enrollDate).toLocaleDateString('vi-VN'),
            'Trạng thái': s.status,
            'Học phí': s.tuition.tuitionDue,
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
            filtered = filtered.filter(s => s.classId === selectedClassId);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    // Sort students by enrollment date for history view
    const enrollmentHistory = [...students].sort((a, b) =>
        new Date(b.enrollDate) - new Date(a.enrollDate)
    );

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Đang học': return <span className="label label-success">{status}</span>;
            case 'Mới nhập học': return <span className="label label-primary">{status}</span>;
            case 'Đã nghỉ': return <span className="label label-danger">{status}</span>;
            default: return <span className="label glass">{status}</span>;
        }
    };

    const getTuitionLabel = (status) => {
        return status === 'Đã hoàn thành'
            ? <span className="label label-success">{status}</span>
            : <span className="label label-warning">{status}</span>;
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
                    Lịch sử nhập học
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
                        <div className="filter-group">
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
                    </div>

                    <div className="table-container glass">
                        <table>
                            <thead>
                                <tr>
                                    <th>Họ tên</th>
                                    <th>Lớp</th>
                                    <th style={{ textAlign: 'center' }}>Năm sinh</th>
                                    <th>Số điện thoại</th>
                                    <th>Ngày nhập học</th>
                                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                                    <th style={{ textAlign: 'right' }}>Học phí</th>
                                    <th style={{ textAlign: 'center' }}>Tình trạng</th>
                                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayStudents().map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td>
                                        <td>{s.className}</td>
                                        <td style={{ textAlign: 'center' }}>{s.birthYear}</td>
                                        <td style={{ color: 'var(--text-primary)' }}>{s.phone || '-'}</td>
                                        <td>{new Date(s.enrollDate).toLocaleDateString('vi-VN')}</td>
                                        <td style={{ textAlign: 'center' }}>{getStatusLabel(s.status)}</td>
                                        <td style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                                            {new Intl.NumberFormat('vi-VN').format(s.tuition.tuitionDue)} đ
                                            {s.discountRate > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginLeft: '0.5rem' }}>(-{s.discountRate * 100}%)</span>}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{getTuitionLabel(s.tuition.status)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
                <div className="table-container glass">
                    <table>
                        <thead>
                            <tr>
                                <th>Ngày nhập học</th>
                                <th>Họ tên</th>
                                <th style={{ textAlign: 'center' }}>Năm sinh</th>
                                <th>Lớp</th>
                                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrollmentHistory.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                        {new Date(s.enrollDate).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td>
                                    <td style={{ textAlign: 'center' }}>{s.birthYear}</td>
                                    <td>{s.className}</td>
                                    <td style={{ textAlign: 'center' }}>{getStatusLabel(s.status)}</td>
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
