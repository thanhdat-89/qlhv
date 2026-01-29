import { useState } from 'react';
import { Download, Upload, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { backupService } from '../services/backupService';

const Settings = ({ db }) => {
    const { actions, automatedBackups } = db;
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState(null);

    const handleBackup = async () => {
        setIsProcessing(true);
        setMessage({ type: 'info', text: 'Đang chuẩn bị dữ liệu sao lưu...' });
        try {
            const data = await backupService.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `backup_quanlyhocvien_${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setMessage({ type: 'success', text: 'Sao lưu dữ liệu thành công!' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Lỗi khi sao lưu dữ liệu: ' + error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadBackup = async (backupId) => {
        setIsProcessing(true);
        try {
            const data = await backupService.downloadBackup(backupId);
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setMessage({ type: 'success', text: 'Tải file sao lưu tự động thành công!' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Lỗi khi tải file sao lưu: ' + error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRestore = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm('CẢNH BÁO: Việc khôi phục sẽ XÓA TOÀN BỘ dữ liệu hiện tại và thay thế bằng dữ liệu từ file sao lưu. Bạn có chắc chắn muốn tiếp tục?')) {
            event.target.value = '';
            return;
        }

        setIsProcessing(true);
        setMessage({ type: 'info', text: 'Đang khôi phục dữ liệu... Vui lòng không đóng trình duyệt.' });
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    await backupService.importData(backup);
                    await actions.refreshData();
                    setMessage({ type: 'success', text: 'Khôi phục dữ liệu thành công! Ứng dụng đã được cập nhật.' });
                } catch (error) {
                    console.error(error);
                    setMessage({ type: 'error', text: 'Lỗi khi khôi phục dữ liệu: ' + error.message });
                } finally {
                    setIsProcessing(false);
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Lỗi khi đọc file: ' + error.message });
            setIsProcessing(false);
        }
        event.target.value = '';
    };

    return (
        <div className="settings-view" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                Cài đặt hệ thống
            </h1>

            <div className="glass card" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Sao lưu & Khôi phục</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Bạn nên thường xuyên sao lưu dữ liệu để tránh mất mát trong trường hợp có sự cố.
                    File sao lưu sẽ chứa toàn bộ thông tin học viên, lớp học, học phí và lịch trình.
                </p>

                {message && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' :
                            message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                        color: message.type === 'success' ? 'var(--success)' :
                            message.type === 'error' ? 'var(--danger)' : 'var(--primary)',
                        border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' :
                            message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`
                    }}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> :
                            message.type === 'error' ? <AlertCircle size={20} /> : <AlertCircle size={20} />}
                        <span>{message.text}</span>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                            <Download size={24} />
                            <h3 style={{ margin: 0 }}>Sao lưu</h3>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Tải về toàn bộ dữ liệu hiện tại dưới dạng file JSON.
                        </p>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={handleBackup}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Đang xử lý...' : 'Tải file sao lưu'}
                        </button>
                    </div>

                    <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--danger)' }}>
                            <Upload size={24} />
                            <h3 style={{ margin: 0 }}>Khôi phục</h3>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Chọn file sao lưu (.json) để ghi đè dữ liệu hiện tại.
                        </p>
                        <label className="btn btn-glass" style={{
                            width: '100%',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            justifyContent: 'center',
                            borderColor: 'rgba(239, 68, 68, 0.2)',
                            color: 'var(--danger)'
                        }}>
                            <Upload size={20} />
                            {isProcessing ? 'Đang xử lý...' : 'Chọn file khôi phục'}
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleRestore}
                                style={{ display: 'none' }}
                                disabled={isProcessing}
                            />
                        </label>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)', display: 'flex', gap: '1rem' }}>
                    <ShieldAlert size={24} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--warning)', display: 'block', marginBottom: '0.25rem' }}>Lưu ý quan trọng:</strong>
                        Việc khôi phục dữ liệu sẽ không thể hoàn tác. Hãy chắc chắn rằng bạn đang sử dụng đúng file sao lưu gần nhất.
                    </div>
                </div>
            </div>

            <div className="glass card" style={{ padding: '2rem', marginTop: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Lịch sử sao lưu tự động (Thứ 2 hàng tuần)</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    Hệ thống tự động sao lưu dữ liệu vào mỗi Thứ 2. Các bản sao lưu sẽ tự động được xóa sau 28 ngày.
                </p>

                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Ngày sao lưu</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Tên file</th>
                                <th style={{ textAlign: 'right', padding: '1rem' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {automatedBackups.length > 0 ? (
                                automatedBackups.map(backup => (
                                    <tr key={backup.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                                            {new Date(backup.created_at).toLocaleDateString('vi-VN', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            {backup.filename}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                className="btn btn-glass"
                                                onClick={() => handleDownloadBackup(backup.id)}
                                                disabled={isProcessing}
                                                style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                                            >
                                                <Download size={14} /> Tải xuống
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        Chưa có bản sao lưu tự động nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Settings;
