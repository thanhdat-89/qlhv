import { useState } from 'react';
import { AlertOctagon } from 'lucide-react';

const DeleteStudentModal = ({ student, onDelete, onClose }) => {
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await onDelete(student.id, password);
            onClose();
        } catch (err) {
            setError(err.message || 'Mật khẩu không chính xác hoặc có lỗi xảy ra.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!student) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content card" style={{ maxWidth: '400px', width: '90%', padding: '1.5rem', border: '1px solid var(--danger)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                    }}>
                        <AlertOctagon size={32} color="var(--danger)" />
                    </div>
                    <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Xác nhận xóa học viên</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Bạn đang chuẩn bị đổi trạng thái học viên <strong>{student.name}</strong> sang "Đã xóa" và đưa vào thùng rác. Hành động này sẽ ẩn học viên khỏi danh sách chính.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="form-label">Mật khẩu quản lý</label>
                        <input
                            type="password"
                            required
                            placeholder="Nhập mật khẩu để xác nhận"
                            className="glass"
                            style={{
                                width: '100%', padding: '0.75rem', boxSizing: 'border-box',
                                border: error ? '1px solid var(--danger)' : '1px solid var(--glass-border)'
                            }}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-glass" style={{ flex: 1 }}>
                            Hủy bỏ
                        </button>
                        <button type="submit" disabled={isSubmitting || !password} className="btn" style={{ flex: 1, background: 'var(--danger)', color: 'white' }}>
                            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Xóa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteStudentModal;
