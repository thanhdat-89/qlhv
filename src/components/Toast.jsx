import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const iconMap = {
        success: <CheckCircle size={18} color="var(--success)" />,
        error: <XCircle size={18} color="var(--danger)" />,
        warning: <AlertTriangle size={18} color="var(--warning)" />,
        info: <Info size={18} color="var(--primary)" />
    };

    const bgColorMap = {
        success: 'rgba(22, 163, 74, 0.1)',
        error: 'rgba(220, 38, 38, 0.1)',
        warning: 'rgba(217, 119, 6, 0.1)',
        info: 'rgba(79, 70, 229, 0.1)'
    };

    return (
        <div className={`toast-item ${isVisible ? 'visible' : ''}`} style={{
            background: 'white',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${bgColorMap[type]}`,
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            pointerEvents: 'auto',
            minWidth: '280px',
            maxWidth: '100%',
        }}>
            <div className="toast-icon">
                {iconMap[type]}
            </div>
            <div className="toast-message" style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                flex: 1
            }}>
                {message}
            </div>
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    padding: '0.25rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}
                className="toast-close-btn"
            >
                <X size={14} />
            </button>
            <style>{`
                .toast-item {
                    opacity: 0;
                    transform: translateY(-10px) scale(0.95);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .toast-item.visible {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                .toast-close-btn:hover {
                    background: #f1f5f9;
                    color: var(--text-primary);
                }
                @media (max-width: 640px) {
                    .toast-item.visible {
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default Toast;
