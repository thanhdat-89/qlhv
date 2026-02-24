import { useState, useMemo, useEffect } from 'react';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { financeService } from '../services/financeService';
import { holidayService } from '../services/holidayService';
import { promotionService } from '../services/promotionService';
import { backupService } from '../services/backupService';
import { messageService } from '../services/messageService'; // Added promotionService import

export const useDatabase = () => {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [extraAttendance, setExtraAttendance] = useState([]);
    const [fees, setFees] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [automatedBackups, setAutomatedBackups] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // If Supabase is not configured, we don't attempt to fetch
            const [studentsData, classesData, feesData, attendanceData, holidaysData, promotionsData, messagesData] = await Promise.all([
                studentService.getAll().catch(e => { console.error(e); return []; }),
                classService.getAll().catch(e => { console.error(e); return []; }),
                financeService.getFees().catch(e => { console.error(e); return []; }),
                financeService.getAttendance().catch(e => { console.error(e); return []; }),
                holidayService.getAll().catch(e => { console.error(e); return []; }),
                promotionService.getAll().catch(e => { console.error(e); return []; }),
                messageService.getAll().catch(e => { console.error(e); return []; })
            ]);

            // Sort classes by name (natural sort)
            const sortedClasses = (classesData || []).sort((a, b) =>
                a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' })
            );

            setStudents(studentsData || []);
            setClasses(sortedClasses);
            setFees(feesData || []);
            setExtraAttendance(attendanceData || []);
            setHolidays(holidaysData || []);
            setPromotions(promotionsData || []);
            setMessages(messagesData || []);

            // Check for Auto-backup (Monday only)
            const today = new Date();
            if (today.getDay() === 1) { // 1 = Monday
                const backups = await backupService.getBackups();
                setAutomatedBackups(backups);

                const todayStr = today.toISOString().split('T')[0];
                const alreadyBackedUpToday = backups.some(b => b.created_at.startsWith(todayStr));

                if (!alreadyBackedUpToday) {
                    console.log('Monday detected. Performing automatic weekly backup...');
                    try {
                        await backupService.createAutomatedBackup();
                        const updatedBackups = await backupService.getBackups();
                        setAutomatedBackups(updatedBackups);
                    } catch (e) {
                        console.error('Auto-backup failed:', e);
                    }
                }
            } else {
                // Not Monday, but still fetch backups for the Settings view
                const backups = await backupService.getBackups();
                setAutomatedBackups(backups);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial Data Fetch
    useEffect(() => {
        fetchData();
    }, []);

    // Helper: Get class by ID
    const getClass = (classId) => classes.find(c => c.id === classId);

    // Helper: Get local YYYY-MM-DD string
    const getLocalDateString = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Helper: Count sessions within a specific date range
    const countSessionsInRange = (schedule, startDate, endDate, classId) => {
        if (!schedule) return 0;

        let count = 0;
        const dayMap = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };

        // Normalize to local start of day
        const current = new Date(startDate);
        current.setHours(0, 0, 0, 0);
        const final = new Date(endDate);
        final.setHours(0, 0, 0, 0);

        // Loop through each day in range
        while (current <= final) {
            const dateStr = getLocalDateString(current);
            const dayName = dayMap[current.getDay()];

            // Skip if this date falls within any holiday range for THIS class
            const isHoliday = holidays.some(h => {
                const start = h.date;
                const end = h.endDate || h.date;
                return dateStr >= start && dateStr <= end && (!h.classId || h.classId === classId);
            });

            if (!isHoliday) {
                if (schedule.morning?.includes(dayName)) count++;
                if (schedule.afternoon?.includes(dayName)) count++;
                if (schedule.evening?.includes(dayName)) count++;
            }

            current.setDate(current.getDate() + 1);
        }
        return count;
    };

    // Logic: Tuition calculation
    const getStudentTuitionDetails = (studentId, targetMonth, targetYear) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return null;

        const now = new Date();
        const calculationMonth = targetMonth !== undefined ? targetMonth : now.getMonth();
        const calculationYear = targetYear !== undefined ? targetYear : now.getFullYear();

        const studentClass = getClass(student.classId);
        if (!studentClass) return {
            scheduledCount: 0,
            extraCount: 0,
            totalExtraFee: 0,
            tuitionDue: 0,
            totalPaid: 0,
            balance: 0,
            status: 'N/A'
        };

        // Helper to parse date string (DD/MM/YYYY or YYYY-MM-DD or ISO) to Date object safely
        const parseDate = (dateStr) => {
            if (!dateStr) return new Date();
            if (dateStr instanceof Date) return new Date(dateStr);

            const str = String(dateStr);

            // 1. Try YYYY-MM-DD (matches ISO start or plain date)
            const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (isoMatch) {
                const y = parseInt(isoMatch[1], 10);
                const m = parseInt(isoMatch[2], 10) - 1;
                const d = parseInt(isoMatch[3], 10);
                return new Date(y, m, d);
            }

            // 2. Try DD/MM/YYYY
            const parts = str.split('/');
            if (parts.length === 3) {
                const d = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const y = parseInt(parts[2], 10);
                return new Date(y, m, d);
            }

            const fallback = new Date(str);
            return isNaN(fallback.getTime()) ? new Date() : fallback;
        };

        const startOfMonth = new Date(calculationYear, calculationMonth, 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(calculationYear, calculationMonth + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const enrollDate = parseDate(student.enrollDate);
        enrollDate.setHours(0, 0, 0, 0);

        let effectiveLeaveDate = student.leaveDate ? parseDate(student.leaveDate) : null;
        if (student.status === 'Đã nghỉ' && !effectiveLeaveDate && student.statusHistory) {
            const leaveEvent = [...student.statusHistory].reverse().find(h => h.status === 'Đã nghỉ');
            if (leaveEvent) effectiveLeaveDate = parseDate(leaveEvent.date);
        }

        if (effectiveLeaveDate) effectiveLeaveDate.setHours(23, 59, 59, 999);

        // --- Monthly Calculation (for display) ---
        const monthlyStart = enrollDate > startOfMonth ? enrollDate : startOfMonth;
        const monthlyEnd = (effectiveLeaveDate && effectiveLeaveDate < endOfMonth) ? effectiveLeaveDate : endOfMonth;

        let scheduledCount = 0;
        if (monthlyStart <= monthlyEnd) {
            scheduledCount = countSessionsInRange(studentClass.schedule, monthlyStart, monthlyEnd, student.classId);
        }

        // Extra sessions for target month (ALL scheduled sessions, no attendance check)
        const extraSessionsSelected = extraAttendance.filter(a => {
            if (a.studentId !== studentId) return false;
            const d = parseDate(a.date);
            if (effectiveLeaveDate && d > effectiveLeaveDate) return false;
            return d >= startOfMonth && d <= endOfMonth;
        });
        const extraCount = extraSessionsSelected.length;
        const totalExtraFee = extraSessionsSelected.reduce((sum, a) => sum + (a.fee || studentClass.feePerSession), 0);

        const discount = student.discountRate || 0;
        const feePerSession = studentClass.feePerSession || 0;

        // Apply class-level promotion for the selected month
        const selectedMonthStr = `${calculationYear}-${String(calculationMonth + 1).padStart(2, '0')}`;
        const promotion = promotions.find(p => p.classId === student.classId && p.month === selectedMonthStr);
        const promotionDiscount = promotion ? promotion.discountRate : 0;

        // Final Tuition = Base * (1 - Student Discount) * (1 - Promotion Discount)
        const isOldDiscountValid = (student.discountRate > 0 && !student.discountMonths) && (calculationYear < 2026 || (calculationYear === 2026 && calculationMonth <= 6));
        const isMonthPromoValid = student.discountMonths?.includes(selectedMonthStr);
        const effectiveStudentDiscount = (isOldDiscountValid || isMonthPromoValid) ? (student.discountRate || 0) : 0;

        const scheduledTuition = Math.round(scheduledCount * feePerSession * (1 - effectiveStudentDiscount) * (1 - promotionDiscount));
        const tuitionDue = Math.round((scheduledCount * feePerSession + totalExtraFee) * (1 - effectiveStudentDiscount) * (1 - promotionDiscount));

        // --- Balance Calculation (Relative to Target Month) ---
        // Debt = (Scheduled + Extra up to Target Month) - Total Payments
        const targetMonthEnd = new Date(calculationYear, calculationMonth + 1, 0);
        targetMonthEnd.setHours(23, 59, 59, 999);
        const balanceLimit = (effectiveLeaveDate && effectiveLeaveDate < targetMonthEnd) ? effectiveLeaveDate : targetMonthEnd;

        let tuitionIncurred = 0;
        let iterDate = new Date(enrollDate.getFullYear(), enrollDate.getMonth(), 1);
        const endIter = new Date(balanceLimit.getFullYear(), balanceLimit.getMonth(), 1);

        // 1. Scheduled Tuition up to Target Month
        while (iterDate <= endIter) {
            const mStart = iterDate > enrollDate ? iterDate : enrollDate;
            const mEndNext = new Date(iterDate.getFullYear(), iterDate.getMonth() + 1, 1);
            const mEnd = new Date(mEndNext.getTime() - 1);
            const actualEnd = mEnd < balanceLimit ? mEnd : balanceLimit;

            if (mStart <= actualEnd) {
                const monthScheduledCount = countSessionsInRange(studentClass.schedule, mStart, actualEnd, student.classId);
                const monthStr = `${iterDate.getFullYear()}-${String(iterDate.getMonth() + 1).padStart(2, '0')}`;

                // Effective discount for the iterated month
                const iterYear = iterDate.getFullYear();
                const iterMonth = iterDate.getMonth();
                const isIterOldValid = (student.discountRate > 0 && !student.discountMonths) && (iterYear < 2026 || (iterYear === 2026 && iterMonth <= 6));
                const isIterMonthValid = student.discountMonths?.includes(monthStr);
                const iterStudentDiscount = (isIterOldValid || isIterMonthValid) ? (student.discountRate || 0) : 0;

                const monthPromo = promotions.find(p => p.classId === student.classId && p.month === monthStr);
                const monthPromoDiscount = monthPromo ? monthPromo.discountRate : 0;

                tuitionIncurred += Math.round(monthScheduledCount * feePerSession * (1 - iterStudentDiscount) * (1 - monthPromoDiscount));
            }
            iterDate = mEndNext;
        }

        // 2. Extra Sessions up to Target Month (ALL sessions, no attendance check)
        const extraSessionsUpToTarget = extraAttendance.filter(a => {
            if (a.studentId !== studentId) return false;
            const d = parseDate(a.date);
            if (effectiveLeaveDate && d > effectiveLeaveDate) return false;
            return d <= balanceLimit;
        });

        extraSessionsUpToTarget.forEach(a => {
            const d = parseDate(a.date);
            const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

            const iterYear = d.getFullYear();
            const iterMonth = d.getMonth();
            const isIterOldValid = (student.discountRate > 0 && !student.discountMonths) && (iterYear < 2026 || (iterYear === 2026 && iterMonth <= 6));
            const isIterMonthValid = student.discountMonths?.includes(monthStr);
            const iterStudentDiscount = (isIterOldValid || isIterMonthValid) ? (student.discountRate || 0) : 0;

            const monthPromo = promotions.find(p => p.classId === student.classId && p.month === monthStr);
            const monthPromoDiscount = monthPromo ? monthPromo.discountRate : 0;
            const sessionFee = a.fee || feePerSession;
            tuitionIncurred += Math.round(sessionFee * (1 - iterStudentDiscount) * (1 - monthPromoDiscount));
        });

        const totalPaid = fees
            .filter(f => f.studentId === studentId)
            .reduce((sum, f) => sum + f.amount, 0);

        const balance = tuitionIncurred - totalPaid;

        return {
            feePerSession,
            scheduledCount,
            scheduledTuition,
            extraCount,
            totalExtraFee,
            tuitionDue,
            totalPaid,
            balance,
            promotionDiscount,
            studentDiscountRate: effectiveStudentDiscount,
            promotionDescription: promotion ? promotion.description : '',
            status: balance <= 0 ? 'Đã hoàn thành' : 'Còn nợ'
        };
    };

    // Enhanced students for views
    const enhancedStudents = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        return students.map(s => {
            let status = s.status;
            const enrollDate = new Date(s.enrollDate);

            // Auto-transition to "Đang học" if enrolled > 30 days and not "Đã nghỉ"
            if (status === 'Mới nhập học' && enrollDate < thirtyDaysAgo) {
                status = 'Đang học';
            }

            const tuitionDetails = getStudentTuitionDetails(s.id);

            return {
                ...s,
                status,
                className: getClass(s.classId)?.name || 'N/A',
                tuition: tuitionDetails,
                currentDiscountRate: tuitionDetails?.studentDiscountRate || 0
            };
        }).sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));
    }, [students, classes, extraAttendance, fees, promotions, holidays]);

    // View: New Students (Current Month)
    const newStudents = useMemo(() => {
        const today = new Date();
        return enhancedStudents.filter(s => {
            const enrollDate = new Date(s.enrollDate);
            return enrollDate.getMonth() === today.getMonth() && enrollDate.getFullYear() === today.getFullYear();
        });
    }, [enhancedStudents]);

    // View: Left Students
    const leftStudents = useMemo(() => {
        return enhancedStudents.filter(s => s.status === 'Đã nghỉ');
    }, [enhancedStudents]);

    // === Helper: Generate Unique ID ===
    const generateUniqueId = (prefix) => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    };

    // Actions
    const addStudent = async (newStudent) => {
        try {
            const id = generateUniqueId('ST');
            const studentWithId = {
                ...newStudent,
                id,
                statusHistory: [{ status: newStudent.status, date: new Date().toISOString() }]
            };
            const savedStudent = await studentService.create(studentWithId);
            setStudents(prev => [...prev, savedStudent]);
            return savedStudent;
        } catch (error) {
            console.error('Failed to add student:', error);
            alert('Lỗi khi thêm học viên: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const bulkAddStudents = async (newStudentsData) => {
        try {
            const now = Date.now();
            const studentsWithIds = newStudentsData.map((s, index) => ({
                ...s,
                id: `ST${(now + index).toString(36).toUpperCase()}`,
                statusHistory: [{ status: s.status, date: new Date().toISOString() }]
            }));

            const savedStudents = await studentService.bulkCreate(studentsWithIds);
            setStudents(prev => [...prev, ...savedStudents]);
            return savedStudents;
        } catch (error) {
            console.error('Failed to bulk add students:', error);
            alert('Lỗi khi nhập danh sách học viên: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const addClass = async (newClass) => {
        try {
            const id = generateUniqueId('CL');
            const classWithId = { ...newClass, id };
            const savedClass = await classService.create(classWithId);
            setClasses(prev => {
                const updated = [...prev, savedClass];
                return updated.sort((a, b) =>
                    a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' })
                );
            });
            return savedClass;
        } catch (error) {
            console.error('Failed to add class:', error);
            alert('Lỗi khi tạo lớp học: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const addExtraAttendance = async (record) => {
        try {
            const id = generateUniqueId('EA');
            const recordWithId = { ...record, id };
            const savedRecord = await financeService.addAttendance(recordWithId);
            setExtraAttendance(prev => [...prev, savedRecord]);

            // Log to student history
            const currentStudent = students.find(s => s.id === record.studentId);
            if (currentStudent) {
                const newHistoryEntry = {
                    status: currentStudent.status,
                    content: `📅 Đã xếp thêm 1 buổi học bổ sung vào ngày ${new Date(record.date).toLocaleDateString('vi-VN')}`,
                    date: new Date().toISOString()
                };
                const finalUpdateData = {
                    statusHistory: [...(currentStudent.statusHistory || []), newHistoryEntry]
                };
                await studentService.update(currentStudent.id, finalUpdateData);
                setStudents(prev => prev.map(s => s.id === currentStudent.id ? { ...s, ...finalUpdateData } : s));
            }

            return savedRecord;
        } catch (error) {
            console.error('Failed to add attendance:', error);
            alert('Lỗi khi thêm điểm danh: ' + (error.message || JSON.stringify(error)));
            throw error;
        }
    };

    const bulkAddExtraAttendance = async (records) => {
        try {
            const now = Date.now();
            const recordsWithIds = records.map((r, i) => ({
                ...r,
                id: `EA${(now + i).toString(36).toUpperCase()}`
            }));
            const savedRecords = await financeService.bulkAddAttendance(recordsWithIds);
            setExtraAttendance(prev => [...prev, ...savedRecords]);

            // Log to student history
            const byStudent = {};
            recordsWithIds.forEach(r => {
                if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
                byStudent[r.studentId].push(r);
            });

            for (const studentId in byStudent) {
                const currentStudent = students.find(s => s.id === studentId);
                if (currentStudent) {
                    const studentRecords = byStudent[studentId];
                    studentRecords.sort((a, b) => new Date(a.date) - new Date(b.date));

                    let contentMsg = `📅 Đã xếp thêm ${studentRecords.length} buổi học bổ sung`;
                    if (studentRecords.length > 1) {
                        contentMsg += ` (từ ${new Date(studentRecords[0].date).toLocaleDateString('vi-VN')} đến ${new Date(studentRecords[studentRecords.length - 1].date).toLocaleDateString('vi-VN')})`;
                    } else if (studentRecords.length === 1) {
                        contentMsg += ` vào ngày ${new Date(studentRecords[0].date).toLocaleDateString('vi-VN')}`;
                    }

                    const newHistoryEntry = {
                        status: currentStudent.status,
                        content: contentMsg,
                        date: new Date().toISOString()
                    };
                    const finalUpdateData = {
                        statusHistory: [...(currentStudent.statusHistory || []), newHistoryEntry]
                    };
                    await studentService.update(currentStudent.id, finalUpdateData);
                    setStudents(prev => prev.map(s => s.id === currentStudent.id ? { ...s, ...finalUpdateData } : s));
                }
            }

            return savedRecords;
        } catch (error) {
            console.error('Failed to bulk add attendance:', error);
            alert('Lỗi khi lưu nhiều ghi nhận: ' + (error.message || JSON.stringify(error)));
            throw error;
        }
    };

    const addFee = async (fee) => {
        try {
            const id = generateUniqueId('FE');
            const feeWithId = { ...fee, id };
            const savedFee = await financeService.addFee(feeWithId);
            setFees(prev => [...prev, savedFee]);
            return savedFee;
        } catch (error) {
            console.error('Failed to add fee:', error);
            alert('Lỗi khi thêm học phí: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const updateStudent = async (id, updatedData) => {
        try {
            const currentStudent = students.find(s => s.id === id);
            let finalUpdateData = { ...updatedData };

            if (currentStudent) {
                const changes = [];
                const fieldMap = {
                    name: 'Họ tên',
                    birthYear: 'Năm sinh',
                    phone: 'Số điện thoại',
                    classId: 'Lớp học',
                    enrollDate: 'Ngày nhập học',
                    leaveDate: 'Ngày nghỉ học',
                    status: 'Trạng thái',
                    discountRate: 'Ưu đãi/giảm giá'
                };

                for (const key in fieldMap) {
                    if (updatedData[key] !== undefined && updatedData[key] !== currentStudent[key]) {
                        let oldVal = currentStudent[key];
                        let newVal = updatedData[key];

                        if (oldVal === null || oldVal === undefined || oldVal === '') oldVal = 'Trống';
                        if (newVal === null || newVal === undefined || newVal === '') newVal = 'Trống';

                        if (key === 'classId') {
                            oldVal = classes.find(c => c.id === currentStudent[key])?.name || oldVal;
                            newVal = classes.find(c => c.id === updatedData[key])?.name || newVal;
                        } else if (key === 'discountRate') {
                            oldVal = oldVal === 'Trống' ? '0%' : `${currentStudent[key] * 100}%`;
                            newVal = newVal === 'Trống' ? '0%' : `${updatedData[key] * 100}%`;
                        } else if (key === 'enrollDate' || key === 'leaveDate') {
                            if (oldVal !== 'Trống') {
                                const od = new Date(currentStudent[key]);
                                oldVal = isNaN(od) ? oldVal : od.toLocaleDateString('vi-VN');
                            }
                            if (newVal !== 'Trống') {
                                const nd = new Date(updatedData[key]);
                                newVal = isNaN(nd) ? newVal : nd.toLocaleDateString('vi-VN');
                            }
                        }

                        changes.push(`${fieldMap[key]} từ "${oldVal}" thành "${newVal}"`);
                    }
                }

                if (changes.length > 0) {
                    const statusVal = updatedData.status !== undefined ? updatedData.status : currentStudent.status;
                    const newHistoryEntry = {
                        status: statusVal,
                        content: `Cập nhật thông tin: ${changes.join(', ')}`,
                        date: new Date().toISOString()
                    };
                    finalUpdateData.statusHistory = [...(currentStudent.statusHistory || []), newHistoryEntry];
                }
            }

            await studentService.update(id, finalUpdateData);
            setStudents(prev => prev.map(s => s.id === id ? { ...s, ...finalUpdateData } : s));
        } catch (error) {
            console.error('Failed to update student:', error);
            alert('Lỗi khi cập nhật học viên: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const updateClass = async (id, updatedData) => {
        try {
            await classService.update(id, updatedData);
            setClasses(prev => {
                const updated = prev.map(c => c.id === id ? { ...c, ...updatedData } : c);
                return updated.sort((a, b) =>
                    a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' })
                );
            });
        } catch (error) {
            console.error('Failed to update class:', error);
            alert('Lỗi khi cập nhật lớp học: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const updateExtraAttendance = async (id, updatedData) => {
        try {
            await financeService.updateAttendance(id, updatedData);
            setExtraAttendance(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));
        } catch (error) {
            console.error('Failed to update attendance:', error);
            alert('Lỗi khi cập nhật điểm danh: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const deleteStudent = async (id) => {
        const password = window.prompt('Hành động này sẽ xóa học viên (ẩn khỏi danh sách). Vui lòng nhập mật khẩu quản lý để tiếp tục:');

        if (password === null) return; // User cancelled

        if (password !== 'cqt263') {
            alert('Mật khẩu không chính xác. Thao tác xóa bị hủy.');
            return;
        }

        if (window.confirm('Bạn có chắc chắn muốn xóa học viên này? Thao tác này sẽ chuyển học viên vào thùng rác nhưng vẫn giữ lại lịch sử thay đổi.')) {
            try {
                const currentStudent = students.find(s => s.id === id);
                if (!currentStudent) return;

                const newHistoryEntry = {
                    status: 'Đã xóa',
                    content: '🗑️ Xóa học viên khỏi hệ thống',
                    date: new Date().toISOString()
                };

                const finalUpdateData = {
                    status: 'Đã xóa',
                    leaveDate: currentStudent.leaveDate || new Date().toISOString(),
                    statusHistory: [...(currentStudent.statusHistory || []), newHistoryEntry]
                };

                // Update the student to soft delete
                await studentService.update(id, finalUpdateData);
                setStudents(prev => prev.map(s => s.id === id ? { ...s, ...finalUpdateData } : s));

                alert('Đã đưa học viên vào thùng rác thành công.');
            } catch (error) {
                console.error('Failed to delete student:', error);
                alert('Lỗi khi xóa học viên: ' + (error.message || 'Vui lòng thử lại sau.'));
            }
        }
    };

    const deleteClass = async (id) => {
        const hasStudents = students.some(s => s.classId === id);
        if (hasStudents) {
            alert('Không thể xóa lớp đang có học viên. Vui lòng chuyển học viên sang lớp khác trước.');
            return;
        }

        const password = window.prompt('Hành động này sẽ xóa vĩnh viễn lớp học. Vui lòng nhập mật khẩu quản lý để tiếp tục:');

        if (password === null) return; // User cancelled

        if (password !== 'cqt263') {
            alert('Mật khẩu không chính xác. Thao tác xóa bị hủy.');
            return;
        }

        if (window.confirm('Bạn có chắc chắn muốn xóa lớp này không?')) {
            try {
                // Delete associated holidays for this class
                await holidayService.deleteByClass(id);

                // Delete the class
                await classService.delete(id);

                // Update local state
                setClasses(prev => prev.filter(c => c.id !== id));
                setHolidays(prev => prev.filter(h => h.classId !== id));

                alert('Đã xóa lớp học thành công.');
            } catch (error) {
                console.error('Failed to delete class:', error);
                alert('Lỗi khi xóa lớp học: ' + (error.message || 'Vui lòng thử lại sau.'));
            }
        }
    };

    const deleteExtraAttendance = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa ghi nhận buổi học này?')) {
            try {
                const recordToDelete = extraAttendance.find(a => a.id === id);

                await financeService.deleteAttendance(id);
                setExtraAttendance(prev => prev.filter(a => a.id !== id));

                // Log to student history
                if (recordToDelete) {
                    const currentStudent = students.find(s => s.id === recordToDelete.studentId);
                    if (currentStudent) {
                        const newHistoryEntry = {
                            status: currentStudent.status,
                            content: `🗑️ Đã xóa 1 buổi học bổ sung (ngày ${new Date(recordToDelete.date).toLocaleDateString('vi-VN')})`,
                            date: new Date().toISOString()
                        };
                        const finalUpdateData = {
                            statusHistory: [...(currentStudent.statusHistory || []), newHistoryEntry]
                        };
                        await studentService.update(currentStudent.id, finalUpdateData);
                        setStudents(prev => prev.map(s => s.id === currentStudent.id ? { ...s, ...finalUpdateData } : s));
                    }
                }

                alert('Đã xóa ghi nhận thành công.');
            } catch (error) {
                console.error('Failed to delete attendance:', error);
                alert('Lỗi khi xóa ghi nhận: ' + (error.message || 'Vui lòng thử lại sau.'));
            }
        }
    };

    const addHoliday = async (holiday) => {
        try {
            const id = generateUniqueId('HL');
            const savedHoliday = await holidayService.create({ ...holiday, id });
            setHolidays(prev => [...prev, savedHoliday]);
            return savedHoliday;
        } catch (error) {
            console.error('Failed to add holiday:', error);
            alert('Lỗi khi thêm lịch nghỉ: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const bulkDeleteExtraAttendance = async (ids) => {
        try {
            const recordsToDelete = extraAttendance.filter(a => ids.includes(a.id));

            await financeService.bulkDeleteAttendance(ids);
            setExtraAttendance(prev => prev.filter(a => !ids.includes(a.id)));

            // Log to student history
            const byStudent = {};
            recordsToDelete.forEach(r => {
                if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
                byStudent[r.studentId].push(r);
            });

            for (const studentId in byStudent) {
                const currentStudent = students.find(s => s.id === studentId);
                if (currentStudent) {
                    const studentRecords = byStudent[studentId];
                    studentRecords.sort((a, b) => new Date(a.date) - new Date(b.date));

                    let contentMsg = `🗑️ Đã xóa ${studentRecords.length} buổi học bổ sung`;
                    if (studentRecords.length > 1) {
                        contentMsg += ` (từ ${new Date(studentRecords[0].date).toLocaleDateString('vi-VN')} đến ${new Date(studentRecords[studentRecords.length - 1].date).toLocaleDateString('vi-VN')})`;
                    } else if (studentRecords.length === 1) {
                        contentMsg += ` (ngày ${new Date(studentRecords[0].date).toLocaleDateString('vi-VN')})`;
                    }

                    const newHistoryEntry = {
                        status: currentStudent.status,
                        content: contentMsg,
                        date: new Date().toISOString()
                    };
                    const finalUpdateData = {
                        statusHistory: [...(currentStudent.statusHistory || []), newHistoryEntry]
                    };
                    await studentService.update(currentStudent.id, finalUpdateData);
                    setStudents(prev => prev.map(s => s.id === currentStudent.id ? { ...s, ...finalUpdateData } : s));
                }
            }
        } catch (error) {
            console.error('Failed to bulk delete attendance:', error);
            alert('Lỗi khi xóa nhiều ghi nhận: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const updateHoliday = async (id, updatedData) => {
        try {
            await holidayService.update(id, updatedData);
            setHolidays(prev => prev.map(h => h.id === id ? { ...h, ...updatedData } : h));
        } catch (error) {
            console.error('Failed to update holiday:', error);
            alert('Lỗi khi cập nhật lịch nghỉ: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const deleteHoliday = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa lịch nghỉ này?')) {
            try {
                await holidayService.delete(id);
                setHolidays(prev => prev.filter(h => h.id !== id));
                alert('Đã xóa lịch nghỉ thành công.');
            } catch (error) {
                console.error('Failed to delete holiday:', error);
                alert('Lỗi khi xóa lịch nghỉ: ' + (error.message || 'Vui lòng thử lại sau.'));
            }
        }
    };

    const addPromotion = async (promotion) => {
        try {
            const savedPromotion = await promotionService.create(promotion);
            setPromotions(prev => [...prev, savedPromotion]);
            return savedPromotion;
        } catch (error) {
            console.error('Failed to add promotion:', error);
            alert('Lỗi khi thêm khuyến mãi: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const bulkAddPromotions = async (promotionRecords) => {
        try {
            const savedPromotions = await Promise.all(
                promotionRecords.map(record => promotionService.create(record))
            );
            setPromotions(prev => [...prev, ...savedPromotions]);
            return savedPromotions;
        } catch (error) {
            console.error('Failed to bulk add promotions:', error);
            alert('Lỗi khi thêm nhiều khuyến mãi: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const updatePromotion = async (id, updatedData) => {
        try {
            await promotionService.update(id, updatedData);
            setPromotions(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
        } catch (error) {
            console.error('Failed to update promotion:', error);
            alert('Lỗi khi cập nhật khuyến mãi: ' + (error.message || 'Vui lòng thử lại sau.'));
            throw error;
        }
    };

    const deletePromotion = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
            try {
                await promotionService.delete(id);
                setPromotions(prev => prev.filter(p => p.id !== id));
                alert('Đã xóa khuyến mãi thành công.');
            } catch (error) {
                console.error('Failed to delete promotion:', error);
                alert('Lỗi khi xóa khuyến mãi: ' + (error.message || 'Vui lòng thử lại sau.'));
            }
        }
    };

    return {
        isLoading,
        students: enhancedStudents.filter(s => s.status !== 'Đã xóa'),
        allStudents: enhancedStudents,
        classes,
        extraAttendance,
        fees,
        holidays,
        promotions,
        views: {
            newStudents,
            leftStudents
        },
        actions: {
            refreshData: fetchData,
            getStudentTuitionDetails,
            addStudent,
            bulkAddStudents,
            addClass,
            addExtraAttendance,
            bulkAddExtraAttendance,
            addFee,
            addHoliday,
            addPromotion,
            bulkAddPromotions,
            updateStudent,
            updateClass,
            updateExtraAttendance,
            updateHoliday,
            updatePromotion,
            deleteStudent,
            deleteClass,
            deleteExtraAttendance,
            bulkDeleteExtraAttendance,
            deleteHoliday,
            deletePromotion,
            addMessage: async (content) => {
                const newMessage = await messageService.add({ content });
                setMessages(prev => [newMessage, ...prev]);
            },
            deleteMessage: async (id) => {
                await messageService.delete(id);
                setMessages(prev => prev.filter(m => m.id !== id));
            },
            updateMessage: async (id, updates) => {
                const updated = await messageService.update(id, updates);
                setMessages(prev => prev.map(m => m.id === id ? updated : m));
            }
        },
        automatedBackups,
        messages,
        refreshBackups: async () => {
            const backups = await backupService.getBackups();
            setAutomatedBackups(backups);
        }
    };
};
