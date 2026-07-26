import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from 'firebase/firestore';

const col = () => collection(db, 'messages');

const normalize = (id, m) => ({
    id,
    author: m.author || 'Admin',
    content: m.content,
    createdAt: m.createdAt
});

export const messageService = {
    getAll: async () => {
        const snap = await getDocs(query(col(), orderBy('createdAt', 'desc')));
        return snap.docs.map(d => normalize(d.id, d.data()));
    },

    add: async (message) => {
        const payload = {
            author: message.author || 'Admin',
            content: message.content,
            createdAt: new Date().toISOString()
        };
        const ref = await addDoc(col(), payload);
        return { id: ref.id, ...payload };
    },

    delete: async (id) => {
        await deleteDoc(doc(db, 'messages', id));
        return true;
    },

    update: async (id, updates) => {
        const ref = doc(db, 'messages', id);
        const allowed = ['author', 'content'];
        const payload = Object.fromEntries(
            Object.entries(updates).filter(([k]) => allowed.includes(k))
        );
        if (Object.keys(payload).length) {
            await updateDoc(ref, payload);
        }
        const snap = await getDoc(ref);
        return normalize(id, snap.data());
    }
};
