import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, ShieldAlert, Coffee, User, ChevronLeft, ChevronRight } from 'lucide-react';
import AddHolidayModal from '../components/AddHolidayModal';

const Schedule = ({ db }) => {
    const { classes, holidays, actions, students, extraAttendance } = db;
    const [activeTab, setActiveTab] = useState('schedule');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [classFilter, setClassFilter] = useState('all');


    const goToPrevMonth = () => {
        const d = new Date(currentMonth);
        d.setMonth(d.getMonth() - 1);
        setCurrentMonth(d);
    };

    const goToNextMonth = () => {
        const d = new Date(currentMonth);
        d.setMonth(d.getMonth() + 1);
        setCurrentMonth(d);
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
    };

    const formatFullDate = (date) => {
        return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatMonthYear = (date) => {
        return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
    };

    const getLocalDateString = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const periods = [
        { id: 'morning', label: 'Sáng' },
        { id: 'afternoon', label: 'Chiều' },
        { id: 'evening', label: 'Tối' }
    ];

    const getClassesForSlot = (period, day) => {
        return (classes || []).filter(c => c.schedule && c.schedule[period] && c.schedule[period].includes(day));
    };

    return (
        <div className="view-container">
            <div className="view-header" style={{ marginBottom: '1rem' }}>
                <h1>Quản Lý Lịch Học Chung</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-glass'}`}
                        onClick={() => setActiveTab('schedule')}
                    >
                        Lịch học tổng hợp
                    </button>
                    <button
                        className={`btn ${activeTab === 'holidays' ? 'btn-primary' : 'btn-glass'}`}
                        onClick={() => setActiveTab('holidays')}
                    >
                        Lịch nghỉ / Nghỉ lễ
                    </button>
                    <button
                        className={`btn ${activeTab === 'student_schedule' ? 'btn-primary' : 'btn-glass'}`}
                        onClick={() => setActiveTab('student_schedule')}
                    >
                        Lịch học Học viên
                    </button>
                </div>
            </div>

            {activeTab === 'schedule' ? (
                <div className="table-container glass" style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'separate', borderSpacing: '0.5rem' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '100px', background: 'transparent' }}></th>
                                {days.map(day => (
                                    <th key={day} style={{ textAlign: 'center', minWidth: '120px' }}>{day}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map(period => (
                                <tr key={period.id}>
                                    <td style={{
                                        fontWeight: 600,
                                        color: 'var(--primary)',
                                        verticalAlign: 'middle',
                                        textAlign: 'center',
                                        background: 'rgba(var(--primary-rgb), 0.1)',
                                        borderRadius: '8px'
                                    }}>
                                        {period.label}
                                    </td>
                                    {days.map(day => {
                                        const slotClasses = getClassesForSlot(period.id, day);
                                        return (
                                            <td key={day} style={{ verticalAlign: 'top', height: '120px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    {slotClasses.map(c => (
                                                        <div
                                                            key={c.id}
                                                            className="glass card"
                                                            style={{
                                                                padding: '0.5rem',
                                                                fontSize: '0.8rem',
                                                                borderLeft: '3px solid var(--primary)',
                                                                animation: 'fadeIn 0.3s ease'
                                                            }}
                                                        >
                                                            <div className="uppercase-class" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                                                        </div>
                                                    ))}
                                                    {slotClasses.length === 0 && (
                                                        <div style={{
                                                            height: '100%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'var(--text-secondary)',
                                                            opacity: 0.6,
                                                            fontSize: '0.75rem',
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
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : activeTab === 'student_schedule' ? (
                <div className="student-schedule-view">
                    <div className="glass card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label className="form-label">Tìm kiếm học viên</label>
                                <input
                                    type="text"
                                    className="glass"
                                    style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                                    placeholder="Nhập tên học viên..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label className="form-label">Lọc theo lớp</label>
                                <select
                                    className="glass"
                                    style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                                    value={classFilter}
                                    onChange={(e) => setClassFilter(e.target.value)}
                                >
                                    <option value="all">Tất cả các lớp</option>
                                    {(classes || []).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '42px' }}>
                                <button className="btn btn-glass" onClick={goToPrevMonth}>
                                    <ChevronLeft size={18} />
                                </button>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: '120px', textAlign: 'center' }}>
                                    {formatMonthYear(currentMonth)}
                                </div>
                                <button className="btn btn-glass" onClick={goToNextMonth}>
                                    <ChevronRight size={18} />
                                </button>
                                <button
                                    className="btn btn-glass"
                                    style={{ fontSize: '0.8rem' }}
                                    onClick={() => setCurrentMonth(new Date())}
                                >
                                    Hiện tại
                                </button>
                            </div>
                        </div>

                        <div style={{ width: '100%' }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={16} /> Chọn học viên mục tiêu
                            </label>
                            <select
                                className="glass"
                                style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                            >
                                <option value="">-- Chọn học viên --</option>
                                {(students || [])
                                    .filter(s => {
                                        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
                                        const matchesClass = classFilter === 'all' || s.classId === classFilter;
                                        return matchesSearch && matchesClass;
                                    })
                                    .map(s => (
                                        <option key={s.id} value={s.id}>{s.name} - {s.className}</option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {selectedStudentId ? (() => {
                        const student = students.find(s => s.id === selectedStudentId);
                        const studentClass = classes.find(c => c.id === student?.classId);
                        const monthDays = getDaysInMonth(currentMonth);
                        const dayNameMap = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };

                        const scheduleItems = [];

                        monthDays.forEach(date => {
                            const dateStr = getLocalDateString(date);
                            const dayName = dayNameMap[date.getDay()];

                            // Regular TKB Sessions
                            if (studentClass?.schedule) {
                                periods.forEach(period => {
                                    if (studentClass.schedule[period.id]?.includes(dayName)) {
                                        scheduleItems.push({
                                            date,
                                            dateStr,
                                            period: period.label,
                                            type: 'Học theo TKB',
                                            name: studentClass.name,
                                            isExtra: false,
                                            status: true // Assume regular sessions are expected
                                        });
                                    }
                                });
                            }

                            // Extra Sessions
                            const dayExtra = (extraAttendance || []).filter(a => a.studentId === selectedStudentId && a.date === dateStr);
                            dayExtra.forEach(ea => {
                                scheduleItems.push({
                                    date,
                                    dateStr,
                                    period: '-', // Explicitly show '-' as requested
                                    type: 'Học bổ sung',
                                    name: 'Học bổ sung',
                                    isExtra: true,
                                    status: ea.status,
                                    isExcused: ea.isExcused,
                                    notes: ea.notes
                                });
                            });
                        });

                        // Sort by date (already sorted mostly) and period (optional)
                        scheduleItems.sort((a, b) => a.date - b.date);

                        return (
                            <div className="table-container glass" style={{ overflowX: 'auto' }}>
                                <table className="schedule-table">
                                    <thead>
                                        <tr>
                                            <th>Thứ</th>
                                            <th>Ngày học</th>
                                            <th>Buổi học</th>
                                            <th>Hình thức học</th>
                                            <th>Nội dung / Ghi chú</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scheduleItems.length > 0 ? scheduleItems.map((item, idx) => (
                                            <tr key={`${item.dateStr}-${idx}`} style={{
                                                background: item.isExtra ? 'rgba(var(--warning-rgb), 0.03)' : 'transparent',
                                                borderLeft: `4px solid ${item.isExtra ? 'var(--warning)' : 'var(--primary)'}`
                                            }}>
                                                <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                    {(() => {
                                                        const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                                                        return days[item.date.getDay()];
                                                    })()}
                                                </td>
                                                <td style={{ fontWeight: 500 }}>
                                                    {item.date.toLocaleDateString('vi-VN')}
                                                </td>
                                                <td>
                                                    <span className={`label ${item.isExtra ? 'label-warning' : 'label-primary'}`} style={{ opacity: 0.8 }}>
                                                        {item.period}
                                                    </span>
                                                </td>
                                                <td style={{ color: item.isExtra ? 'var(--warning)' : 'var(--primary)', fontWeight: 600 }}>
                                                    {item.type}
                                                </td>
                                                <td style={{ fontSize: '0.9rem' }}>
                                                    {item.isExtra ? (item.notes || '-') : <span className="uppercase-class">{item.name}</span>}
                                                </td>
                                                <td>
                                                    {item.isExtra ? (
                                                        item.status ? (
                                                            <span className="label label-success">Hiện diện</span>
                                                        ) : item.isExcused ? (
                                                            <span className="label label-warning">Xin nghỉ</span>
                                                        ) : (
                                                            <span className="label label-danger">Vắng mặt</span>
                                                        )
                                                    ) : (
                                                        <span className="label label-success" style={{ opacity: 0.6 }}>Lịch cố định</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                                    Không có lịch học nào trong tháng này.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })() : (
                        <div className="glass card" style={{ padding: '3rem', textAlign: 'center' }}>
                            <User size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.3 }} />
                            <p style={{ color: 'var(--text-secondary)' }}>Vui lòng chọn học viên để xem lịch học.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="holidays-view">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Danh sách ngày nghỉ</h2>
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                            <Plus size={18} /> Thêm ngày nghỉ
                        </button>
                    </div>

                    <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {holidays && holidays.length > 0 ? (
                            holidays.map(h => (
                                <div key={h.id} className="glass card" style={{ padding: '1.25rem', position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                        <div style={{
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            background: h.type === 'Nghỉ Lễ' ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(var(--danger-rgb), 0.15)',
                                            color: h.type === 'Nghỉ Lễ' ? 'var(--primary)' : 'var(--danger)'
                                        }}>
                                            {h.type === 'Nghỉ Lễ' ? <Coffee size={24} /> : <ShieldAlert size={24} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                                                {h.date ? (
                                                    h.endDate && h.endDate !== h.date ? (
                                                        `${new Date(h.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${new Date(h.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                                                    ) : (
                                                        new Date(h.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                                    )
                                                ) : 'N/A'}
                                            </div>
                                            <div className="uppercase-class" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {h.type || 'Nghỉ Lễ'}
                                                {h.classId && ` - ${classes.find(c => c.id === h.classId)?.name || 'Lớp đã xóa'}`}
                                            </div>
                                        </div>
                                    </div>
                                    {h.description && (
                                        <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{h.description}</p>
                                    )}
                                    <button
                                        onClick={() => actions.deleteHoliday(h.id)}
                                        style={{
                                            position: 'absolute', right: '1rem', top: '1rem',
                                            background: 'rgba(255,59,48,0.1)', border: 'none', borderRadius: '8px',
                                            padding: '0.5rem', color: 'var(--danger)', cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="glass card" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                                <CalendarIcon size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.3 }} />
                                <p style={{ color: 'var(--text-secondary)' }}>Chưa có lịch nghỉ nào được ghi nhận.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isModalOpen && (
                <AddHolidayModal
                    onAdd={actions.addHoliday}
                    onClose={() => setIsModalOpen(false)}
                    classes={classes}
                />
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .table-container td { padding: 0.5rem; }
            `}</style>
        </div>
    );
};

export default Schedule;
