import { supabase } from '../lib/supabase';

export const financeService = {
    getFees: async () => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('fees')
            .select('*');
        if (error) throw error;

        return (data || []).map(f => ({
            id: f.id,
            studentId: f.student_id,
            amount: f.amount,
            date: f.date,
            method: f.method,
            note: f.note
        }));
    },

    addFee: async (fee) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const dbFee = {
            id: fee.id,
            student_id: fee.studentId,
            amount: fee.amount,
            date: fee.date,
            method: fee.method,
            note: fee.note
        };
        const { error } = await supabase
            .from('fees')
            .insert(dbFee);
        if (error) throw error;
        return fee;
    },

    deleteFee: async (id) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const { error } = await supabase
            .from('fees')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return id;
    },

    getAttendance: async () => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('extra_attendance')
            .select('*');
        if (error) throw error;

        return (data || []).map(a => ({
            id: a.id,
            studentId: a.student_id,
            date: a.date,
            status: a.status,
            isExcused: a.is_excused,
            fee: a.fee,
            notes: a.notes || ''
        }));
    },

    addAttendance: async (record) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const dbRecord = {
            id: record.id,
            student_id: record.studentId,
            date: record.date,
            status: record.status,
            is_excused: record.isExcused,
            fee: record.fee,
            notes: record.notes || ''
        };
        const { data, error } = await supabase
            .from('extra_attendance')
            .insert(dbRecord)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (addAttendance):', error);
            throw error;
        }
        return {
            ...record,
            ...data,
            studentId: data.student_id // Map back to camelCase
        };
    },

    bulkAddAttendance: async (records) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const dbRecords = records.map(r => ({
            id: r.id,
            student_id: r.studentId,
            date: r.date,
            status: r.status,
            is_excused: r.isExcused,
            fee: r.fee,
            notes: r.notes || ''
        }));

        const { data, error } = await supabase
            .from('extra_attendance')
            .insert(dbRecords)
            .select();

        if (error) {
            console.error('Supabase Error (bulkAddAttendance):', error);
            throw error;
        }
        return data.map(d => ({
            ...records.find(r => r.id === d.id),
            ...d,
            studentId: d.student_id
        }));
    },

    updateAttendance: async (id, data) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const dbData = {};
        if (data.studentId !== undefined) dbData.student_id = data.studentId;
        if (data.date !== undefined) dbData.date = data.date;
        if (data.status !== undefined) dbData.status = data.status;
        if (data.isExcused !== undefined) dbData.is_excused = data.isExcused;
        if (data.fee !== undefined) dbData.fee = data.fee;
        if (data.notes !== undefined) dbData.notes = data.notes;

        const { error } = await supabase
            .from('extra_attendance')
            .update(dbData)
            .eq('id', id);
        if (error) throw error;
        return data;
    },

    deleteAttendance: async (id) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const { error } = await supabase
            .from('extra_attendance')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return id;
    },

    deleteByStudent: async (studentId) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');

        // Delete all fees for this student
        const { error: feeError } = await supabase
            .from('fees')
            .delete()
            .eq('student_id', studentId);
        if (feeError) throw feeError;

        // Delete all attendance for this student
        const { error: attError } = await supabase
            .from('extra_attendance')
            .delete()
            .eq('student_id', studentId);
        if (attError) throw attError;

        return studentId;
    }
};
