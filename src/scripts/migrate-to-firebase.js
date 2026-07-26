#!/usr/bin/env node
/**
 * Migration: Supabase -> Firestore (qua REST API, không cần service-account)
 *
 * Tiền điều kiện: .env có đủ:
 *   - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *   - VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID
 *
 * Đăng nhập Firebase bằng email/password admin đã tạo, rồi gọi Firestore REST API.
 * Chạy: npm run migrate:firebase
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const parseEnv = (raw) => {
    const out = {};
    raw.split('\n').forEach(line => {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m) out[m[1]] = m[2].trim();
    });
    return out;
};

const env = parseEnv(readFileSync(resolve(ROOT, '.env'), 'utf8'));

const required = [
    'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY',
    'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID'
];
const missing = required.filter(k => !env[k]);
if (missing.length) {
    console.error('Thiếu biến .env:', missing.join(', '));
    process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nguyenthanhdat.lamson@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Cqt@263';

const FIREBASE_PROJECT = env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_KEY = env.VITE_FIREBASE_API_KEY;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

let idToken = null;
let refreshToken = null;
let tokenExpiry = 0;

const signIn = async () => {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Sign-in failed: ${JSON.stringify(data)}`);
    idToken = data.idToken;
    refreshToken = data.refreshToken;
    tokenExpiry = Date.now() + (parseInt(data.expiresIn, 10) - 60) * 1000;
};

const refreshIdToken = async () => {
    const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
    idToken = data.id_token;
    refreshToken = data.refresh_token;
    tokenExpiry = Date.now() + (parseInt(data.expires_in, 10) - 60) * 1000;
};

const ensureToken = async () => {
    if (!idToken) return signIn();
    if (Date.now() >= tokenExpiry) return refreshIdToken();
};

// --- Firestore value encoding ---
const toFsValue = (v) => {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') {
        return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    }
    if (Array.isArray(v)) {
        return { arrayValue: { values: v.map(toFsValue) } };
    }
    if (typeof v === 'object') {
        const fields = {};
        Object.entries(v).forEach(([k, val]) => { fields[k] = toFsValue(val); });
        return { mapValue: { fields } };
    }
    return { stringValue: String(v) };
};

const toFsDoc = (data) => {
    const fields = {};
    Object.entries(data).forEach(([k, v]) => { fields[k] = toFsValue(v); });
    return { fields };
};

// --- REST writers ---
const commitBatch = async (writes) => {
    await ensureToken();
    const res = await fetch(`${FIRESTORE_BASE}:commit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ writes })
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Commit failed (${res.status}): ${text}`);
    }
};

const writeDocs = async (collection, docs) => {
    const CHUNK = 400;
    for (let i = 0; i < docs.length; i += CHUNK) {
        const slice = docs.slice(i, i + CHUNK);
        const writes = slice.map(({ id, data }) => ({
            update: {
                name: `projects/${FIREBASE_PROJECT}/databases/(default)/documents/${collection}/${id}`,
                ...toFsDoc(data)
            }
        }));
        await commitBatch(writes);
    }
};

// --- Mappers (snake_case -> camelCase) ---
const mapStudent = (s) => ({
    id: s.id,
    data: {
        name: s.name,
        birthYear: s.birth_year ?? null,
        phone: s.phone ?? null,
        enrollDate: s.enroll_date ?? null,
        leaveDate: s.leave_date ?? null,
        classId: s.class_id ?? null,
        status: s.status,
        statusHistory: s.status_history || [],
        discountRate: parseFloat(s.discount_rate) || 0,
        discountEndDate: s.discount_end_date ?? null,
        createdAt: s.created_at
    }
});

const mapClass = (c) => ({
    id: c.id,
    data: {
        name: c.name,
        category: c.category,
        schedule: c.schedule,
        feePerSession: c.fee_per_session || 0,
        createdAt: c.created_at
    }
});

const mapFee = (f) => ({
    id: f.id,
    data: {
        studentId: f.student_id,
        amount: f.amount,
        date: f.date,
        method: f.method,
        note: f.note,
        createdAt: f.created_at
    }
});

const mapAttendance = (a) => ({
    id: a.id,
    data: {
        studentId: a.student_id,
        date: a.date,
        fee: a.fee,
        notes: a.notes || '',
        isRecurring: a.is_recurring || false,
        recurringPattern: a.recurring_pattern || null,
        createdBy: a.created_by || 'legacy',
        createdAt: a.created_at,
        updatedBy: a.updated_by || null,
        updatedAt: a.updated_at || null,
        changeHistory: a.change_history || []
    }
});

const mapHoliday = (h) => ({
    id: h.id,
    data: {
        date: h.date,
        endDate: h.end_date || h.date,
        description: h.description,
        type: h.type,
        classId: h.class_id || null,
        studentId: h.student_id || null,
        createdAt: h.created_at
    }
});

const mapPromotion = (p) => ({
    id: String(p.id),
    data: {
        classId: p.class_id,
        month: p.month,
        discountRate: parseFloat(p.discount_rate) || 0,
        discountAmount: parseFloat(p.discount_amount) || 0,
        discountType: p.discount_type || 'percent',
        excludedStudentIds: p.excluded_student_ids || [],
        description: p.description || '',
        createdAt: p.created_at
    }
});

const mapStudentPromotion = (p) => ({
    id: String(p.id),
    data: {
        studentId: p.student_id,
        month: p.month,
        discountRate: parseFloat(p.discount_rate) || 0,
        discountAmount: parseFloat(p.discount_amount) || 0,
        discountType: p.discount_type || 'percent',
        description: p.description || '',
        createdAt: p.created_at
    }
});

const mapMessage = (m) => ({
    id: String(m.id),
    data: {
        author: m.author || 'Admin',
        content: m.content,
        createdAt: m.created_at
    }
});

const mapBackup = (b) => ({
    id: String(b.id),
    data: {
        data: b.data,
        filename: b.filename,
        createdAt: b.created_at
    }
});

// --- Supabase reader ---
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { 'x-app-secret': 'cqt263' } }
});

const fetchAll = async (table) => {
    const all = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
    }
    return all;
};

const migrateTable = async (name, mapper) => {
    process.stdout.write(`[${name}] fetching... `);
    const rows = await fetchAll(name);
    process.stdout.write(`${rows.length} rows. writing... `);
    const docs = rows.map(mapper);
    await writeDocs(name, docs);
    console.log('ok');
    return rows.length;
};

const main = async () => {
    await signIn();
    console.log(`Signed in as ${ADMIN_EMAIL}\n`);

    const counts = {};
    counts.classes = await migrateTable('classes', mapClass);
    counts.students = await migrateTable('students', mapStudent);
    counts.fees = await migrateTable('fees', mapFee);
    counts.extra_attendance = await migrateTable('extra_attendance', mapAttendance);
    counts.holidays = await migrateTable('holidays', mapHoliday);
    counts.promotions = await migrateTable('promotions', mapPromotion);
    counts.student_promotions = await migrateTable('student_promotions', mapStudentPromotion);
    counts.messages = await migrateTable('messages', mapMessage);
    counts.backups = await migrateTable('backups', mapBackup);

    console.log('\n=== Migration summary ===');
    Object.entries(counts).forEach(([k, v]) => console.log(`  ${k.padEnd(20)} ${v}`));
    console.log('\nDone.');
};

main().catch(err => {
    console.error('\nMigration failed:', err.message || err);
    process.exit(1);
});
