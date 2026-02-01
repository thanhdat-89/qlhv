import { useState, useEffect } from 'react';
import { X, Save, Plus, Calendar as CalendarIcon, Trash2 } from 'lucide-react';

const AddAttendanceModal = ({ students, onAdd, onBulkAdd, onUpdate, onClose, initialData }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('all');
    const [selectedDates, setSelectedDates] = useState(
        initialData ? [initialData.date] : []
    );
    const [currentDateInput, setCurrentDateInput] = useState(
        new Date().toISOString().split('T')[0]
    );

    const [formData, setFormData] = useState(initialData || {
        studentId: students[0]?.id || '',
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
        if (!initialData && filteredStudents.length > 0) {
            const currentIsValid = filteredStudents.some(s => s.id === formData.studentId);
            if (!currentIsValid) {
                handleStudentChange(filteredStudents[0].id);
            }
        } else if (!initialData && filteredStudents.length === 0 && formData.studentId !== '') {
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

    const addDate = () => {
        if (currentDateInput && !selectedDates.includes(currentDateInput)) {
            setSelectedDates([...selectedDates, currentDateInput].sort());
        }
    };

    const removeDate = (date) => {
        setSelectedDates(selectedDates.filter(d => d !== date));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedDates.length === 0) {
            alert('Vui lòng chọn ít nhất một ngày học.');
            return;
        }

        setIsSubmitting(true);
        try {
            const commonData = {
                ...formData,
                fee: parseInt(formData.fee)
            };

            if (initialData) {
                await onUpdate(initialData.id, { ...commonData, date: selectedDates[0] });
            } else if (selectedDates.length === 1) {
                await onAdd({ ...commonData, date: selectedDates[0] });
            } else {
                const records = selectedDates.map(date => ({
                    ...commonData,
                    date
                }));
                await onBulkAdd(records);
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
            <div className="modal-content card" style={{ maxWidth: '450px', width: '90%', padding: '1.25rem' }}>
                <button onClick={onClose} className="btn-close-modal">
                    <X size={24} />
                </button>
                <h2 style={{ marginBottom: '1.5rem' }}>{initialData ? 'Chỉnh sửa buổi học' : 'Ghi nhận nhiều buổi học'}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="form-label">Học viên</label>
                        {!initialData && (
                            <>
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
                            </>
                        )}
                        <select
                            className="glass" style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                            value={formData.studentId} onChange={e => handleStudentChange(e.target.value)}
                            disabled={!!initialData}
                        >
                            {initialData ? (
                                <option value={formData.studentId}>{students.find(s => s.id === formData.studentId)?.name}</option>
                            ) : (
                                filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} - {s.className}</option>)
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="form-label">Chọn các ngày học</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <input
                                className="glass" type="date"
                                style={{ flex: 1, padding: '0.75rem', boxSizing: 'border-box' }}
                                value={currentDateInput} onChange={e => setCurrentDateInput(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={addDate}
                                className="btn btn-primary"
                                style={{ padding: '0 1rem' }}
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {selectedDates.length > 0 && (
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                maxHeight: '120px',
                                overflowY: 'auto'
                            }}>
                                {selectedDates.map(date => (
                                    <div key={date} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        background: 'white',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.85rem'
                                    }}>
                                        <CalendarIcon size={14} color="var(--primary)" />
                                        {new Date(date).toLocaleDateString('vi-VN')}
                                        <button
                                            type="button"
                                            onClick={() => removeDate(date)}
                                            style={{ border: 'none', background: 'transparent', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <X size={14} color="var(--danger)" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="form-label">Học phí mỗi buổi (đ)</label>
                        <input
                            className="glass" type="number" required
                            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                            value={formData.fee} onChange={e => setFormData({ ...formData, fee: e.target.value })}
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
                            <label htmlFor="att-status" className="form-label" style={{ marginBottom: 0 }}>Có mặt</label>
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
                            <label htmlFor="att-excused" className="form-label" style={{ marginBottom: 0 }}>Xin nghỉ</label>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Ghi chú (áp dụng cho tất cả buổi chọn)</label>
                        <textarea
                            className="glass" rows="2"
                            style={{ width: '100%', padding: '0.75rem', resize: 'none', boxSizing: 'border-box' }}
                            value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Ví dụ: Học bù buổi T2..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>Hủy</button>
                        <button type="submit" disabled={isSubmitting || selectedDates.length === 0} className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Save size={18} /> {isSubmitting ? 'Đang lưu...' : `Lưu ${selectedDates.length} buổi học`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAttendanceModal;
