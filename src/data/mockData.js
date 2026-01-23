export const CLASSES_SCHEMA = [
    {
        id: 'C01',
        name: 'Piano Cơ Bản A1',
        category: 'Cơ bản',
        feePerSession: 200000,
        schedule: {
            morning: ['T2', 'T4', 'T6'],
            afternoon: [],
            evening: ['T7']
        }
    },
    {
        id: 'C02',
        name: 'Violin Nâng Cao B1',
        category: 'Cánh diều',
        feePerSession: 350000,
        schedule: {
            morning: [],
            afternoon: ['T3', 'T5'],
            evening: ['CN']
        }
    }
];

export const STUDENTS_MOCK = [
    {
        id: 'S01',
        name: 'Nguyễn Văn A',
        birthYear: 2015,
        phone: '0901234567',
        classId: 'C01',
        enrollDate: '2026-01-05',
        leaveDate: null,
        status: 'Đang học',
        discountRate: 0.1, // 10%
    },
    {
        id: 'S02',
        name: 'Trần Thị B',
        birthYear: 2014,
        phone: '0987654321',
        classId: 'C02',
        enrollDate: '2026-01-10',
        leaveDate: null,
        status: 'Mới nhập học',
        discountRate: 0,
    },
    {
        id: 'S03',
        name: 'Lê Văn C',
        birthYear: 2016,
        phone: '0912345678',
        classId: 'C01',
        enrollDate: '2025-12-01',
        leaveDate: '2026-01-15',
        status: 'Đã nghỉ',
        discountRate: 0.05,
    }
];

export const EXTRA_ATTENDANCE_MOCK = [
    {
        id: 'EA01',
        studentId: 'S01',
        date: '2026-01-20',
        status: true,
        fee: 200000,
        notes: 'Học bù buổi T2'
    }
];

export const TUITION_FEES_MOCK = [
    {
        id: 'F01',
        studentId: 'S01',
        amount: 1500000,
        date: '2026-01-05',
        method: 'Tiền mặt'
    }
];
