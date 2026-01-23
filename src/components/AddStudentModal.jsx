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



    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            birthYear: parseInt(formData.birthYear),
            discountRate: parseFloat(formData.discountRate) / 100
        };
        if (initialData) {
            onUpdate(initialData.id, data);
        } else {
            onAdd(data);
        }
        onClose();
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="modal-content glass card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                    <X size={24} />
                </button>
                <h2 style={{ marginBottom: '1.5rem' }}>{initialData ? 'Chỉnh sửa học viên' : 'Thêm học viên mới'}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="form-label">Họ tên</label>
                        <input
                            className="glass" type="text" required
                            style={{ width: '100%', padding: '0.75rem', color: 'white' }}
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label">Số điện thoại</label>
                        <input
                            className="glass" type="text"
                            placeholder="Ví dụ: 0912345678"
                            style={{ width: '100%', padding: '0.75rem', color: 'white' }}
                            value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">Năm sinh</label>
                            <input
                                className="glass" type="number" required
                                style={{ width: '100%', padding: '0.75rem', color: 'white' }}
                                value={formData.birthYear} onChange={e => setFormData({ ...formData, birthYear: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Lớp học</label>
                            <select
                                className="glass" style={{ width: '100%', padding: '0.75rem', color: 'white' }}
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
                                style={{ width: '100%', padding: '0.75rem', color: 'white' }}
                                value={formData.discountRate} onChange={e => setFormData({ ...formData, discountRate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Ngày nhập học</label>
                            <input
                                className="glass" type="date"
                                style={{ width: '100%', padding: '0.75rem', color: 'white' }}
                                value={formData.enrollDate} onChange={e => setFormData({ ...formData, enrollDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Trạng thái</label>
                        <select
                            className="glass" style={{ width: '100%', padding: '0.75rem', color: 'white' }}
                            value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Mới nhập học">Mới nhập học</option>
                            <option value="Đang học">Đang học</option>
                            <option value="Đã nghỉ">Đã nghỉ</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>Hủy</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu học viên</button>
                    </div>
                </form>
            </div>
            <style>{`
        .form-label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary); }
        input.glass, select.glass { border: 1px solid var(--glass-border); border-radius: 8px; outline: none; }
        option { background: var(--bg-dark); }
      `}</style>
        </div>
    );
};

export default AddStudentModal;
