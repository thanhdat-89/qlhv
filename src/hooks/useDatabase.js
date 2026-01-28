import { useState, useMemo, useEffect } from 'react';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { financeService } from '../services/financeService';
import { holidayService } from '../services/holidayService';

export const useDatabase = () => {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [extraAttendance, setExtraAttendance] = useState([]);
    const [fees, setFees] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // If Supabase is not configured, we don't attempt to fetch
            const [studentsData, classesData, feesData, attendanceData, holidaysData] = await Promise.all([
                studentService.getAll().catch(e => { console.error(e); return []; }),
                classService.getAll().catch(e => { console.error(e); return []; }),
                financeService.getFees().catch(e => { console.error(e); return []; }),
                financeService.getAttendance().catch(e => { console.error(e); return []; }),
                holidayService.getAll().catch(e => { console.error(e); return []; })
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

    // Helper: Calculate scheduled sessions
    const calculateScheduledSessions = (schedule, startDateStr, endDateStr, classId) => {
        if (!schedule) return 0; // Guard clause
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const enrollDate = new Date(startDateStr);
        const enrollYear = enrollDate.getFullYear();
        const enrollMonth = enrollDate.getMonth();

        // If enrolled in future month
        if (enrollYear > year || (enrollYear === year && enrollMonth > month)) return 0;

        const leaveDate = endDateStr ? new Date(endDateStr) : null;
        if (leaveDate) {
            const leaveYear = leaveDate.getFullYear();
            const leaveMonth = leaveDate.getMonth();
            // If left in a past month
            if (leaveYear < year || (leaveYear === year && leaveMonth < month)) return 0;
        }

        // Start counting from the 1st of the month OR the enrollment date, whichever is later
        let startDay = 1;
        if (enrollYear === year && enrollMonth === month) {
            startDay = enrollDate.getDate();
        }

        // End counting on the last day of the month OR the leave date, whichever is earlier
        let endDay = daysInMonth;
        if (leaveDate && leaveDate.getFullYear() === year && leaveDate.getMonth() === month) {
            endDay = leaveDate.getDate();
        }

        let count = 0;
        const dayMap = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };

        for (let day = startDay; day <= endDay; day++) {
            const date = new Date(year, month, day);
            const dayName = dayMap[date.getDay()];
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Skip if this date falls within any holiday range for THIS class
            if (holidays.some(h => {
                const start = h.date;
                const end = h.endDate || h.date;
                return dateStr >= start && dateStr <= end && (!h.classId || h.classId === classId);
            })) continue;

            if (schedule.morning.includes(dayName)) count++;
            if (schedule.afternoon.includes(dayName)) count++;
            if (schedule.evening.includes(dayName)) count++;
        }
        return count;
    };

    // Logic: Tuition calculation
    const getStudentTuitionDetails = (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return null;

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

        const scheduledCount = calculateScheduledSessions(studentClass.schedule, student.enrollDate, student.leaveDate, student.classId);

        // Sum fees for all attended extra sessions for this student within their active period
        const extraSessions = extraAttendance.filter(a => {
            if (a.studentId !== studentId) return false;
            if (a.isExcused) return false; // Exclude excused sessions
            if (!a.status) return false; // Exclude absent sessions (unless present)

            // Check if within enrollment bounds
            const extraDate = new Date(a.date);
            const enrollDate = new Date(student.enrollDate);
            if (extraDate < enrollDate) return false;

            if (student.leaveDate) {
                const leaveDate = new Date(student.leaveDate);
                if (extraDate > leaveDate) return false;
            }

            return true;
        });
        const totalExtraFee = extraSessions.reduce((sum, a) => sum + (a.fee || studentClass.feePerSession), 0);
        const extraCount = extraSessions.length;

        const feePerSession = studentClass.feePerSession;
        const discount = student.discountRate;

        // Formula: (([Scheduled] * Fee) + [Total Extra Fees]) * (1 - Discount)
        const tuitionDue = Math.round((scheduledCount * feePerSession + totalExtraFee) * (1 - discount));

        const totalPaid = fees
            .filter(f => f.studentId === studentId)
            .reduce((sum, f) => sum + f.amount, 0);

        const scheduledTuition = Math.round(scheduledCount * feePerSession * (1 - discount));

        return {
            scheduledCount,
            scheduledTuition,
            extraCount,
            totalExtraFee,
            tuitionDue,
            totalPaid,
            balance: tuitionDue - totalPaid,
            status: totalPaid >= tuitionDue ? 'Đã hoàn thành' : 'Còn nợ'
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

            return {
                ...s,
                status,
                className: getClass(s.classId)?.name || 'N/A',
                classCategory: getClass(s.classId)?.category || 'N/A',
                tuition: getStudentTuitionDetails(s.id)
            };
        });
    }, [students, classes, extraAttendance, fees]);

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

    // Actions
    const addStudent = async (newStudent) => {
        try {
            const maxId = students.reduce((max, s) => {
                const idNum = parseInt(s.id.substring(1));
                return isNaN(idNum) ? max : Math.max(max, idNum);
            }, 0);
            const id = `S${String(maxId + 1).padStart(2, '0')}`;
            const studentWithId = { ...newStudent, id };
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
        const startingId = students.length + 1;
        const studentsWithIds = newStudentsData.map((s, index) => ({
            ...s,
            id: `S${String(startingId + index).padStart(2, '0')}`
        }));
        const savedStudents = await studentService.bulkCreate(studentsWithIds);
        setStudents(prev => [...prev, ...savedStudents]);
    };

    const addClass = async (newClass) => {
        try {
            const maxId = classes.reduce((max, c) => {
                const idNum = parseInt(c.id.substring(1));
                return isNaN(idNum) ? max : Math.max(max, idNum);
            }, 0);
            const id = `C${String(maxId + 1).padStart(2, '0')}`;
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
            const id = `EA${String(extraAttendance.length + 1).padStart(2, '0')}`;
            const recordWithId = { ...record, id };
            const savedRecord = await financeService.addAttendance(recordWithId);
            setExtraAttendance(prev => [...prev, savedRecord]);
            return savedRecord; // Return for the caller
        } catch (error) {
            console.error('Failed to add attendance:', error);
            alert('Lỗi khi thêm điểm danh: ' + (error.message || JSON.stringify(error)));
            throw error; // Re-throw for the caller
        }
    };

    const addFee = async (fee) => {
        try {
            const maxId = fees.reduce((max, f) => {
                const idNum = parseInt(f.id.substring(1));
                return isNaN(idNum) ? max : Math.max(max, idNum);
            }, 0);
            const id = `F${String(maxId + 1).padStart(2, '0')}`;
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
            await studentService.update(id, updatedData);
            setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
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
        const password = window.prompt('Hành động này sẽ xóa vĩnh viễn dữ liệu học viên. Vui lòng nhập mật khẩu quản lý để tiếp tục:');

        if (password === null) return; // User cancelled

        if (password !== 'cqt263') {
            alert('Mật khẩu không chính xác. Thao tác xóa bị hủy.');
            return;
        }

        if (window.confirm('Bạn có chắc chắn muốn xóa học viên này? Toàn bộ lịch sử đóng tiền và điểm danh của học viên cũng sẽ bị xóa.')) {
            try {
                // 1. Delete associated records in Supabase (satisfy foreign key constraints)
                await financeService.deleteByStudent(id);

                // 2. Delete the student themselves
                await studentService.delete(id);

                // 3. Update local state
                setStudents(prev => prev.filter(s => s.id !== id));
                setFees(prev => prev.filter(f => f.studentId !== id));
                setExtraAttendance(prev => prev.filter(a => a.studentId !== id));

                alert('Đã xóa học viên thành công.');
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
                await financeService.deleteAttendance(id);
                setExtraAttendance(prev => prev.filter(a => a.id !== id));
                alert('Đã xóa ghi nhận thành công.');
            } catch (error) {
                console.error('Failed to delete attendance:', error);
                alert('Lỗi khi xóa ghi nhận: ' + (error.message || 'Vui lòng thử lại sau.'));
            }
        }
    };

    const addHoliday = async (holiday) => {
        try {
            const maxId = holidays.reduce((max, h) => {
                const idNum = parseInt(h.id.substring(1));
                return isNaN(idNum) ? max : Math.max(max, idNum);
            }, 0);
            const id = `H${String(maxId + 1).padStart(2, '0')}`;
            const savedHoliday = await holidayService.create({ ...holiday, id });
            setHolidays(prev => [...prev, savedHoliday]);
            return savedHoliday;
        } catch (error) {
            console.error('Failed to add holiday:', error);
            alert('Lỗi khi thêm lịch nghỉ: ' + (error.message || 'Vui lòng thử lại sau.'));
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

    return {
        isLoading,
        students: enhancedStudents,
        classes,
        extraAttendance,
        fees,
        holidays,
        views: {
            newStudents,
            leftStudents
        },
        actions: {
            refreshData: fetchData,
            addStudent,
            bulkAddStudents,
            addClass,
            addExtraAttendance,
            addFee,
            addHoliday,
            updateStudent,
            updateClass,
            updateExtraAttendance,
            updateHoliday,
            deleteStudent,
            deleteClass,
            deleteExtraAttendance,
            deleteHoliday
        }
    };
};
