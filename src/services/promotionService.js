import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';

const col = () => collection(db, 'promotions');

const normalize = (id, p) => ({
    id,
    classId: p.classId,
    month: p.month,
    discountRate: parseFloat(p.discountRate) || 0,
    discountAmount: parseFloat(p.discountAmount) || 0,
    discountType: p.discountType || 'percent',
    excludedStudentIds: p.excludedStudentIds || [],
    description: p.description
});

const payloadFrom = (promotion) => ({
    classId: promotion.classId,
    month: promotion.month,
    discountRate: promotion.discountType === 'percent' ? (promotion.discountRate || 0) : 0,
    discountAmount: promotion.discountType === 'amount' ? (promotion.discountAmount || 0) : 0,
    discountType: promotion.discountType || 'percent',
    excludedStudentIds: promotion.excludedStudentIds || [],
    description: promotion.description || ''
});

export const promotionService = {
    getAll: async () => {
        const snap = await getDocs(col());
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
        await updateDoc(doc(db, 'promotions', id), payloadFrom(promotion));
        return promotion;
    },

    delete: async (id) => {
        await deleteDoc(doc(db, 'promotions', id));
        return id;
    }
};
