import { useState } from 'react';
import { X } from 'lucide-react';

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
        enrollDate: new Date().toISOString().split('T')[0]
    });


    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = {
                ...formData,
                birthYear: parseInt(formData.birthYear),
                discountRate: parseFloat(formData.discountRate) / 100
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
            <div className="modal-content card" style={{ maxWidth: '500px' }}>
                <button onClick={onClose} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                    <X size={24} />
                </button>
                <h2 style={{ marginBottom: '1.5rem' }}>{initialData ? 'Chỉnh sửa học viên' : 'Thêm học viên mới'}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="form-label">Họ tên</label>
                        <input
                            className="glass" type="text" required
                            style={{ width: '100%', padding: '0.75rem' }}
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label">Số điện thoại</label>
                        <input
                            className="glass" type="text"
                            placeholder="Ví dụ: 0912345678"
                            style={{ width: '100%', padding: '0.75rem' }}
                            value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">Năm sinh</label>
                            <input
                                className="glass" type="number" required
                                style={{ width: '100%', padding: '0.75rem' }}
                                value={formData.birthYear} onChange={e => setFormData({ ...formData, birthYear: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Lớp học</label>
                            <select
                                className="glass" style={{ width: '100%', padding: '0.75rem' }}
                                value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })}
                            >
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">Giảm giá (%)</label>
                            <input
                                className="glass" type="number"
                                style={{ width: '100%', padding: '0.75rem' }}
                                value={formData.discountRate} onChange={e => setFormData({ ...formData, discountRate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Ngày nhập học</label>
                            <input
                                className="glass" type="date"
                                style={{ width: '100%', padding: '0.75rem' }}
                                value={formData.enrollDate} onChange={e => setFormData({ ...formData, enrollDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Trạng thái</label>
                        <select
                            className="glass" style={{ width: '100%', padding: '0.75rem' }}
                            value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Mới nhập học">Mới nhập học</option>
                            <option value="Đang học">Đang học</option>
                            <option value="Đã nghỉ">Đã nghỉ</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>Hủy</button>
                        <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
                            {isSubmitting ? 'Đang lưu...' : 'Lưu học viên'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;
