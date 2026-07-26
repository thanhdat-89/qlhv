import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from 'firebase/firestore';

const col = () => collection(db, 'student_promotions');

const normalize = (id, p) => ({
    id,
    studentId: p.studentId,
    month: p.month,
    discountRate: parseFloat(p.discountRate) || 0,
    discountAmount: parseFloat(p.discountAmount) || 0,
    discountType: p.discountType || 'percent',
    description: p.description
});

const payloadFrom = (promotion) => ({
    studentId: promotion.studentId,
    month: promotion.month,
    discountRate: promotion.discountType === 'percent' ? (promotion.discountRate || 0) : 0,
    discountAmount: promotion.discountType === 'amount' ? (promotion.discountAmount || 0) : 0,
    discountType: promotion.discountType || 'percent',
    description: promotion.description || ''
});

export const studentPromotionService = {
    getAll: async () => {
        const snap = await getDocs(query(col(), orderBy('month', 'desc')));
        return snap.docs.map(d => normalize(d.id, d.data()));
    },

    create: async (promotion) => {
        const ref = await addDoc(col(), {
            ...payloadFrom(promotion),
            createdAt: new Date().toISOString()
        });
        return { id: ref.id, ...promotion };
    },

    update: async (id, promotion) => {
        await updateDoc(doc(db, 'student_promotions', id), payloadFrom(promotion));
        return promotion;
    },

    delete: async (id) => {
        await deleteDoc(doc(db, 'student_promotions', id));
        return id;
    }
};
