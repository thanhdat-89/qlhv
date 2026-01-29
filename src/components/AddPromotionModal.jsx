import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const AddPromotionModal = ({ classes, onAdd, onUpdate, onClose, initialData }) => {
    const [formData, setFormData] = useState({
        classId: '',
        month: '',
        discountRate: 0,
        description: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                classId: initialData.classId || '',
                month: initialData.month || '',
                discountRate: (initialData.discountRate || 0) * 100,
                description: initialData.description || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const submissionData = {
            ...formData,
            discountRate: formData.discountRate / 100
        };

        try {
            if (initialData) {
                await onUpdate(initialData.id, submissionData);
            } else {
                await onAdd(submissionData);
            }
            onClose();
        } catch (error) {
            // Error handling is managed by the action
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card" style={{ maxWidth: '400px', width: '90%', padding: '1.25rem' }}>
                <button onClick={onClose} className="btn-close-modal">
                    <X size={24} />
                </button>

                <h2 style={{ marginBottom: '1.5rem' }}>
                    {initialData ? 'Chỉnh sửa Khuyến mãi' : 'Thêm Khuyến mãi Mới'}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="form-label">Lớp học áp dụng</label>
                        <select
                            className="glass"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            value={formData.classId}
                            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                            required
                        >
                            <option value="">Chọn lớp học...</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="form-label">Tháng áp dụng</label>
                        <input
                            type="month"
                            className="glass"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            value={formData.month}
                            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label">Phần trăm giảm giá (%)</label>
                        <input
                            type="number"
                            className="glass"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            min="0"
                            max="100"
                            value={formData.discountRate}
                            onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) })}
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label">Mô tả chương trình (tùy chọn)</label>
                        <textarea
                            className="glass"
                            style={{ width: '100%', resize: 'none', boxSizing: 'border-box' }}
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ví dụ: Giảm giá nhân dịp khai trương..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Save size={18} /> {initialData ? 'Cập nhật' : 'Lưu khuyến mãi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPromotionModal;
