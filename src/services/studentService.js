import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch
} from 'firebase/firestore';

const col = () => collection(db, 'students');

const normalize = (id, data) => ({
    id,
    name: data.name,
    birthYear: data.birthYear ?? null,
    phone: data.phone ?? null,
    enrollDate: data.enrollDate ?? null,
    leaveDate: data.leaveDate ?? null,
    classId: data.classId ?? null,
    status: data.status,
    statusHistory: data.statusHistory || [],
    discountRate: typeof data.discountRate === 'number'
        ? data.discountRate
        : parseFloat(data.discountRate) || 0,
    discountEndDate: data.discountEndDate ?? null
});

export const studentService = {
    getAll: async () => {
        const snap = await getDocs(col());
        return snap.docs.map(d => normalize(d.id, d.data()));
    },

    create: async (student) => {
        const { id, ...rest } = student;
        await setDoc(doc(db, 'students', id), {
            ...rest,
            statusHistory: rest.statusHistory || [],
            createdAt: new Date().toISOString()
        });
        return student;
    },

    update: async (id, data) => {
        const allowed = [
            'name', 'birthYear', 'phone', 'enrollDate', 'leaveDate',
            'classId', 'status', 'statusHistory', 'discountRate', 'discountEndDate'
        ];
        const payload = Object.fromEntries(
            Object.entries(data).filter(([k]) => allowed.includes(k))
        );
        if (Object.keys(payload).length === 0) return data;
        await updateDoc(doc(db, 'students', id), payload);
        return data;
    },

    delete: async (id) => {
        await deleteDoc(doc(db, 'students', id));
        return id;
    },

    bulkCreate: async (newStudents) => {
        const chunks = [];
        for (let i = 0; i < newStudents.length; i += 400) {
            chunks.push(newStudents.slice(i, i + 400));
        }
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            const createdAt = new Date().toISOString();
            chunk.forEach(s => {
                const { id, ...rest } = s;
                batch.set(doc(db, 'students', id), {
                    ...rest,
                    statusHistory: rest.statusHistory || [],
                    createdAt
                });
            });
            await batch.commit();
        }
        return newStudents;
    }
};
