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
            <div className="modal-content glass card animate-slide-up" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>{initialData ? 'Chỉnh sửa Khuyến mãi' : 'Thêm Khuyến mãi Mới'}</h2>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Lớp học áp dụng</label>
                        <select
                            className="glass"
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

                    <div className="form-group">
                        <label className="form-label">Tháng áp dụng</label>
                        <input
                            type="month"
                            className="glass"
                            value={formData.month}
                            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phần trăm giảm giá (%)</label>
                        <input
                            type="number"
                            className="glass"
                            min="0"
                            max="100"
                            value={formData.discountRate}
                            onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mô tả chương trình (tùy chọn)</label>
                        <textarea
                            className="glass"
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ví dụ: Giảm giá nhân dịp khai trương..."
                        />
                    </div>

                    <div className="modal-footer" style={{ marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass">
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> {initialData ? 'Cập nhật' : 'Lưu khuyến mãi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPromotionModal;
