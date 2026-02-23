import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Repeat } from 'lucide-react';

const RecurringScheduleForm = ({ onPatternChange, initialPattern = null }) => {
    const [frequency, setFrequency] = useState(initialPattern?.frequency || 'weekly');
    const [daysOfWeek, setDaysOfWeek] = useState(initialPattern?.daysOfWeek || []);
    const [startDate, setStartDate] = useState(initialPattern?.startDate || '');
    const [endDate, setEndDate] = useState(initialPattern?.endDate || '');
    const [previewDates, setPreviewDates] = useState([]);

    const weekDays = [
        { value: 1, label: 'T2' },
        { value: 2, label: 'T3' },
        { value: 3, label: 'T4' },
        { value: 4, label: 'T5' },
        { value: 5, label: 'T6' },
        { value: 6, label: 'T7' },
        { value: 0, label: 'CN' }
    ];

    // Generate preview dates
    useEffect(() => {
        if (!startDate || !endDate) {
            setPreviewDates([]);
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const dates = [];

        if (frequency === 'weekly' && daysOfWeek.length > 0) {
            let current = new Date(start);
            while (current <= end && dates.length < 100) {
                if (daysOfWeek.includes(current.getDay())) {
                    dates.push(new Date(current));
                }
                current.setDate(current.getDate() + 1);
            }
        }

        setPreviewDates(dates);
    }, [frequency, daysOfWeek, startDate, endDate]);

    // Notify parent of pattern changes
    useEffect(() => {
        if (!startDate || !endDate) return;

        const pattern = {
            frequency,
            startDate,
            endDate,
            daysOfWeek
        };

        onPatternChange(pattern, previewDates);
    }, [frequency, daysOfWeek, startDate, endDate, previewDates, onPatternChange]);

    const toggleDayOfWeek = (day) => {
        if (daysOfWeek.includes(day)) {
            setDaysOfWeek(daysOfWeek.filter(d => d !== day));
        } else {
            setDaysOfWeek([...daysOfWeek, day].sort());
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Frequency Selection */}
            {/* The Monthly option was removed based on user request */}

            {/* Weekly Pattern */}
            {frequency === 'weekly' && (
                <div>
                    <label className="form-label">Chọn các thứ trong tuần</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {weekDays.map(day => (
                            <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDayOfWeek(day.value)}
                                className={`btn ${daysOfWeek.includes(day.value) ? 'btn-primary' : 'btn-glass'}`}
                                style={{ minWidth: '50px', padding: '0.5rem' }}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Date Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label className="form-label">Ngày bắt đầu</label>
                    <input
                        type="date"
                        className="glass"
                        style={{ width: '100%', padding: '0.75rem' }}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="form-label">Ngày kết thúc</label>
                    <input
                        type="date"
                        className="glass"
                        style={{ width: '100%', padding: '0.75rem' }}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                    />
                </div>
            </div>

            {/* Preview */}
            {previewDates.length > 0 && (
                <div className="glass" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Repeat size={18} color="var(--primary)" />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            Xem trước: {previewDates.length} buổi học
                        </span>
                    </div>

                    {previewDates.length > 100 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(var(--warning-rgb), 0.1)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                            <AlertCircle size={16} color="var(--warning)" />
                            <span style={{ fontSize: '0.875rem', color: 'var(--warning)' }}>
                                Cảnh báo: Tạo quá nhiều buổi học ({previewDates.length}). Khuyến nghị giới hạn dưới 100 buổi.
                            </span>
                        </div>
                    )}

                    <div style={{
                        maxHeight: '150px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem'
                    }}>
                        {previewDates.slice(0, 50).map((date, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    background: 'white',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.75rem'
                                }}
                            >
                                <Calendar size={12} color="var(--primary)" />
                                {date.toLocaleDateString('vi-VN')}
                            </div>
                        ))}
                        {previewDates.length > 50 && (
                            <div style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                fontStyle: 'italic'
                            }}>
                                ... và {previewDates.length - 50} buổi nữa
                            </div>
                        )}
                    </div>
                </div>
            )}

            {previewDates.length === 0 && startDate && endDate && (
                <div style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontStyle: 'italic'
                }}>
                    {frequency === 'weekly' && daysOfWeek.length === 0
                        ? 'Vui lòng chọn ít nhất một thứ trong tuần'
                        : 'Không có buổi học nào được tạo với cấu hình này'
                    }
                </div>
            )}
        </div>
    );
};

export default RecurringScheduleForm;
