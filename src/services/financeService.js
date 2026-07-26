import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    query,
    where
} from 'firebase/firestore';

const generateRecurringDates = (pattern) => {
    if (!pattern) return [];

    const dates = [];
    const { frequency, startDate, endDate } = pattern;

    if (frequency === 'weekly') {
        const { daysOfWeek } = pattern;
        const start = new Date(startDate);
        const end = new Date(endDate);

        const current = new Date(start);
        while (current <= end) {
            if (daysOfWeek.includes(current.getDay())) {
                const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                dates.push(dateStr);
            }
            current.setDate(current.getDate() + 1);
        }
    } else if (frequency === 'monthly') {
        const { dayOfMonth } = pattern;
        const start = new Date(startDate);
        const end = new Date(endDate);

        const current = new Date(start.getFullYear(), start.getMonth(), dayOfMonth);
        if (current < start) current.setMonth(current.getMonth() + 1);

        while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setMonth(current.getMonth() + 1);
        }
    }

    return dates;
};

const createChangeEntry = (action, user, details) => ({
    timestamp: new Date().toISOString(),
    action,
    user: user || 'admin',
    details: details || {}
});

const normalizeAttendance = (id, a) => ({
    id,
    studentId: a.studentId,
    date: a.date,
    fee: a.fee,
    notes: a.notes || '',
    isRecurring: a.isRecurring || false,
    recurringPattern: a.recurringPattern || null,
    createdBy: a.createdBy || 'legacy',
    createdAt: a.createdAt || new Date().toISOString(),
    updatedBy: a.updatedBy || null,
    updatedAt: a.updatedAt || null,
    changeHistory: a.changeHistory || []
});

export const financeService = {
    getFees: async () => {
        const snap = await getDocs(collection(db, 'fees'));
        return snap.docs.map(d => {
            const f = d.data();
            return {
                id: d.id,
                studentId: f.studentId,
                amount: f.amount,
                date: f.date,
                method: f.method,
                note: f.note
            };
        });
    },

    addFee: async (fee) => {
        const { id, ...rest } = fee;
        await setDoc(doc(db, 'fees', id), {
            ...rest,
            createdAt: new Date().toISOString()
        });
        return fee;
    },

    deleteFee: async (id) => {
        await deleteDoc(doc(db, 'fees', id));
        return id;
    },

    getAttendance: async () => {
        const snap = await getDocs(collection(db, 'extra_attendance'));
        return snap.docs.map(d => normalizeAttendance(d.id, d.data()));
    },

    addAttendance: async (record) => {
        const now = new Date().toISOString();
        const user = record.createdBy || 'admin';
        const changeHistory = [createChangeEntry('created', user, { fee: record.fee, notes: record.notes })];

        const payload = {
            studentId: record.studentId,
            date: record.date,
            fee: record.fee,
            notes: record.notes || '',
            isRecurring: record.isRecurring || false,
            recurringPattern: record.recurringPattern || null,
            createdBy: user,
            createdAt: now,
            updatedBy: null,
            updatedAt: null,
            changeHistory
        };

        await setDoc(doc(db, 'extra_attendance', record.id), payload);
        return { id: record.id, ...payload };
    },

    bulkAddAttendance: async (records) => {
        const now = new Date().toISOString();
        const user = records[0]?.createdBy || 'admin';
        const results = [];

        const chunks = [];
        for (let i = 0; i < records.length; i += 400) {
            chunks.push(records.slice(i, i + 400));
        }

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(r => {
                const changeHistory = [createChangeEntry('created', user, { fee: r.fee, notes: r.notes })];
                const payload = {
                    studentId: r.studentId,
                    date: r.date,
                    fee: r.fee,
                    notes: r.notes || '',
                    isRecurring: r.isRecurring || false,
                    recurringPattern: r.recurringPattern || null,
                    createdBy: user,
                    createdAt: now,
                    updatedBy: null,
                    updatedAt: null,
                    changeHistory
                };
                batch.set(doc(db, 'extra_attendance', r.id), payload);
                results.push({ id: r.id, ...payload });
            });
            await batch.commit();
        }

        return results;
    },

    updateAttendance: async (id, data, user = 'admin') => {
        const ref = doc(db, 'extra_attendance', id);
        const currentSnap = await getDoc(ref);
        if (!currentSnap.exists()) throw new Error('Không tìm thấy ghi nhận buổi học.');
        const current = currentSnap.data();

        const now = new Date().toISOString();
        const changes = {};
        if (data.date !== undefined && data.date !== current.date) changes.date = { from: current.date, to: data.date };
        if (data.fee !== undefined && data.fee !== current.fee) changes.fee = { from: current.fee, to: data.fee };
        if (data.notes !== undefined && data.notes !== current.notes) changes.notes = { from: current.notes, to: data.notes };

        const newHistoryEntry = createChangeEntry('updated', user, changes);
        const updatedHistory = [...(current.changeHistory || []), newHistoryEntry];

        const payload = {
            updatedBy: user,
            updatedAt: now,
            changeHistory: updatedHistory
        };
        if (data.date !== undefined) payload.date = data.date;
        if (data.fee !== undefined) payload.fee = data.fee;
        if (data.notes !== undefined) payload.notes = data.notes;
        if (data.recurringPattern !== undefined) payload.recurringPattern = data.recurringPattern;

        await updateDoc(ref, payload);
        return { ...data, updatedBy: user, updatedAt: now, changeHistory: updatedHistory };
    },

    deleteAttendance: async (id) => {
        await deleteDoc(doc(db, 'extra_attendance', id));
        return id;
    },

    bulkDeleteAttendance: async (ids) => {
        if (!ids || ids.length === 0) return [];
        const chunks = [];
        for (let i = 0; i < ids.length; i += 400) {
            chunks.push(ids.slice(i, i + 400));
        }
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(id => batch.delete(doc(db, 'extra_attendance', id)));
            await batch.commit();
        }
        return ids;
    },

    deleteByStudent: async (studentId) => {
        const [feesSnap, attSnap] = await Promise.all([
            getDocs(query(collection(db, 'fees'), where('studentId', '==', studentId))),
            getDocs(query(collection(db, 'extra_attendance'), where('studentId', '==', studentId)))
        ]);

        const refs = [
            ...feesSnap.docs.map(d => d.ref),
            ...attSnap.docs.map(d => d.ref)
        ];

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
    },

    generateRecurringDates
};
