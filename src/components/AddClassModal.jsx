import { useState } from 'react';
import { X } from 'lucide-react';

const AddClassModal = ({ onAdd, onUpdate, onClose, initialData }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        category: 'Cơ bản',
        feePerSession: 250000,
        schedule: { morning: [], afternoon: [], evening: [] }
    });

    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    const toggleDay = (period, day) => {
        const current = formData.schedule[period];
        const updated = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day];
        setFormData({ ...formData, schedule: { ...formData.schedule, [period]: updated } });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...formData, feePerSession: parseInt(formData.feePerSession) };
        if (initialData) {
            onUpdate(initialData.id, data);
        } else {
            onAdd(data);
        }
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card" style={{ maxWidth: '600px' }}>
                <button onClick={onClose} className="btn-close-modal">
                    <X size={24} />
                </button>
                <h2 style={{ marginBottom: '1.5rem' }}>{initialData ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="form-label">Tên lớp học</label>
                        <input
                            className="glass" type="text" required
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ví dụ: Piano Nâng Cao"
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">Hệ lớp</label>
                            <select
                                className="glass"
                                value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Cơ bản">Cơ bản</option>
                                <option value="Cánh diều">Cánh diều</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Học phí mỗi buổi (đ)</label>
                            <input
                                className="glass" type="number" required
                                value={formData.feePerSession} onChange={e => setFormData({ ...formData, feePerSession: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Thời khóa biểu dự kiến</label>
                        {['morning', 'afternoon', 'evening'].map(period => (
                            <div key={period} style={{ marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                                    {period === 'morning' ? 'Sáng' : period === 'afternoon' ? 'Chiều' : 'Tối'}:
                                </span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {days.map(day => (
                                        <button
                                            key={day} type="button" className={`btn glass ${formData.schedule[period].includes(day) ? 'active' : ''}`}
                                            style={{
                                                padding: '4px 8px', fontSize: '0.7rem', flex: 1,
                                                background: formData.schedule[period].includes(day) ? 'var(--primary)' : 'var(--glass)',
                                                color: formData.schedule[period].includes(day) ? 'white' : 'var(--text-secondary)'
                                            }}
                                            onClick={() => toggleDay(period, day)}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>Hủy</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{initialData ? 'Cập nhật' : 'Tạo lớp học'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddClassModal;
