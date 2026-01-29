import { useState } from 'react';
import { Send, Trash2, User, Clock, MessageSquare } from 'lucide-react';

const Messages = ({ db }) => {
    const { messages, actions } = db;
    const [newMsg, setNewMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMsg.trim()) return;

        setIsSubmitting(true);
        try {
            await actions.addMessage(newMsg.trim());
            setNewMsg('');
        } catch (error) {
            alert('Lỗi khi gửi tin nhắn: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;

        const password = window.prompt('Nhập mật khẩu quản lý để xóa:');
        if (password !== 'cqt263') {
            alert('Mật khẩu không chính xác!');
            return;
        }

        try {
            await actions.deleteMessage(id);
        } catch (error) {
            alert('Lỗi khi xóa tin nhắn: ' + error.message);
        }
    };

    return (
        <div className="view-container">
            <div className="view-header">
                <h1>Tin Nhắn Nội Bộ</h1>
            </div>

            <div className="messages-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '1.5rem', alignItems: 'start' }}>
                {/* Message Form */}
                <div className="glass card message-form-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                        <MessageSquare size={24} />
                        <h3 style={{ margin: 0 }}>Gửi tin mới</h3>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Nội dung tin nhắn</label>
                            <textarea
                                className="glass"
                                rows="5"
                                placeholder="Nhập nội dung tin nhắn tại đây..."
                                style={{ width: '100%', padding: '1rem', border: '1px solid var(--glass-border)', background: 'white' }}
                                value={newMsg}
                                onChange={(e) => setNewMsg(e.target.value)}
                                disabled={isSubmitting}
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            disabled={isSubmitting || !newMsg.trim()}
                        >
                            <Send size={18} /> {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                        </button>
                    </form>
                </div>

                {/* Message Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.length > 0 ? (
                        messages.map((msg) => (
                            <div key={msg.id} className="glass card" style={{ padding: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className="icon-box" style={{ width: '40px', height: '40px', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{msg.author}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                <Clock size={12} />
                                                <span>
                                                    {new Date(msg.created_at).toLocaleString('vi-VN', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-glass"
                                        style={{ padding: '0.5rem', color: 'var(--danger)' }}
                                        onClick={() => handleDelete(msg.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                                    {msg.content}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="glass card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>Chưa có tin nhắn nào. Hãy là người đầu tiên để lại lời nhắn!</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .message-form-container {
                    position: sticky;
                    top: 2rem;
                }

                @media (max-width: 768px) {
                    .messages-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .message-form-container {
                        position: relative;
                        top: 0;
                        margin-bottom: 1rem;
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Messages;
