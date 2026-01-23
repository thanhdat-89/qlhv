import { useState } from 'react';
import { X, Calendar, Plus, Trash2 } from 'lucide-react';

const AddHolidayModal = ({ onAdd, onClose, classes }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        description: '',
        type: 'Nghỉ Lễ',
        classId: ''
    });
    const [isMultiDay, setIsMultiDay] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submissionData = {
                ...formData,
                endDate: isMultiDay ? formData.endDate : formData.date,
                classId: formData.type === 'Nghỉ Lễ' ? '' : formData.classId
            };
            await onAdd(submissionData);
            onClose();
        } catch (error) {
            console.error('Holiday addition error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="modal-content glass card" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                    <X size={24} />
                </button>
                <h2 style={{ marginBottom: '1.5rem' }}>Thêm Ngày Nghỉ</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="form-label">Ngày nghỉ (Bắt đầu)</label>
                        <input
                            className="glass" type="date" required
                            style={{ width: '100%', padding: '0.75rem', color: 'white' }}
                            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value, endDate: e.target.value > formData.endDate ? e.target.value : formData.endDate })}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <input
                            type="checkbox" id="isMultiDay"
                            checked={isMultiDay} onChange={e => setIsMultiDay(e.target.checked)}
                            style={{ width: '1.25rem', height: '1.25rem' }}
                        />
                        <label htmlFor="isMultiDay" className="form-label" style={{ marginBottom: 0 }}>Nghỉ nhiều ngày</label>
                    </div>

                    {isMultiDay && (
                        <div style={{ animation: 'fadeIn 0.2s ease' }}>
                            <label className="form-label">Ngày kết thúc</label>
                            <input
                                className="glass" type="date" required
                                style={{ width: '100%', padding: '0.75rem', color: 'white' }}
                                min={formData.date}
                                value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    )}
                    <div>
                        <label className="form-label">Loại nghỉ</label>
                        <select
                            className="glass" style={{ width: '100%', padding: '0.75rem', color: 'white' }}
                            value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="Nghỉ Lễ">Nghỉ Lễ (Tất cả các lớp)</option>
                            <option value="Nghỉ đột xuất">Nghỉ đột xuất (Bận/Ốm...)</option>
                        </select>
                    </div>

                    {formData.type === 'Nghỉ đột xuất' && (
                        <div>
                            <label className="form-label">Áp dụng cho</label>
                            <select
                                className="glass" style={{ width: '100%', padding: '0.75rem', color: 'white' }}
                                value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })}
                            >
                                <option value="">Tất cả các lớp</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="form-label">Mô tả / Lý do</label>
                        <textarea
                            className="glass" rows="2"
                            style={{ width: '100%', padding: '0.75rem', color: 'white', resize: 'none' }}
                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ví dụ: Tết Nguyên Đán, Nghỉ ốm..."
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>Hủy</button>
                        <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
                            {isSubmitting ? 'Đang thêm...' : 'Thêm lịch nghỉ'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                .form-label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary); }
                .glass { background: var(--glass); border: 1px solid var(--glass-border); border-radius: 8px; outline: none; }
            `}</style>
        </div>
    );
};

export default AddHolidayModal;
