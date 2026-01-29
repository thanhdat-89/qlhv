import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddTuitionModal = ({ students, onAdd, onClose, preSelectedStudentId }) => {
    const preSelectedStudent = preSelectedStudentId ? students.find(s => s.id === preSelectedStudentId) : null;

    const [searchQuery, setSearchQuery] = useState(preSelectedStudent ? preSelectedStudent.name : '');
    const [selectedClassFilter, setSelectedClassFilter] = useState('all');
    const [formData, setFormData] = useState({
        studentId: preSelectedStudentId || students[0]?.id || '',
        amount: preSelectedStudent?.tuition?.balance || students[0]?.tuition?.balance || 0,
        date: new Date().toISOString().split('T')[0],
        method: 'Chuyển khoản'
    });

    // Get unique classes from students
    const classes = [...new Set(students.map(s => ({ id: s.classId, name: s.className })))]
        .filter((c, i, arr) => arr.findIndex(a => a.id === c.id) === i);

    // Filter students based on search and class
    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
        return matchesSearch && matchesClass;
    });

    // Auto-sync student selection when filtered list changes (only if not pre-selected)
    useEffect(() => {
        if (preSelectedStudentId) return;

        if (filteredStudents.length > 0) {
            const currentIsValid = filteredStudents.some(s => s.id === formData.studentId);
            if (!currentIsValid) {
                handleStudentChange(filteredStudents[0].id);
            }
        } else if (formData.studentId !== '') {
            setFormData(prev => ({ ...prev, studentId: '' }));
        }
    }, [searchQuery, selectedClassFilter, preSelectedStudentId]);

    const handleStudentChange = (studentId) => {
        const student = students.find(s => s.id === studentId);
        setFormData({
            ...formData,
            studentId,
            amount: student?.tuition?.balance || 0
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onAdd({ ...formData, amount: parseInt(formData.amount) });
            onClose();
        } catch (error) {
            console.error('Submit error:', error);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card" style={{ maxWidth: '400px' }}>
                <button onClick={onClose} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                    <X size={24} />
                </button>
                <h2 style={{ marginBottom: '1.5rem' }}>Thu học phí</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="form-label">Học viên</label>
                        <input
                            type="text"
                            placeholder="Tìm kiếm học viên..."
                            className="glass"
                            style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => setSelectedClassFilter('all')}
                                className={`btn ${selectedClassFilter === 'all' ? 'btn-primary' : 'btn-glass'}`}
                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                            >
                                Tất cả
                            </button>
                            {classes.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedClassFilter(c.id)}
                                    className={`btn ${selectedClassFilter === c.id ? 'btn-primary' : 'btn-glass'}`}
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                        <select
                            className="glass"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: preSelectedStudentId ? '#f1f5f9' : 'var(--glass)',
                                cursor: preSelectedStudentId ? 'not-allowed' : 'pointer'
                            }}
                            value={formData.studentId}
                            onChange={e => handleStudentChange(e.target.value)}
                            disabled={!!preSelectedStudentId}
                        >
                            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} - {s.className}</option>)}
                        </select>
                        {preSelectedStudentId && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: 500 }}>
                                * Đang thu phí cho học viên được chọn từ trang Học phí
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="form-label">Số tiền đóng (đ)</label>
                        <input
                            className="glass" type="number" required
                            style={{ width: '100%', padding: '0.75rem' }}
                            value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label">Ngày đóng</label>
                        <input
                            className="glass" type="date" required
                            style={{ width: '100%', padding: '0.75rem' }}
                            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label">Hình thức</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['Tiền mặt', 'Chuyển khoản'].map(m => (
                                <button
                                    key={m} type="button"
                                    className={`btn ${formData.method === m ? 'btn-primary' : 'btn-glass'}`}
                                    style={{ flex: 1, padding: '0.5rem' }}
                                    onClick={() => setFormData({ ...formData, method: m })}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>Hủy</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu phiếu thu</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTuitionModal;
