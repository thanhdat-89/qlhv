import { useState } from 'react';
import { Plus, Edit2, Trash2, Gift, Calendar, Filter } from 'lucide-react';
import AddPromotionModal from '../components/AddPromotionModal';

const Promotions = ({ db }) => {
    const { promotions, classes, actions } = db;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('');

    const handleEdit = (promotion) => {
        setEditingPromotion(promotion);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPromotion(null);
    };

    const getClassName = (classId) => {
        return classes.find(c => c.id === classId)?.name || 'N/A';
    };

    const filteredPromotions = selectedMonth
        ? promotions.filter(p => p.month === selectedMonth)
        : promotions;

    // Sort by month (descending) and then class name
    const sortedPromotions = [...filteredPromotions].sort((a, b) => {
        if (a.month !== b.month) return b.month.localeCompare(a.month);
        return getClassName(a.classId).localeCompare(getClassName(b.classId));
    });

    return (
        <div className="view-container animate-fade-in">
            <div className="view-header">
                <div>
                    <h1>Khuyến mãi & Giảm giá</h1>
                    <p className="text-secondary">Quản lý các chương trình ưu đãi theo từng lớp và tháng.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} /> Thêm khuyến mãi
                </button>
            </div>

            <div className="filter-container glass card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={18} color="var(--primary)" />
                        <span style={{ fontWeight: 500 }}>Lọc theo tháng:</span>
                    </div>
                    <input
                        type="month"
                        className="glass"
                        style={{ width: '200px' }}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                    {selectedMonth && (
                        <button className="btn btn-glass btn-sm" onClick={() => setSelectedMonth('')}>
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            </div>

            <div className="table-container glass">
                <table>
                    <thead>
                        <tr>
                            <th>Tháng</th>
                            <th>Lớp học</th>
                            <th style={{ textAlign: 'center' }}>Mức giảm</th>
                            <th>Mô tả</th>
                            <th style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPromotions.map((p) => (
                            <tr key={p.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={16} color="var(--secondary)" />
                                        <span style={{ fontWeight: 600 }}>{p.month}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="label label-primary">{getClassName(p.classId)}</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <div className="label label-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Gift size={14} />
                                        {p.discountRate * 100}%
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)', maxWidth: '300px' }}>
                                    {p.description || '-'}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleEdit(p)}
                                            className="btn btn-glass p-2"
                                        >
                                            <Edit2 size={16} color="var(--primary)" />
                                        </button>
                                        <button
                                            onClick={() => actions.deletePromotion(p.id)}
                                            className="btn btn-glass p-2"
                                        >
                                            <Trash2 size={16} color="var(--danger)" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedPromotions.length === 0 && (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div className="glass shadow-lg" style={{ display: 'inline-block', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem' }}>
                            <Gift size={40} color="var(--text-secondary)" />
                        </div>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Chưa có chương trình khuyến mãi nào được thiết lập.
                        </p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <AddPromotionModal
                    classes={classes}
                    onAdd={actions.addPromotion}
                    onUpdate={actions.updatePromotion}
                    onClose={handleCloseModal}
                    initialData={editingPromotion}
                />
            )}
        </div>
    );
};

export default Promotions;
