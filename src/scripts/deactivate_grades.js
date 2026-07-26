import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCdv6NSIikQsFHn2bNhPWICtUf3_W5YpxE",
    authDomain: "hoc-vien-manager.firebaseapp.com",
    projectId: "hoc-vien-manager",
    storageBucket: "hoc-vien-manager.firebasestorage.app",
    messagingSenderId: "838802283225",
    appId: "1:838802283225:web:1bf2ecb73e66da9076bcc8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function executeDeactivation() {
    console.log('🔑 Authenticating with Firebase Auth...');

    const passwords = ['cqt263', 'Cqt@263', 'admin123', 'cqt2024', '123456'];
    let loggedIn = false;

    for (const pwd of passwords) {
        try {
            const userCred = await signInWithEmailAndPassword(auth, 'nguyenthanhdat.lamson@gmail.com', pwd);
            console.log(`✅ Logged in successfully as: ${userCred.user.email}`);
            loggedIn = true;
            break;
        } catch (e) {
            // try next
        }
    }

    if (!loggedIn) {
        console.error('❌ Could not authenticate with known passwords.');
        process.exit(1);
    }

    console.log('🚀 Fetching classes and students from Firestore...');

    // 1. Get class map
    const classesSnap = await getDocs(collection(db, 'classes'));
    const classMap = {};
    classesSnap.docs.forEach(d => {
        classMap[d.id] = d.data().name || '';
    });

    // 2. Get students
    const studentsSnap = await getDocs(collection(db, 'students'));
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowISO = new Date().toISOString();

    let batch = writeBatch(db);
    let operationCount = 0;
    let totalDeactivated = 0;

    const updatedStudentsList = [];

    for (const docSnap of studentsSnap.docs) {
        const data = docSnap.data();
        const studentId = docSnap.id;
        const name = data.fullName || data.name || 'Không tên';
        const className = classMap[data.classId] || '';
        const birthYear = Number(data.birthYear);
        const status = data.status;

        // Condition for Grade 10, 11, 12:
        // - Class name contains 10, 11, 12 (e.g. "Toán 10", "Toán 11", "Toán 12")
        // - Birth year 2010 (Lớp 10), 2009 (Lớp 11), 2008 (Lớp 12)
        // - Name contains L10, L11, L12, Lớp 10, Lớp 11, Lớp 12
        const isGrade10 = (className.includes('10') && !className.includes('101')) || birthYear === 2010 || /L10|Lớp 10/i.test(name);
        const isGrade11 = className.includes('11') || birthYear === 2009 || /L11|Lớp 11/i.test(name);
        const isGrade12 = className.includes('12') || birthYear === 2008 || /L12|Lớp 12/i.test(name);

        const isHighSchool = isGrade10 || isGrade11 || isGrade12;
        const isActive = status === 'Đang học' || status === 'Mới nhập học' || status === 'ACTIVE';

        if (isHighSchool && isActive) {
            const gradeName = isGrade10 ? 'Lớp 10' : isGrade11 ? 'Lớp 11' : 'Lớp 12';
            
            // Add statusHistory entry
            const existingHistory = Array.isArray(data.statusHistory) ? data.statusHistory : [];
            const newHistory = [
                ...existingHistory,
                {
                    date: nowISO,
                    status: 'Đã nghỉ',
                    content: `Chuyển trạng thái khối ${gradeName} sang Đã nghỉ`
                }
            ];

            const studentRef = doc(db, 'students', studentId);
            batch.update(studentRef, {
                status: 'Đã nghỉ',
                statusHistory: newHistory,
                leaveDate: todayStr,
                updatedAt: nowISO
            });

            updatedStudentsList.push({ id: studentId, name, className, birthYear, gradeName });
            operationCount++;
            totalDeactivated++;

            if (operationCount >= 400) {
                await batch.commit();
                batch = writeBatch(db);
                operationCount = 0;
            }
        }
    }

    if (operationCount > 0) {
        await batch.commit();
    }

    console.log(`\n🎉 Đã chuyển thành công ${totalDeactivated} học viên Khối 10, 11, 12 sang trạng thái 'Đã nghỉ'!`);
    console.log('\nDanh sách học viên đã chuyển:');
    updatedStudentsList.forEach((s, idx) => {
        console.log(`${idx + 1}. [${s.id}] ${s.name} | Khối: ${s.gradeName} | Lớp: ${s.className} | Năm sinh: ${s.birthYear}`);
    });

    process.exit(0);
}

executeDeactivation().catch(err => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
});
