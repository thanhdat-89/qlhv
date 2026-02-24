import { useState } from 'react';
import { X, UserPlus, Save } from 'lucide-react';

const AddStudentModal = ({ classes, onAdd, onUpdate, onClose, initialData }) => {
    const [formData, setFormData] = useState(initialData ? {
        ...initialData,
        discountRate: initialData.discountRate * 100 // Convert back to percentage for UI
    } : {
        name: '',
        birthYear: new Date().getFullYear() - 10,
        phone: '',
        classId: classes[0]?.id || '',
        status: 'Mới nhập học',
        discountRate: 0,
        enrollDate: new Date().toISOString().split('T')[0],
        leaveDate: ''
    });


    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = {
                ...formData,
                birthYear: parseInt(formData.birthYear),
                discountRate: parseFloat(formData.discountRate) / 100,
                leaveDate: formData.status === 'Đã nghỉ' ? formData.leaveDate : null
            };
            if (initialData) {
                await onUpdate(initialData.id, data);
            } else {
                await onAdd(data);
            }
            onClose();
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card" style={{ maxWidth: '500px', width: '90%', padding: '1.25rem' }}>
                <button onClick={onClose} className="btn-close-modal">
                    <X size={24} />
                </button>
                <h2 style={{ marginBottom: '1.5rem' }}>{initialData ? 'Chỉnh sửa học viên' : 'Thêm học viên mới'}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="form-label">Họ tên</label>
                        <input
                            className="glass" type="text" required
                            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label">Số điện thoại</label>
                        <input
                            className="glass" type="text"
                            placeholder="Ví dụ: 0912345678"
                            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                            value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div className="form-grid">
                        <div>
                            <label className="form-label">Năm sinh</label>
                            <input
                                className="glass" type="number" required
                                style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                                value={formData.birthYear} onChange={e => setFormData({ ...formData, birthYear: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Lớp học</label>
                            <select
                                className="glass" style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                                value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })}
                            >
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-grid">
                        <div style={{ position: 'relative' }}>
                            <label className="form-label">Ưu đãi, giảm giá (%)</label>
                            <input
                                className="glass" type="number"
                                style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                                value={formData.discountRate} onChange={e => setFormData({ ...formData, discountRate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Ngày nhập học</label>
                            <input
                                className="glass" type="date"
                                style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                                value={formData.enrollDate} onChange={e => setFormData({ ...formData, enrollDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {parseFloat(formData.discountRate) > 0 && (
                        <div className="animate-fade-in">
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Tháng áp dụng ưu đãi</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                                    Lưu ý: Ưu đãi cũ mặc định đến 07/2026
                                </span>
                            </label>
                            <div className="glass" style={{
                                padding: '1rem',
                                maxHeight: '160px',
                                overflowY: 'auto',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                gap: '0.5rem'
                            }}>
                                {(() => {
                                    const months = [];
                                    const current = new Date();
                                    for (let i = -2; i <= 24; i++) {
                                        const d = new Date(current.getFullYear(), current.getMonth() + i, 1);
                                        const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                        months.push(mStr);
                                    }
                                    return months.map(m => {
                                        const isSelected = formData.discountMonths?.includes(m);
                                        return (
                                            <label key={m} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: '8px',
                                                background: isSelected ? 'var(--primary-light)' : 'rgba(255,255,255,0.3)',
                                                border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                                                color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                                                fontWeight: isSelected ? 600 : 400,
                                                transition: 'all 0.2s'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        const currentMonths = formData.discountMonths || [];
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, discountMonths: [...currentMonths, m] });
                                                        } else {
                                                            setFormData({ ...formData, discountMonths: currentMonths.filter(x => x !== m) });
                                                        }
                                                    }}
                                                    style={{ display: 'none' }}
                                                />
                                                {m.split('-').reverse().join('/')}
                                            </label>
                                        );
                                    });
                                })()}
                            </div>
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                <button type="button" className="btn btn-glass btn-sm" onClick={() => {
                                    const months = [];
                                    const current = new Date();
                                    for (let i = 0; i < 12; i++) {
                                        const d = new Date(current.getFullYear(), current.getMonth() + i, 1);
                                        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                                    }
                                    setFormData({ ...formData, discountMonths: months });
                                }}>Chọn 12 tháng tới</button>
                                <button type="button" className="btn btn-glass btn-sm" onClick={() => setFormData({ ...formData, discountMonths: [] })}>Bỏ chọn tất cả</button>
                            </div>
                        </div>
                    )}

                    <div className="form-grid">
                        <div>
                            <label className="form-label">Trạng thái</label>
                            <select
                                className="glass" style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                                value={formData.status} onChange={e => {
                                    const newStatus = e.target.value;
                                    setFormData({
                                        ...formData,
                                        status: newStatus,
                                        leaveDate: newStatus === 'Đã nghỉ' && !formData.leaveDate ? new Date().toISOString().split('T')[0] : formData.leaveDate
                                    });
                                }}
                            >
                                <option value="Mới nhập học">Mới nhập học</option>
                                <option value="Đang học">Đang học</option>
                                <option value="Đã nghỉ">Đã nghỉ</option>
                            </select>
                        </div>
                        {formData.status === 'Đã nghỉ' && (
                            <div>
                                <label className="form-label">Ngày nghỉ học</label>
                                <input
                                    className="glass" type="date" required
                                    style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                                    value={formData.leaveDate || ''} onChange={e => setFormData({ ...formData, leaveDate: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>Hủy</button>
                        <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Save size={18} /> {isSubmitting ? 'Đang lưu...' : 'Lưu học viên'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;
