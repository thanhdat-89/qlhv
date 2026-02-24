import { useState } from 'react';
import { Plus, Edit2, Trash2, Gift, Calendar, Filter, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import AddPromotionModal from '../components/AddPromotionModal';

const Promotions = ({ db }) => {
    const { promotions, classes, actions, students } = db;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
    const [activeTab, setActiveTab] = useState('class'); // 'class' or 'student'

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

    // Students with discountRate > 0
    const studentsWithDiscount = students.filter(s => s.discountRate > 0)
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="view-container animate-fade-in">
            <div className="view-header">
                <div>
                    <h1>Khuyến mãi & Giảm giá</h1>
                    <p className="text-secondary">Quản lý các chương trình ưu đãi theo lớp và từng học viên.</p>
                </div>
                {activeTab === 'class' && (
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Thêm khuyến mãi
                    </button>
                )}
            </div>

            <div className="tab-group" style={{ marginBottom: '2rem' }}>
                <button
                    className={`tab-item ${activeTab === 'class' ? 'active' : ''}`}
                    onClick={() => setActiveTab('class')}
                >
                    Ưu đãi theo Lớp
                </button>
                <button
                    className={`tab-item ${activeTab === 'student' ? 'active' : ''}`}
                    onClick={() => setActiveTab('student')}
                >
                    Ưu đãi Học viên
                </button>
            </div>

            {activeTab === 'class' ? (
                <>
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
                </>
            ) : (
                <div className="table-container glass">
                    <table>
                        <thead>
                            <tr>
                                <th>Học viên</th>
                                <th>Lớp</th>
                                <th style={{ textAlign: 'center' }}>Mức giảm trực tiếp</th>
                                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentsWithDiscount.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                                    <td>
                                        <span className="label label-glass">{s.className}</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="label label-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Gift size={14} />
                                            -{s.discountRate * 100}%
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`label ${s.status === 'Đang học' ? 'label-success' : 'label-warning'}`} style={{ fontSize: '0.75rem' }}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn btn-glass btn-sm"
                                            onClick={() => navigate('/students', { state: { editStudentId: s.id } })}
                                        >
                                            Chỉnh sửa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {studentsWithDiscount.length === 0 && (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <div className="glass shadow-lg" style={{ display: 'inline-block', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem' }}>
                                <Users size={40} color="var(--text-secondary)" />
                            </div>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Hiện không có học viên nào được hưởng ưu đãi riêng.
                            </p>
                        </div>
                    )}
                </div>
            )}

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
