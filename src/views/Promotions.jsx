import { useState } from 'react';
import { Plus, Edit2, Trash2, Gift, Calendar, Filter, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import AddPromotionModal from '../components/AddPromotionModal';

const Promotions = ({ db }) => {
    const { promotions, classes, actions } = db;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

    const handlePrevMonth = () => {
        const date = new Date(selectedMonth + '-01');
        date.setMonth(date.getMonth() - 1);
        setSelectedMonth(date.toISOString().substring(0, 7));
    };

    const handleNextMonth = () => {
        const date = new Date(selectedMonth + '-01');
        date.setMonth(date.getMonth() + 1);
        setSelectedMonth(date.toISOString().substring(0, 7));
    };

    const handleCurrentMonth = () => {
        setSelectedMonth(new Date().toISOString().substring(0, 7));
    };

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

            <div className="filter-container glass card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Filter size={20} color="var(--primary)" />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Lọc theo tháng:</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="btn btn-glass" onClick={handlePrevMonth} style={{ padding: '0.5rem' }}>
                            <ChevronLeft size={20} />
                        </button>

                        <input
                            type="month"
                            className="glass"
                            style={{
                                width: '220px',
                                padding: '0.6rem 1rem',
                                textAlign: 'center',
                                fontWeight: 500
                            }}
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />

                        <button className="btn btn-glass" onClick={handleNextMonth} style={{ padding: '0.5rem' }}>
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-glass btn-sm" onClick={handleCurrentMonth} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={16} /> Hiện tại
                        </button>
                        {selectedMonth && (
                            <button className="btn btn-glass btn-sm" onClick={() => setSelectedMonth('')}>
                                Tất cả
                            </button>
                        )}
                    </div>
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
                                        <span style={{ fontWeight: 600 }}>{p.month.split('-').reverse().join('-')}</span>
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
                    onBulkAdd={actions.bulkAddPromotions}
                    onUpdate={actions.updatePromotion}
                    onClose={handleCloseModal}
                    initialData={editingPromotion}
                />
            )}
        </div>
    );
};

export default Promotions;
