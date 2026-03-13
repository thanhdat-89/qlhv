import { useState, useEffect, useMemo } from 'react';
import { X, Save, Percent, DollarSign, Search } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const AddStudentPromotionModal = ({ students = [], onAdd, onUpdate, onClose, initialData }) => {
    const { showToast } = useNotification();
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        studentId: '',
        month: new Date().toISOString().substring(0, 7),
        discountType: 'percent',
        discountRate: 0,
        discountAmount: 0,
        description: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                studentId: initialData.studentId || '',
                month: initialData.month || '',
                discountType: initialData.discountType || 'percent',
                discountRate: (initialData.discountRate || 0) * 100,
                discountAmount: initialData.discountAmount || 0,
                description: initialData.description || ''
            });
        }
    }, [initialData]);

    const filteredStudents = useMemo(() =>
        students
            .filter(s => s.status !== 'Đã nghỉ' && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
        [students, searchQuery]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.studentId) {
            showToast('Vui lòng chọn học viên.', 'warning');
            return;
        }
        if (formData.discountType === 'percent' && (formData.discountRate <= 0 || formData.discountRate > 100)) {
            showToast('Phần trăm giảm giá phải từ 1 đến 100.', 'warning');
            return;
        }
        if (formData.discountType === 'amount' && formData.discountAmount <= 0) {
            showToast('Số tiền giảm giá phải lớn hơn 0.', 'warning');
            return;
        }

        const payload = {
            studentId: formData.studentId,
            month: formData.month,
            discountType: formData.discountType,
            discountRate: formData.discountType === 'percent' ? formData.discountRate / 100 : 0,
            discountAmount: formData.discountType === 'amount' ? parseFloat(formData.discountAmount) : 0,
            description: formData.description
        };

        try {
            if (initialData) {
                await onUpdate(initialData.id, payload);
            } else {
                await onAdd(payload);
            }
            onClose();
        } catch (err) { /* handled by actions */ }
    };

    const tabStyle = (active) => ({
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        padding: '0.55rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.2s ease', border: 'none',
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'white' : 'var(--text-secondary)',
        boxShadow: active ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none',
    });

    const selectedStudent = students.find(s => s.id === formData.studentId);

    return (
        <div className="modal-overlay">
            <div className="modal-content card" style={{ maxWidth: '470px', width: '90%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <button onClick={onClose} className="btn-close-modal"><X size={24} /></button>

                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                    {initialData ? 'Chỉnh sửa Ưu đãi Học viên' : 'Thêm Ưu đãi Học viên'}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Student selector */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '0.6rem', display: 'block' }}>Chọn học viên</label>
                        {/* Search box */}
                        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="glass"
                                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                                placeholder="Tìm tên học viên..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                disabled={!!initialData}
                            />
                        </div>
                        <div style={{
                            maxHeight: '160px', overflowY: 'auto',
                            border: '1.5px solid var(--glass-border)', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)', padding: '0.4rem'
                        }}>
                            {filteredStudents.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', padding: '1rem' }}>Không tìm thấy học viên.</p>
                            ) : filteredStudents.map(s => {
                                const isSelected = formData.studentId === s.id;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => !initialData && setFormData(f => ({ ...f, studentId: s.id }))}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                                            padding: '0.45rem 0.75rem', borderRadius: '8px', cursor: initialData ? 'default' : 'pointer',
                                            background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
                                            border: `1.5px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
                                            transition: 'background 0.15s', userSelect: 'none'
                                        }}
                                        onMouseEnter={e => { if (!isSelected && !initialData) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                                            background: isSelected ? 'var(--primary)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {isSelected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'white' }} />}
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--primary)' : 'var(--text-primary)', flex: 1 }}>
                                            {s.name}
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{s.className}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {selectedStudent && (
                            <p style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--primary)' }}>
                                ✓ Đã chọn: <strong>{selectedStudent.name}</strong> — {selectedStudent.className}
                            </p>
                        )}
                    </div>

                    {/* Month */}
                    <div>
                        <label className="form-label">Tháng áp dụng</label>
                        <input
                            type="month" className="glass" required
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            value={formData.month}
                            onChange={e => setFormData({ ...formData, month: e.target.value })}
                        />
                    </div>

                    {/* Discount type */}
                    <div>
                        <label className="form-label" style={{ marginBottom: '0.6rem', display: 'block' }}>Loại giảm giá</label>
                        <div style={{
                            display: 'flex', gap: '0.25rem',
                            background: 'rgba(255,255,255,0.05)', border: '1.5px solid var(--glass-border)',
                            borderRadius: '12px', padding: '0.25rem',
                        }}>
                            <button type="button" style={tabStyle(formData.discountType === 'percent')} onClick={() => setFormData({ ...formData, discountType: 'percent' })}>
                                <Percent size={15} /> Phần trăm (%)
                            </button>
                            <button type="button" style={tabStyle(formData.discountType === 'amount')} onClick={() => setFormData({ ...formData, discountType: 'amount' })}>
                                <DollarSign size={15} /> Số tiền (đ)
                            </button>
                        </div>
                    </div>

                    {/* Discount value */}
                    {formData.discountType === 'percent' ? (
                        <div>
                            <label className="form-label">Phần trăm giảm giá (%)</label>
                            <input
                                type="number" className="glass" required min="1" max="100"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                                value={formData.discountRate}
                                onChange={e => setFormData({ ...formData, discountRate: parseFloat(e.target.value) || 0 })}
                                placeholder="Ví dụ: 10 (nghĩa là giảm 10%)"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="form-label">Số tiền giảm (đ)</label>
                            <input
                                type="number" className="glass" required min="1000" step="1000"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                                value={formData.discountAmount}
                                onChange={e => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                                placeholder="Ví dụ: 50000"
                            />
                            {formData.discountAmount > 0 && (
                                <p style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--success)' }}>
                                    → Giảm: {parseFloat(formData.discountAmount).toLocaleString('vi-VN')} đ / tháng
                                </p>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="form-label">Mô tả (tùy chọn)</label>
                        <textarea
                            className="glass" rows="2"
                            style={{ width: '100%', resize: 'none', boxSizing: 'border-box' }}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ví dụ: Ưu đãi tháng khai giảng..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>Hủy</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Save size={18} /> {initialData ? 'Cập nhật' : 'Lưu ưu đãi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentPromotionModal;
