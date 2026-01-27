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

            setStudents(studentsData || []);
            setClasses(classesData || []);
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
        const id = `S${String(students.length + 1).padStart(2, '0')}`;
        const studentWithId = { ...newStudent, id };
        const savedStudent = await studentService.create(studentWithId);
        setStudents(prev => [...prev, savedStudent]);
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
        const id = `C${String(classes.length + 1).padStart(2, '0')}`;
        const classWithId = { ...newClass, id };
        const savedClass = await classService.create(classWithId);
        setClasses(prev => [...prev, savedClass]);
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
        const id = `F${String(fees.length + 1).padStart(2, '0')}`;
        const feeWithId = { ...fee, id };
        const savedFee = await financeService.addFee(feeWithId);
        setFees(prev => [...prev, savedFee]);
    };

    const updateStudent = async (id, updatedData) => {
        await studentService.update(id, updatedData);
        setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
    };

    const updateClass = async (id, updatedData) => {
        await classService.update(id, updatedData);
        setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
    };

    const updateExtraAttendance = async (id, updatedData) => {
        await financeService.updateAttendance(id, updatedData);
        setExtraAttendance(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));
    };

    const deleteStudent = async (id) => {
        await studentService.delete(id);
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    const deleteClass = async (id) => {
        const hasStudents = students.some(s => s.classId === id);
        if (hasStudents) {
            alert('Không thể xóa lớp đang có học viên. Vui lòng chuyển học viên sang lớp khác trước.');
            return;
        }
        if (window.confirm('Bạn có chắc chắn muốn xóa lớp này không?')) {
            await classService.delete(id);
            setClasses(prev => prev.filter(c => c.id !== id));
        }
    };

    const deleteExtraAttendance = async (id) => {
        await financeService.deleteAttendance(id);
        setExtraAttendance(prev => prev.filter(a => a.id !== id));
    };

    const addHoliday = async (holiday) => {
        try {
            const id = `H${String(holidays.length + 1).padStart(2, '0')}`;
            const savedHoliday = await holidayService.create({ ...holiday, id });
            setHolidays(prev => [...prev, savedHoliday]);
            return savedHoliday;
        } catch (error) {
            console.error('Failed to add holiday:', error);
            alert('Lỗi khi thêm lịch nghỉ: ' + (error.message || JSON.stringify(error)));
            throw error;
        }
    };

    const updateHoliday = async (id, updatedData) => {
        await holidayService.update(id, updatedData);
        setHolidays(prev => prev.map(h => h.id === id ? { ...h, ...updatedData } : h));
    };

    const deleteHoliday = async (id) => {
        await holidayService.delete(id);
        setHolidays(prev => prev.filter(h => h.id !== id));
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
