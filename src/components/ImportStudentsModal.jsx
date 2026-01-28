import { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const ImportStudentsModal = ({ classes, onImport, onClose }) => {
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [errors, setErrors] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef(null);

    const downloadTemplate = () => {
        const template = [
            {
                'Họ và tên': 'Nguyễn Văn A',
                'Lớp': classes[0]?.name || 'Toán 6',
                'Năm sinh': 2012,
                'Số điện thoại': '0912345678',
                'Giảm giá (%)': 10,
                'Ngày nhập học': '2024-01-22'
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(template);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, "mau_nhap_hoc_vien.xlsx");
    };

    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                // cellDates: true converts Excel date cells to JS Date objects
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                validateAndMapData(json);
            } catch (err) {
                setErrors(['Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.']);
                setParsedData([]);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsArrayBuffer(uploadedFile);
    };

    const parseExcelDate = (input) => {
        if (!input) return new Date().toISOString().split('T')[0];

        // If it's already a JS Date object (from cellDates: true)
        if (input instanceof Date) {
            if (isNaN(input.getTime())) return new Date().toISOString().split('T')[0];
            // Extract local parts directly to avoid timezone shift from toISOString()
            const y = input.getFullYear();
            const m = String(input.getMonth() + 1).padStart(2, '0');
            const d = String(input.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        // If it's a string, try parsing
        if (typeof input === 'string') {
            // Check for DD/MM/YYYY format which new Date() often fails at
            const parts = input.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (parts) {
                const day = parseInt(parts[1], 10);
                const month = parseInt(parts[2], 10) - 1;
                const year = parseInt(parts[3], 10);
                const date = new Date(year, month, day);
                return date.toISOString().split('T')[0];
            }

            const date = new Date(input);
            if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
        }

        return new Date().toISOString().split('T')[0];
    };

    const validateAndMapData = (data) => {
        const newParsedData = [];
        const newErrors = [];

        data.forEach((row, index) => {
            const rowNum = index + 2;
            const rowErrors = [];

            // 1. Validate Name
            const name = row['Họ và tên']?.toString().trim();
            if (!name) rowErrors.push(`Dòng ${rowNum}: Thiếu họ và tên.`);

            // 2. Validate Class
            const className = row['Lớp']?.toString().trim();
            const targetClass = classes.find(c => c.name.toLowerCase() === className?.toLowerCase());
            if (!className) {
                rowErrors.push(`Dòng ${rowNum}: Thiếu tên lớp.`);
            } else if (!targetClass) {
                rowErrors.push(`Dòng ${rowNum}: Lớp "${className}" không tồn tại.`);
            }

            // 3. Validate Birth Year
            const birthYear = parseInt(row['Năm sinh']);
            if (isNaN(birthYear)) rowErrors.push(`Dòng ${rowNum}: Năm sinh không hợp lệ.`);

            // 4. Optional Fields
            let phone = row['Số điện thoại']?.toString().trim() || '';
            if (phone && !phone.startsWith('0')) {
                phone = '0' + phone;
            }
            const discountRate = parseFloat(row['Giảm giá (%)']) || 0;
            const enrollDate = parseExcelDate(row['Ngày nhập học']);

            if (rowErrors.length === 0) {
                newParsedData.push({
                    name,
                    classId: targetClass.id,
                    className: targetClass.name,
                    birthYear,
                    phone,
                    discountRate: discountRate / 100, // Convert to decimal
                    enrollDate,
                    status: 'Mới nhập học'
                });
            } else {
                newErrors.push(...rowErrors);
            }
        });

        setParsedData(newParsedData);
        setErrors(newErrors);
    };

    const handleConfirmImport = async () => {
        if (parsedData.length > 0) {
            setIsProcessing(true);
            try {
                await onImport(parsedData);
                onClose();
            } catch (error) {
                // Error is handled by alert in useDatabase
                console.error('Import confirmation error:', error);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <button
                    onClick={onClose}
                    className="btn-close-modal"
                >
                    <X size={24} />
                </button>

                <div className="modal-header" style={{ marginBottom: '1.5rem', paddingRight: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="icon-circle primary"><FileSpreadsheet size={20} /></div>
                        <h2 style={{ margin: 0 }}>Nhập Học Viên Từ Excel</h2>
                    </div>
                </div>

                <div className="modal-body">
                    {/* Step 1: Download Template */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 className="form-label" style={{ fontSize: '1rem' }}>Bước 1: Tải file mẫu</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Sử dụng file mẫu để đảm bảo dữ liệu được nhập đúng định dạng.
                        </p>
                        <button className="btn btn-glass" onClick={downloadTemplate}>
                            <Download size={18} /> Tải file mẫu (.xlsx)
                        </button>
                    </div>

                    {/* Step 2: Upload File */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 className="form-label" style={{ fontSize: '1rem' }}>Bước 2: Tải lên file của bạn</h3>
                        <div
                            onClick={() => fileInputRef.current.click()}
                            style={{
                                border: '2px dashed var(--glass-border)',
                                borderRadius: '12px',
                                padding: '2rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                background: file ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".xlsx, .xls"
                                style={{ display: 'none' }}
                            />
                            <Upload size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                {file ? file.name : 'Nhấn để chọn file hoặc kéo thả vào đây'}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                Hỗ trợ định dạng .xlsx, .xls
                            </p>
                        </div>
                    </div>

                    {/* Step 3: Preview */}
                    {(parsedData.length > 0 || errors.length > 0) && (
                        <div>
                            <h3 className="form-label" style={{ fontSize: '1rem' }}>Bước 3: Kiểm tra và xác nhận</h3>

                            {errors.length > 0 && (
                                <div className="glass" style={{ borderLeft: '4px solid var(--danger)', padding: '1rem', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)' }}>
                                    <div style={{ display: 'flex', gap: '8px', color: 'var(--danger)', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        <AlertCircle size={18} /> Phát hiện {errors.length} lỗi:
                                    </div>
                                    <ul style={{ paddingLeft: '1.5rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            {parsedData.length > 0 && (
                                <>
                                    <div style={{ display: 'flex', gap: '8px', color: 'var(--success)', marginBottom: '1rem', fontWeight: 600 }}>
                                        <CheckCircle2 size={18} /> Có {parsedData.length} học viên hợp lệ để nhập:
                                    </div>
                                    <div className="table-container glass" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <table style={{ fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr>
                                                    <th>Họ và tên</th>
                                                    <th>Lớp</th>
                                                    <th style={{ textAlign: 'center' }}>Năm sinh</th>
                                                    <th>Điện thoại</th>
                                                    <th>Ngày nhập học</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedData.map((s, i) => (
                                                    <tr key={i}>
                                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td>
                                                        <td>{s.className}</td>
                                                        <td style={{ textAlign: 'center' }}>{s.birthYear}</td>
                                                        <td>{s.phone || '-'}</td>
                                                        <td>{new Date(s.enrollDate).toLocaleDateString('vi-VN')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-glass" onClick={onClose} style={{ minWidth: '120px' }}>Hủy bỏ</button>
                    <button
                        className="btn btn-primary"
                        disabled={parsedData.length === 0 || isProcessing}
                        onClick={handleConfirmImport}
                        style={{ minWidth: '160px' }}
                    >
                        {isProcessing ? 'Đang xử lý...' : `Xác nhận nhập (${parsedData.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportStudentsModal;
