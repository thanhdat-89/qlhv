import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const AddAttendanceModal = ({ students, onAdd, onUpdate, onClose, initialData }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('all');
    const [formData, setFormData] = useState(initialData || {
        studentId: students[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        status: true,
        isExcused: false,
        fee: students[0]?.tuition?.feePerSession || 200000,
        notes: ''
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

    // Auto-sync student selection when filtered list changes
    useEffect(() => {
        if (filteredStudents.length > 0) {
            const currentIsValid = filteredStudents.some(s => s.id === formData.studentId);
            if (!currentIsValid) {
                handleStudentChange(filteredStudents[0].id);
            }
        } else if (formData.studentId !== '') {
            setFormData(prev => ({ ...prev, studentId: '' }));
        }
    }, [searchQuery, selectedClassFilter]);

    const handleStudentChange = (id) => {
        const student = students.find(s => s.id === id);
        setFormData({
            ...formData,
            studentId: id,
            fee: student?.tuition?.feePerSession || formData.fee
        });
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = {
                ...formData,
                fee: parseInt(formData.fee)
            };
            if (initialData) {
                await onUpdate(initialData.id, data);
            } else {
                await onAdd(data);
            }
            onClose();
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card" style={{ maxWidth: '400px', width: '90%', padding: '1.25rem' }}>
                <button onClick={onClose} className="btn-close-modal">
                    <X size={24} />
                </button>
                <h2 style={{ marginBottom: '1.5rem' }}>{initialData ? 'Chỉnh sửa buổi học' : 'Ghi nhận buổi học'}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="form-label">Học viên</label>
                        <input
                            type="text"
                            placeholder="Tìm kiếm học viên..."
                            className="glass"
                            style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => setSelectedClassFilter('all')}
                                className={`btn ${selectedClassFilter === 'all' ? 'btn-primary' : 'btn-glass'}`}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', minWidth: 'fit-content' }}
                            >
                                Tất cả
                            </button>
                            {classes.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedClassFilter(c.id)}
                                    className={`btn ${selectedClassFilter === c.id ? 'btn-primary' : 'btn-glass'}`}
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', minWidth: 'fit-content' }}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                        <select
                            className="glass" style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                            value={formData.studentId} onChange={e => handleStudentChange(e.target.value)}
                        >
                            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} - {s.className}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Học phí buổi học (đ)</label>
                        <input
                            className="glass" type="number" required
                            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                            value={formData.fee} onChange={e => setFormData({ ...formData, fee: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label">Ngày học</label>
                        <input
                            className="glass" type="date" required
                            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox" id="att-status"
                                checked={formData.status}
                                onChange={e => {
                                    const checked = e.target.checked;
                                    setFormData({
                                        ...formData,
                                        status: checked,
                                        isExcused: checked ? false : formData.isExcused
                                    });
                                }}
                                style={{ width: '1.25rem', height: '1.25rem' }}
                            />
                            <label htmlFor="att-status" className="form-label" style={{ marginBottom: 0 }}>Học viên hiện diện</label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox" id="att-excused"
                                checked={formData.isExcused}
                                onChange={e => {
                                    const checked = e.target.checked;
                                    setFormData({
                                        ...formData,
                                        isExcused: checked,
                                        status: checked ? false : formData.status
                                    });
                                }}
                                style={{ width: '1.25rem', height: '1.25rem' }}
                            />
                            <label htmlFor="att-excused" className="form-label" style={{ marginBottom: 0 }}>Học sinh xin nghỉ</label>
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Ghi chú</label>
                        <textarea
                            className="glass" rows="3"
                            style={{ width: '100%', padding: '0.75rem', resize: 'none', boxSizing: 'border-box' }}
                            value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Ví dụ: Học bù buổi T2..."
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>Hủy</button>
                        <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Save size={18} /> {isSubmitting ? 'Đang lưu...' : 'Lưu ghi nhận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAttendanceModal;
