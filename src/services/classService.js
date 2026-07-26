import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';

const col = () => collection(db, 'classes');

export const classService = {
    getAll: async () => {
        const snap = await getDocs(col());
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    create: async (newClass) => {
        const { id, ...rest } = newClass;
        await setDoc(doc(db, 'classes', id), {
            ...rest,
            createdAt: new Date().toISOString()
        });
        return newClass;
    },

    update: async (id, data) => {
        const allowed = ['name', 'category', 'schedule', 'feePerSession'];
        const payload = Object.fromEntries(
            Object.entries(data).filter(([k]) => allowed.includes(k))
        );
        if (Object.keys(payload).length === 0) return data;
        await updateDoc(doc(db, 'classes', id), payload);
        return data;
    },

    delete: async (id) => {
        await deleteDoc(doc(db, 'classes', id));
        return id;
    }
};
