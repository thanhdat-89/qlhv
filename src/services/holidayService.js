import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    query,
    where,
    orderBy
} from 'firebase/firestore';

const normalize = (id, h) => ({
    id,
    date: h.date,
    endDate: h.endDate || h.date,
    description: h.description,
    type: h.type,
    classId: h.classId ?? null,
    studentId: h.studentId ?? null,
    createdAt: h.createdAt || null
});

export const holidayService = {
    getAll: async () => {
        const snap = await getDocs(query(collection(db, 'holidays'), orderBy('date', 'asc')));
        return snap.docs.map(d => normalize(d.id, d.data()));
    },

    create: async (holiday) => {
        const createdAt = new Date().toISOString();
        const payload = {
            date: holiday.date,
            endDate: holiday.endDate || holiday.date,
            description: holiday.description,
            type: holiday.type,
            classId: holiday.classId || null,
            studentId: holiday.studentId || null,
            createdAt
        };
        await setDoc(doc(db, 'holidays', holiday.id), payload);
        return { ...holiday, createdAt };
    },

    update: async (id, holiday) => {
        const allowed = ['date', 'endDate', 'description', 'type', 'classId', 'studentId'];
        const payload = {};
        allowed.forEach(k => {
            if (holiday[k] !== undefined) {
                payload[k] = (k === 'classId' || k === 'studentId')
                    ? (holiday[k] || null)
                    : holiday[k];
            }
        });
        if (Object.keys(payload).length) {
            await updateDoc(doc(db, 'holidays', id), payload);
        }
        return { ...holiday, id };
    },

    delete: async (id) => {
        await deleteDoc(doc(db, 'holidays', id));
        return id;
    },

    deleteByClass: async (classId) => {
        const snap = await getDocs(query(collection(db, 'holidays'), where('classId', '==', classId)));
        const refs = snap.docs.map(d => d.ref);
        const chunks = [];
        for (let i = 0; i < refs.length; i += 400) {
            chunks.push(refs.slice(i, i + 400));
        }
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(r => batch.delete(r));
            await batch.commit();
        }
        return classId;
    },

    deleteByStudent: async (studentId) => {
        const snap = await getDocs(query(collection(db, 'holidays'), where('studentId', '==', studentId)));
        const refs = snap.docs.map(d => d.ref);
        const chunks = [];
        for (let i = 0; i < refs.length; i += 400) {
            chunks.push(refs.slice(i, i + 400));
        }
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(r => batch.delete(r));
            await batch.commit();
        }
        return studentId;
    }
};
