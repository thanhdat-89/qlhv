import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    writeBatch,
    query,
    orderBy
} from 'firebase/firestore';

const TABLES = ['classes', 'students', 'fees', 'extra_attendance', 'holidays', 'promotions', 'student_promotions'];

const dumpCollection = async (name) => {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const clearCollection = async (name) => {
    const snap = await getDocs(collection(db, name));
    const refs = snap.docs.map(d => d.ref);
    const chunks = [];
    for (let i = 0; i < refs.length; i += 400) chunks.push(refs.slice(i, i + 400));
    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(r => batch.delete(r));
        await batch.commit();
    }
};

const restoreCollection = async (name, records) => {
    if (!records || records.length === 0) return;
    const chunks = [];
    for (let i = 0; i < records.length; i += 400) chunks.push(records.slice(i, i + 400));
    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(record => {
            const { id, ...rest } = record;
            if (id) {
                batch.set(doc(db, name, String(id)), rest);
            } else {
                batch.set(doc(collection(db, name)), rest);
            }
        });
        await batch.commit();
    }
};

export const backupService = {
    exportData: async () => {
        const result = {};
        for (const table of TABLES) {
            result[table] = await dumpCollection(table);
        }
        return result;
    },

    importData: async (backup) => {
        for (const table of TABLES) {
            if (!Array.isArray(backup[table])) {
                throw new Error(`Dữ liệu sao lưu không hợp lệ: Thiếu bảng ${table}`);
            }
        }

        const deleteOrder = ['extra_attendance', 'fees', 'holidays', 'promotions', 'student_promotions', 'students', 'classes'];
        for (const name of deleteOrder) await clearCollection(name);

        const insertOrder = ['classes', 'students', 'fees', 'extra_attendance', 'holidays', 'promotions', 'student_promotions'];
        for (const name of insertOrder) await restoreCollection(name, backup[name]);

        return true;
    },

    getBackups: async () => {
        const snap = await getDocs(query(collection(db, 'backups'), orderBy('createdAt', 'desc')));
        return snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                filename: data.filename,
                createdAt: data.createdAt
            };
        });
    },

    downloadBackup: async (id) => {
        const snap = await getDoc(doc(db, 'backups', id));
        if (!snap.exists()) throw new Error('Không tìm thấy bản sao lưu.');
        const data = snap.data();
        return { data: data.data, filename: data.filename };
    },

    createAutomatedBackup: async () => {
        const data = await backupService.exportData();
        const now = new Date();
        const filename = `auto_backup_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}.json`;

        await addDoc(collection(db, 'backups'), {
            data,
            filename,
            createdAt: now.toISOString()
        });

        const twentyEightDaysAgo = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000)).toISOString();
        const oldSnap = await getDocs(collection(db, 'backups'));
        const stale = oldSnap.docs.filter(d => (d.data().createdAt || '') < twentyEightDaysAgo);
        const chunks = [];
        for (let i = 0; i < stale.length; i += 400) chunks.push(stale.slice(i, i + 400));
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }

        return true;
    }
};
