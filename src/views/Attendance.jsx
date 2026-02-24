import { useState, useMemo } from 'react';
import { Plus, BadgeCheck, Calendar, Edit2, Search, Filter, ChevronLeft, ChevronRight, Clock, Trash2 } from 'lucide-react';
import AddAttendanceModal from '../components/AddAttendanceModal';

const Attendance = ({ db }) => {
    const { extraAttendance, students, classes, actions } = db;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAttendance, setEditingAttendance] = useState(null);
    const [preSelectedStudentId, setPreSelectedStudentId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

    // Get week start and end dates (Monday to Sunday)
    const getWeekDates = (offset = 0) => {
        const today = new Date();
        today.setDate(today.getDate() + (offset * 7));

        const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
        // Adjust to Monday start
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(today);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return { monday, sunday };
    };

    const { monday, sunday } = getWeekDates(currentWeekOffset);

    const [currentSessions, setCurrentSessions] = useState([]);

    const handleEdit = (studentId) => {
        // Find all sessions for this student in the current visible week
        const studentSessions = extraAttendance.filter(record => {
            const sessionDate = new Date(record.date);
            return record.studentId === studentId && sessionDate >= monday && sessionDate <= sunday;
        });

        setCurrentSessions(studentSessions);
        setPreSelectedStudentId(studentId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAttendance(null);
        setPreSelectedStudentId(null);
        setCurrentSessions([]);
    };

    // Filter students and group their sessions for the selected week
    const studentSchedules = useMemo(() => {
        // Filter sessions in the selected week
        const weekSessions = extraAttendance.filter(record => {
            const sessionDate = new Date(record.date);
            return sessionDate >= monday && sessionDate <= sunday;
        });

        // Group by student
        const byStudent = {};

        weekSessions.forEach(record => {
            if (!byStudent[record.studentId]) {
                byStudent[record.studentId] = [];
            }
            byStudent[record.studentId].push(record);
        });

        // Create student schedule objects
        const rawSchedules = Object.entries(byStudent).map(([studentId, sessions]) => {
            const student = students.find(s => s.id === studentId);
            if (!student) return null;

            // Sort sessions by normalized day (1=Mon, ..., 7=Sun)
            const daysOfWeek = sessions.map(s => {
                const date = new Date(s.date);
                const day = date.getDay();
                return {
                    day: day === 0 ? 7 : day, // 1 to 7
                    date: s.date,
                    fee: s.fee,
                    notes: s.notes,
                    id: s.id
                };
            }).sort((a, b) => a.day - b.day);

            return {
                studentId,
                studentName: student.name,
                className: student.className,
                classId: student.classId,
                sessions: daysOfWeek
            };
        }).filter(Boolean);

        // Apply filters
        let filtered = rawSchedules;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.studentName.toLowerCase().includes(query)
            );
        }

        if (selectedClass !== 'all') {
            filtered = filtered.filter(s => s.classId === selectedClass);
        }

        // Sort by student name
        filtered.sort((a, b) => a.studentName.localeCompare(b.studentName));

        return filtered;
    }, [extraAttendance, students, searchQuery, selectedClass, monday, sunday]);

    // Get unique classes for filter
    const uniqueClasses = useMemo(() => {
        const classSet = new Set();
        students.forEach(s => {
            if (s.classId) classSet.add(s.classId);
        });
        return Array.from(classSet).map(classId => {
            const cls = classes.find(c => c.id === classId);
            return { id: classId, name: cls?.name || classId };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [students, classes]);

    const dayLabelsMap = {
        1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN'
    };
    const dayNumbers = [1, 2, 3, 4, 5, 6, 7];

    return (
        <div className="view-container">
            <div className="view-header">
                <h1>Lịch Học Bổ Sung</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Thêm lịch học
                    </button>
                </div>
            </div>

            <div className="info-box glass" style={{ marginBottom: '2rem', padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="icon-box icon-box-primary" style={{ padding: '0.5rem', borderRadius: '8px' }}>
                        <BadgeCheck size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Hướng dẫn</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Quản lý lịch học bổ sung lặp lại hoặc riêng lẻ.
                            Bảng hiển thị lịch học của từng học viên trong tuần hiện tại.
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation & Filters */}
            <div className="glass" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '12px' }}>
                {/* Week Selector */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        className="btn btn-glass"
                        onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
                        style={{ padding: '0.5rem' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div style={{ textAlign: 'center', minWidth: '250px' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {currentWeekOffset === 0 ? 'Tuần này' : currentWeekOffset === -1 ? 'Tuần trước' : currentWeekOffset === 1 ? 'Tuần sau' : `Cách đây ${Math.abs(currentWeekOffset)} tuần`}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {monday.toLocaleDateString('vi-VN')} - {sunday.toLocaleDateString('vi-VN')}
                        </div>
                    </div>
                    <button
                        className="btn btn-glass"
                        onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                        style={{ padding: '0.5rem' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                    {currentWeekOffset !== 0 && (
                        <button
                            className="btn btn-glass"
                            onClick={() => setCurrentWeekOffset(0)}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                            <Clock size={16} style={{ marginRight: '0.4rem' }} /> Hiện tại
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Search */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Tìm kiếm học viên</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="glass"
                                placeholder="Tên học viên..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem' }}
                            />
                        </div>
                    </div>

                    {/* Class Filter */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Lọc học viên theo lớp</label>
                        <select
                            className="glass"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem' }}
                        >
                            <option value="all">Tất cả lớp</option>
                            {uniqueClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <AddAttendanceModal
                    students={students}
                    allAttendanceRecords={extraAttendance}
                    onAdd={actions.addExtraAttendance}
                    onBulkAdd={actions.bulkAddExtraAttendance}
                    onUpdate={actions.updateExtraAttendance}
                    onBulkDelete={actions.bulkDeleteExtraAttendance}
                    onClose={handleCloseModal}
                    initialData={editingAttendance}
                    preSelectedStudentId={preSelectedStudentId}
                    currentSessions={currentSessions}
                />
            )}
            <div className="extra-schedule-view" style={{ animation: 'fadeIn 0.3s ease' }}>
                <div className="table-container glass" style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'separate', borderSpacing: '0.5rem', width: '100%' }}>
                        <thead>
                            <tr>
                                {dayNumbers.map((dayNum) => {
                                    const date = new Date(monday);
                                    date.setDate(monday.getDate() + (dayNum - 1));
                                    return (
                                        <th key={dayNum} style={{ textAlign: 'center', minWidth: '150px', padding: '1rem' }}>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.7, color: 'var(--text-secondary)' }}>
                                                {dayLabelsMap[dayNum]}
                                            </div>
                                            <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                                {date.getDate()}/{date.getMonth() + 1}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {dayNumbers.map((dayNum) => {
                                    const date = new Date(monday);
                                    date.setDate(monday.getDate() + (dayNum - 1));
                                    const dateStr = date.toISOString().split('T')[0];

                                    let attendees = (extraAttendance || [])
                                        .filter(a => a.date === dateStr)
                                        .map(a => {
                                            const student = students.find(s => s.id === a.studentId);
                                            return { ...a, studentName: student?.name || 'N/A', className: student?.className || '', classId: student?.classId };
                                        });

                                    if (searchQuery) {
                                        const query = searchQuery.toLowerCase();
                                        attendees = attendees.filter(a =>
                                            a.studentName.toLowerCase().includes(query)
                                        );
                                    }

                                    if (selectedClass !== 'all') {
                                        attendees = attendees.filter(a => String(a.classId) === String(selectedClass));
                                    }

                                    return (
                                        <td key={dayNum} style={{ verticalAlign: 'top', minHeight: '400px', padding: '0.25rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {attendees.map((a) => (
                                                    <div
                                                        key={a.id}
                                                        className="glass card"
                                                        style={{
                                                            padding: '1rem',
                                                            fontSize: '0.85rem',
                                                            borderLeft: '4px solid var(--secondary)',
                                                            animation: 'fadeIn 0.3s ease',
                                                            background: 'rgba(255, 255, 255, 0.05)',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                                                {a.studentName}
                                                            </div>
                                                            <button
                                                                onClick={() => actions.deleteExtraAttendance(a.id)}
                                                                style={{
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    padding: '2px',
                                                                    cursor: 'pointer',
                                                                    opacity: 0.5,
                                                                    transition: 'opacity 0.2s'
                                                                }}
                                                                className="card-hover-action"
                                                                title="Xóa buổi học này"
                                                            >
                                                                <Trash2 size={14} color="var(--danger)" />
                                                            </button>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem', opacity: 0.8 }}>
                                                            {a.className}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginTop: '0.2rem' }}>
                                                            {new Intl.NumberFormat('vi-VN').format(a.fee)}đ
                                                        </div>
                                                        {a.notes && (
                                                            <div style={{
                                                                fontSize: '0.75rem',
                                                                color: 'var(--text-secondary)',
                                                                marginTop: '0.6rem',
                                                                paddingTop: '0.6rem',
                                                                borderTop: '1px solid var(--glass-border)',
                                                                fontStyle: 'italic',
                                                                lineHeight: '1.4'
                                                            }}>
                                                                {a.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {attendees.length === 0 && (
                                                    <div style={{
                                                        marginTop: '3rem',
                                                        textAlign: 'center',
                                                        color: 'var(--text-secondary)',
                                                        opacity: 0.3,
                                                        fontSize: '0.85rem',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        Trống
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
