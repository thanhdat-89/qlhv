import { useState, useEffect, useMemo } from 'react';
import { X, Save, Plus, Calendar as CalendarIcon, Trash2, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
import RecurringScheduleForm from './RecurringScheduleForm';

const CalendarPicker = ({ selectedDates, onToggleDate, scheduledDates = [] }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const startDayOfMonth = (year, month) => new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const totalDays = daysInMonth(year, month);
    const firstDay = startDayOfMonth(year, month);

    // Convert Sunday start to Monday start (0=Mon, 6=Sun)
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);

    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return (
        <div className="glass" style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button type="button" onClick={handlePrevMonth} className="btn-glass" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                    <ChevronLeft size={18} />
                </button>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Tháng {month + 1}, {year}
                </div>
                <button type="button" onClick={handleNextMonth} className="btn-glass" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                    <ChevronRight size={18} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                {weekDays.map(d => (
                    <div key={d} style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', paddingBottom: '4px' }}>
                        {d}
                    </div>
                ))}
                {days.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} />;

                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = selectedDates.includes(dateStr);
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                    const isScheduled = scheduledDates?.includes(dateStr);

                    return (
                        <div key={day} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => onToggleDate(dateStr)}
                                style={{
                                    width: '100%',
                                    padding: '0.4rem 0',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: isSelected ? 'var(--primary)' : 'transparent',
                                    color: isSelected ? 'white' : (isScheduled ? 'var(--primary)' : 'var(--text-primary)'),
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontWeight: isSelected || isToday || isScheduled ? 600 : 400,
                                    outline: isToday && !isSelected ? '1px solid var(--primary)' : 'none'
                                }}
                                className={!isSelected ? 'card-hover' : ''}
                            >
                                {day}
                            </button>
                            {isScheduled && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    background: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--primary)'
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AddAttendanceModal = ({ students, allAttendanceRecords = [], onAdd, onBulkAdd, onUpdate, onBulkDelete, onClose, initialData, preSelectedStudentId, currentSessions = [] }) => {
    const preSelectedStudent = preSelectedStudentId ? students.find(s => s.id === preSelectedStudentId) : null;
    const [mode, setMode] = useState('manual'); // 'manual' or 'recurring'
    const [searchQuery, setSearchQuery] = useState(preSelectedStudent ? preSelectedStudent.name : '');
    const [selectedClassFilter, setSelectedClassFilter] = useState('all');

    // Pre-select existing dates if in student-centric edit mode
    const [selectedDates, setSelectedDates] = useState(() => {
        if (initialData) return [initialData.date];
        if (currentSessions.length > 0) return currentSessions.map(s => s.date).sort();
        return [];
    });

    // Analyze current sessions for pre-filling recurring pattern
    const detectedDays = useMemo(() => [...new Set(currentSessions.map(s => new Date(s.date).getDay()))], [currentSessions]);
    const detectedFee = useMemo(() => {
        if (initialData) return initialData.fee;
        if (currentSessions.length > 0) return currentSessions[0].fee;

        const targetStudentId = preSelectedStudentId || students[0]?.id;
        if (targetStudentId) {
            const studentPreviousRecords = allAttendanceRecords
                .filter(a => a.studentId === targetStudentId)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            if (studentPreviousRecords.length > 0 && studentPreviousRecords[0].fee !== undefined) {
                return studentPreviousRecords[0].fee;
            }
        }

        return (preSelectedStudent?.tuition?.feePerSession || students[0]?.tuition?.feePerSession || 200000);
    }, [currentSessions, preSelectedStudentId, preSelectedStudent, students, initialData, allAttendanceRecords]);

    const [recurringPattern, setRecurringPattern] = useState(
        detectedDays.length > 0 ? {
            frequency: 'weekly',
            daysOfWeek: detectedDays,
            startDate: '',
            endDate: ''
        } : null
    );

    const [recurringPreviewDates, setRecurringPreviewDates] = useState([]);
    const [formData, setFormData] = useState({
        studentId: preSelectedStudentId || students[0]?.id || '',
        fee: detectedFee,
        notes: initialData?.notes || (currentSessions.length > 0 ? currentSessions[0].notes : '')
    });

    // Get unique classes from students and sort them
    const classes = [...new Set(students.map(s => ({ id: s.classId, name: s.className })))]
        .filter((c, i, arr) => arr.findIndex(a => a.id === c.id) === i)
        .sort((a, b) => {
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
        });

    // Filter students based on search and class
    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
        return matchesSearch && matchesClass;
    });

    // Auto-sync student selection when filtered list changes
    useEffect(() => {
        if (preSelectedStudentId) return;

        if (!initialData && filteredStudents.length > 0) {
            const currentIsValid = filteredStudents.some(s => s.id === formData.studentId);
            if (!currentIsValid) {
                handleStudentChange(filteredStudents[0].id);
            }
        } else if (!initialData && filteredStudents.length === 0 && formData.studentId !== '') {
            setFormData(prev => ({ ...prev, studentId: '' }));
        }
    }, [searchQuery, selectedClassFilter, preSelectedStudentId]);

    const handleStudentChange = (id) => {
        let suggestedFee = formData.fee;

        const studentPreviousRecords = allAttendanceRecords
            .filter(a => a.studentId === id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (studentPreviousRecords.length > 0 && studentPreviousRecords[0].fee !== undefined) {
            suggestedFee = studentPreviousRecords[0].fee;
        } else {
            const student = students.find(s => s.id === id);
            suggestedFee = student?.tuition?.feePerSession || formData.fee;
        }

        setFormData({
            ...formData,
            studentId: id,
            fee: suggestedFee
        });
    };

    const handleRecurringPatternChange = (pattern, previewDates) => {
        setRecurringPattern(pattern);
        setRecurringPreviewDates(previewDates);
    };

    const removeDate = (date) => {
        setSelectedDates(selectedDates.filter(d => d !== date));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const datesToCreate = mode === 'recurring'
            ? recurringPreviewDates.map(d => d.toISOString().split('T')[0])
            : selectedDates.filter(date => !currentSessions.some(s => s.date === date));

        const sessionsToDelete = mode === 'manual'
            ? currentSessions.filter(s => !selectedDates.includes(s.date))
            : []; // In recurring mode, we might want a different logic, but let's stick to manual sync for now as requested

        const sessionsToUpdate = mode === 'manual'
            ? currentSessions.filter(s => selectedDates.includes(s.date))
            : [];

        if (datesToCreate.length === 0 && sessionsToDelete.length === 0 && sessionsToUpdate.length === 0 && !initialData) {
            alert('Không có thay đổi nào để lưu.');
            return;
        }

        setIsSubmitting(true);
        try {
            const commonData = {
                ...formData,
                fee: parseInt(formData.fee)
            };

            // 1. Handle Deletions
            if (sessionsToDelete.length > 0) {
                await onBulkDelete(sessionsToDelete.map(s => s.id));
            }

            // 2. Handle Updates (if anything changed)
            for (const session of sessionsToUpdate) {
                if (session.fee !== commonData.fee || session.notes !== commonData.notes) {
                    await onUpdate(session.id, { ...commonData, date: session.date });
                }
            }

            // 3. Handle Additions
            if (initialData) {
                // If editing a specific single session (not from the week view)
                await onUpdate(initialData.id, { ...commonData, date: selectedDates[0] });
            } else if (datesToCreate.length === 1) {
                await onAdd({ ...commonData, date: datesToCreate[0] });
            } else if (datesToCreate.length > 1) {
                const records = datesToCreate.map(date => ({
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
                <h2 style={{ marginBottom: '1.5rem' }}>
                    {initialData ? 'Chỉnh sửa buổi học' : preSelectedStudentId ? `Thêm lịch học: ${preSelectedStudent?.name}` : 'Thêm Lịch Học Riêng'}
                </h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="form-label">Học viên</label>
                        {!initialData && !preSelectedStudentId && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm học viên..."
                                    className="glass"
                                    style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="hide-mobile" style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
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
                                <div className="show-mobile" style={{ marginBottom: '0.75rem' }}>
                                    <select
                                        className="glass"
                                        style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
                                        value={selectedClassFilter}
                                        onChange={(e) => setSelectedClassFilter(e.target.value === 'all' ? 'all' : e.target.value)}
                                    >
                                        <option value="all">Tất cả lớp</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                        <select
                            className="glass" style={{
                                width: '100%',
                                padding: '0.75rem',
                                boxSizing: 'border-box',
                                background: preSelectedStudentId ? '#f1f5f9' : 'var(--glass)',
                                cursor: preSelectedStudentId ? 'not-allowed' : 'pointer'
                            }}
                            value={formData.studentId} onChange={e => handleStudentChange(e.target.value)}
                            disabled={!!initialData || !!preSelectedStudentId}
                        >
                            {initialData ? (
                                <option value={formData.studentId}>{students.find(s => s.id === formData.studentId)?.name}</option>
                            ) : (
                                filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} - {s.className}</option>)
                            )}
                        </select>
                    </div>

                    {/* Mode Selection Tabs (only for new records) */}
                    {!initialData && (
                        <div>
                            <label className="form-label">Chế độ lên lịch</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setMode('manual')}
                                    className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-glass'}`}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <CalendarIcon size={16} />
                                    Chọn thủ công
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('recurring')}
                                    className={`btn ${mode === 'recurring' ? 'btn-primary' : 'btn-glass'}`}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Repeat size={16} />
                                    Lặp lại tự động
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Manual Mode: Calendar Picker */}
                    {mode === 'manual' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="form-label mb-0">Chọn các ngày học</label>
                                {mode === 'manual' && formData.studentId && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                                        Đã có lịch riêng
                                    </span>
                                )}
                            </div>
                            <CalendarPicker
                                selectedDates={selectedDates}
                                scheduledDates={allAttendanceRecords.filter(a => a.studentId === formData.studentId).map(a => a.date)}
                                onToggleDate={(date) => {
                                    if (selectedDates.includes(date)) {
                                        setSelectedDates(selectedDates.filter(d => d !== date).sort());
                                    } else {
                                        setSelectedDates([...selectedDates, date].sort());
                                    }
                                }}
                            />

                            {selectedDates.length > 0 && (
                                <div style={{
                                    marginTop: '1rem',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.4rem',
                                    padding: '0.6rem',
                                    background: 'rgba(255, 255, 255, 0.5)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    maxHeight: '100px',
                                    overflowY: 'auto'
                                }}>
                                    {selectedDates.map(date => (
                                        <div key={date} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            background: 'white',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '0.75rem'
                                        }}>
                                            <CalendarIcon size={12} color="var(--primary)" />
                                            {new Date(date).toLocaleDateString('vi-VN')}
                                            <button
                                                type="button"
                                                onClick={() => removeDate(date)}
                                                style={{ border: 'none', background: 'transparent', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            >
                                                <X size={12} color="var(--danger)" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recurring Mode: Recurring Form */}
                    {mode === 'recurring' && !initialData && (
                        <div>
                            <label className="form-label">Thiết lập lịch lặp lại</label>
                            <RecurringScheduleForm
                                onPatternChange={handleRecurringPatternChange}
                                initialPattern={recurringPattern}
                            />
                        </div>
                    )}

                    <div>
                        <label className="form-label">Học phí mỗi buổi (đ)</label>
                        <input
                            className="glass" type="number" required
                            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                            value={formData.fee} onChange={e => setFormData({ ...formData, fee: e.target.value })}
                        />
                    </div>



                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>Hủy</button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (mode === 'manual' ? selectedDates.length === 0 : recurringPreviewDates.length === 0)}
                            className="btn btn-primary"
                            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Save size={18} />
                            {isSubmitting
                                ? 'Đang lưu...'
                                : mode === 'recurring'
                                    ? `Lưu ${recurringPreviewDates.length} buổi học`
                                    : `Lưu ${selectedDates.length} buổi học`
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAttendanceModal;
