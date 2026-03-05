import { AlertTriangle, HelpCircle, AlertCircle } from 'lucide-react';

const ConfirmModal = ({
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    type = 'primary',
    onConfirm,
    onCancel
}) => {

    const iconMap = {
        primary: <HelpCircle size={32} color="var(--primary)" />,
        danger: <AlertCircle size={32} color="var(--danger)" />,
        warning: <AlertTriangle size={32} color="var(--warning)" />
    };

    const confirmBtnStyle = {
        background: type === 'danger' ? 'var(--danger)' :
            type === 'warning' ? 'var(--warning)' :
                'var(--primary)',
        color: 'white'
    };

    const iconBgStyle = {
        background: type === 'danger' ? 'rgba(220, 38, 38, 0.1)' :
            type === 'warning' ? 'rgba(217, 119, 6, 0.1)' :
                'rgba(79, 70, 229, 0.1)'
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 10001 }}>
            <div className="modal-content card" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center' }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    ...iconBgStyle,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    {iconMap[type]}
                </div>

                <h2 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>{title}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={onCancel} className="btn btn-glass" style={{ flex: 1, justifyContent: 'center' }}>
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className="btn" style={{ flex: 1, justifyContent: 'center', ...confirmBtnStyle }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
