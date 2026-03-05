import { createContext, useState, useContext, useCallback } from 'react';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const NotificationContext = createContext(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState(null);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                setToasts(prev => prev.filter(toast => toast.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfirmState({
                ...options,
                onConfirm: () => {
                    setConfirmState(null);
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmState(null);
                    resolve(false);
                }
            });
        });
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast, confirm }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
            {confirmState && (
                <ConfirmModal
                    title={confirmState.title || 'Xác nhận'}
                    message={confirmState.message}
                    confirmText={confirmState.confirmText || 'Xác nhận'}
                    cancelText={confirmState.cancelText || 'Hủy'}
                    type={confirmState.type || 'primary'}
                    onConfirm={confirmState.onConfirm}
                    onCancel={confirmState.onCancel}
                />
            )}
            <style>{`
                .toast-container {
                    position: fixed;
                    top: 1.5rem;
                    right: 1.5rem;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    pointer-events: none;
                }
                @media (max-width: 640px) {
                    .toast-container {
                        top: auto;
                        bottom: 1.5rem;
                        left: 1.5rem;
                        right: 1.5rem;
                        align-items: center;
                    }
                }
            `}</style>
        </NotificationContext.Provider>
    );
};
